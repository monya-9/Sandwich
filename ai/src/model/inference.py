from pathlib import Path
import os, json, requests
from typing import List, Dict

import numpy as np
import torch
from torch import nn

# ---------- 안전 임포트 ----------
try:
    from model import FeatureDeepRec
except Exception:
    import sys
    THIS_FILE = Path(__file__).resolve()
    PROJECT_ROOT = THIS_FILE.parents[2]
    SRC_DIR = PROJECT_ROOT / "src"
    if str(SRC_DIR) not in sys.path:
        sys.path.insert(0, str(SRC_DIR))
    from model.model import FeatureDeepRec

# ---------- 경로/환경 ----------
BASE = Path(__file__).resolve().parents[2]
DATA = BASE / "data"
MAPD = DATA / "mappings"
UFNP = DATA / "user_skills.npy"
IFNP = DATA / "project_tools.npy"
DEFAULT_MODEL_PATH = BASE / "models" / "best_feature_deeprec.pth"

API_BASE      = os.getenv("API_BASE", "https://api.dnutzs.org")
AI_API_KEY    = os.getenv("AI_API_KEY", "test")
HTTP_TIMEOUT  = int(os.getenv("HTTP_TIMEOUT", "30"))
TOPK          = int(os.getenv("TOPK", "50"))
BATCH_USERS   = int(os.getenv("BATCH_USERS", "64"))
BATCH_ITEMS   = int(os.getenv("BATCH_ITEMS", "2048"))
MODEL_PATH    = Path(os.getenv("MODEL_PATH", str(DEFAULT_MODEL_PATH)))

# ---------- 유틸 ----------
def get_device() -> torch.device:
    return torch.device("cuda" if torch.cuda.is_available() else "cpu")

class autocast_cm:
    """torch.cuda.amp.autocast() 래퍼 (CPU일 때 비활성)"""
    def __init__(self, enabled: bool):
        self.ctx = torch.cuda.amp.autocast(enabled=enabled)
    def __enter__(self): return self.ctx.__enter__()
    def __exit__(self, exc_type, exc, tb): return self.ctx.__exit__(exc_type, exc, tb)

def _post(path: str, payload: dict) -> dict:
    url = f"{API_BASE}{path}"
    headers = {"Content-Type": "application/json", "X-AI-API-Key": AI_API_KEY}
    r = requests.post(url, headers=headers, data=json.dumps(payload), timeout=HTTP_TIMEOUT)
    if r.status_code >= 400:
        raise RuntimeError(f"worker_error status={r.status_code} url={url} body={r.text}")
    return r.json()

def upsert_user(u_idx: int, items: List[Dict], replace: bool = True) -> dict:
    """
    단일 유저 업서트.
    items 예: [{"project_id":101,"score":0.91}, ...]
    """
    body = {"u_idx": int(u_idx), "items": items, "replace": bool(replace)}
    return _post("/api/reco/admin/upsert/user", body)

# ---------- 관대한 체크포인트 로더 ----------
def load_checkpoint_forgiving(model: torch.nn.Module, state: dict, verbose: bool = True):
    """
    - 크기 같은 텐서는 그대로 로드
    - item_id_emb.weight: 행(아이템 수) 겹치는 부분만 복사
    - 그 외 모양 불일치는 스킵(초기화값 유지)
    """
    current = model.state_dict()
    copied, skipped = [], []
    for k, v in state.items():
        if k not in current:
            skipped.append((k, "missing in current model")); continue
        tgt = current[k]
        if tgt.shape == v.shape:
            current[k] = v; copied.append((k, "exact")); continue
        if k.endswith("item_id_emb.weight") and v.dim()==2 and tgt.dim()==2 and v.shape[1]==tgt.shape[1]:
            n = min(v.shape[0], tgt.shape[0])
            if n > 0:
                tgt[:n].copy_(v[:n]); copied.append((k, f"partial rows={n}/{tgt.shape[0]}")); continue
        skipped.append((k, f"shape mismatch ckpt={tuple(v.shape)} model={tuple(tgt.shape)}"))
    model.load_state_dict(current, strict=False)
    if verbose:
        print("[ckpt] copied:");  [print("  -", k, "→", why) for k, why in copied]
        print("[ckpt] skipped:"); [print("  -", k, "→", why) for k, why in skipped]

# ---------- 추론 ----------
@torch.no_grad()
def infer_topk_for_users(
    model: nn.Module,
    U: np.ndarray,
    I: np.ndarray,
    user_ids: List[int],
    pidx_to_pid: Dict[int, int],
    device: torch.device,
    topk: int = TOPK,
    batch_items: int = BATCH_ITEMS,
) -> Dict[int, List[Dict]]:
    """
    반환: { u_idx: [{"project_id":pid, "score":float}, ...], ... }
    """
    model.eval()
    results: Dict[int, List[Dict]] = {}
    U_t = torch.from_numpy(U).to(device)
    I_t = torch.from_numpy(I).to(device)
    num_items = I.shape[0]
    item_indices = torch.arange(num_items, dtype=torch.long, device=device)

    for u in user_ids:
        u = int(u)
        if not (0 <= u < U.shape[0]):  # 범위 체크
            continue

        parts = []
        u_id = torch.tensor([u], dtype=torch.long, device=device)
        u_feat = U_t[u].unsqueeze(0)
        for start in range(0, num_items, batch_items):
            end = min(start + batch_items, num_items)
            i_ids  = item_indices[start:end]
            i_feat = I_t[start:end]
            u_ids  = u_id.repeat(end - start)
            u_feats= u_feat.repeat(end - start, 1)
            with autocast_cm(enabled=(device.type == "cuda")):
                logits = model(u_ids, i_ids, u_feats, i_feat, return_logits=True)
                parts.append(torch.sigmoid(logits).detach().float().cpu().numpy())

        scores = np.concatenate(parts, axis=0)
        k = min(int(topk), num_items)
        top_idx = np.argpartition(scores, -k)[-k:]
        top_sorted = top_idx[np.argsort(scores[top_idx])[::-1]]
        items = [{"project_id": int(pidx_to_pid[int(p)]), "score": float(scores[int(p)])} for p in top_sorted]
        results[u] = items
    return results

# ---------- 메인 ----------
def main():
    # 1) 특징행렬 로드
    if not UFNP.exists() or not IFNP.exists():
        raise SystemExit(f"missing feature files: {UFNP} or {IFNP}")
    U = np.load(str(UFNP)); I = np.load(str(IFNP))
    num_users, num_items = U.shape[0], I.shape[0]
    print(f"[load] U: {U.shape}, I: {I.shape}")

    # 2) 매핑 로드
    users_map_path = MAPD / "users.json"
    projects_rev_path = MAPD / "projects_rev.json"
    if not users_map_path.exists() or not projects_rev_path.exists():
        raise SystemExit("missing mappings: users.json or projects_rev.json")
    with open(users_map_path, "r", encoding="utf-8") as f:
        users_map = json.load(f)
    with open(projects_rev_path, "r", encoding="utf-8") as f:
        pidx_to_pid = {int(k): int(v) for k, v in json.load(f).items()}

    user_ids = sorted([int(k) for k in users_map.keys() if 0 <= int(k) < num_users])
    if not user_ids:
        raise SystemExit("no users to infer")

    # 3) 모델 로드 (+관대한 로더)
    dev = get_device()
    print(f"[device] {dev}")
    model = FeatureDeepRec(num_users=num_users, num_items=num_items,
                           user_feat_dim=U.shape[1], item_feat_dim=I.shape[1]).to(dev)
    if not MODEL_PATH.exists():
        raise SystemExit(f"model checkpoint not found: {MODEL_PATH}")
    ckpt = torch.load(str(MODEL_PATH), map_location=dev)
    state = ckpt.get("model_state_dict", ckpt)
    load_checkpoint_forgiving(model, state, verbose=True)
    model.eval()
    print(f"[load] checkpoint: {MODEL_PATH}")

    # 4) 추론 → 단일 업서트(반복)
    wrote = 0
    for s in range(0, len(user_ids), BATCH_USERS):
        e = min(s + BATCH_USERS, len(user_ids))
        batch_u = user_ids[s:e]
        per_user_items = infer_topk_for_users(model, U, I, batch_u, pidx_to_pid, dev, TOPK, BATCH_ITEMS)
        for u_idx, items in per_user_items.items():
            if not items: continue
            res = upsert_user(u_idx=int(u_idx), items=items, replace=True)
            wrote += 1
            print(f"[upsert] user {u_idx}: {res}")
    print(f"[done] upserted users: {wrote}")

if __name__ == "__main__":
    main()
