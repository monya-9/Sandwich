import math
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader, random_split

from ai.src.model.model import FeatureDeepRec

# ─── 프로젝트 루트 & 데이터 경로 ─────────────────────────────────────────────
BASE_DIR          = Path(__file__).resolve().parents[2]
DATA_DIR          = BASE_DIR / "data"
INTERACTIONS_CSV  = DATA_DIR / "interactions.csv"
USER_FEAT_NPY     = DATA_DIR / "user_skills.npy"
ITEM_FEAT_NPY     = DATA_DIR / "project_tools.npy"
BEST_MODEL_PATH   = BASE_DIR / "models" / "best_feature_deeprec.pth"

# ─── 디바이스 감지 & 배치사이즈 추정 ────────────────────────────────────────────
def get_device():
    if torch.cuda.is_available():
        device = torch.device("cuda")
        torch.backends.cudnn.benchmark = True
        print(f"✔ Using GPU ({torch.cuda.get_device_name(0)})")
    else:
        device = torch.device("cpu")
        print("✔ Using CPU")
    return device

def estimate_batch_size(device, default_bs=1024, min_bs=32):
    if device.type == "cuda":
        total_gb = torch.cuda.get_device_properties(device).total_memory / (1024**3)
        factor = min(max(total_gb / 8, 0.125), 1.0)
        return max(int(default_bs * factor), min_bs)
    return default_bs

# ─── Dataset 정의 ───────────────────────────────────────────────────────────────
class InteractionDataset(Dataset):
    def __init__(self, interactions: np.ndarray, user_feats: np.ndarray, item_feats: np.ndarray):
        self.users      = torch.LongTensor(interactions[:, 0])
        self.items      = torch.LongTensor(interactions[:, 1])
        # labels는 0~1로 정규화된 실수
        self.labels     = torch.FloatTensor(interactions[:, 2])
        # 특성 벡터 텐서화
        self.u_feats    = torch.FloatTensor(user_feats)
        self.i_feats    = torch.FloatTensor(item_feats)

    def __len__(self):
        return len(self.users)

    def __getitem__(self, idx):
        u = self.users[idx]
        i = self.items[idx]
        return (
            u,
            i,
            self.u_feats[u],       # 해당 유저의 스킬 벡터
            self.i_feats[i],       # 해당 아이템의 툴 벡터
            self.labels[idx]
        )

# ─── 학습 & 검증 루프 ─────────────────────────────────────────────────────────
def main():
    raw = np.loadtxt(INTERACTIONS_CSV, delimiter=",", skiprows=1, usecols=(0,1,2))
    raw[:, 2] = raw[:, 2] / raw[:, 2].max()
    user_feats = np.load(USER_FEAT_NPY)
    item_feats = np.load(ITEM_FEAT_NPY)

    num_users = int(raw[:, 0].max() + 1)
    num_items = int(raw[:, 1].max() + 1)

    full_ds = InteractionDataset(raw, user_feats, item_feats)
    val_size = int(len(full_ds) * 0.2)
    train_ds, val_ds = random_split(full_ds, [len(full_ds) - val_size, val_size])

    device     = get_device()
    batch_size = estimate_batch_size(device)
    print(f"✔ Batch size: {batch_size}")

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, pin_memory=(device.type=="cuda"))
    val_loader   = DataLoader(val_ds,   batch_size=batch_size, shuffle=False, pin_memory=(device.type=="cuda"))

    u_feat_dim = user_feats.shape[1]
    i_feat_dim = item_feats.shape[1]
    model = FeatureDeepRec(num_users, num_items, u_feat_dim, i_feat_dim).to(device)

    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode='min', factor=0.5, patience=3, verbose=True
    )
    criterion = nn.BCELoss()

    best_val_loss = float('inf')
    patience_cnt  = 0
    max_epochs    = 30

    for epoch in range(1, max_epochs + 1):
        model.train()
        train_loss = 0.0
        for u, i, uf, itf, l in train_loader:
            u, i, uf, itf, l = u.to(device), i.to(device), uf.to(device), itf.to(device), l.to(device)
            pred = model(u, i, uf, itf)
            loss = criterion(pred, l)
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            train_loss += loss.item()
        train_loss /= len(train_loader)

        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for u, i, uf, itf, l in val_loader:
                u, i, uf, itf, l = u.to(device), i.to(device), uf.to(device), itf.to(device), l.to(device)
                val_loss += criterion(model(u, i, uf, itf), l).item()
        val_loss /= len(val_loader)

        print(f"[Epoch {epoch}] Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f}")

        scheduler.step(val_loss)
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            torch.save(model.state_dict(), BEST_MODEL_PATH)
            patience_cnt = 0
            print(f"✔ New best model saved (Val Loss: {best_val_loss:.4f})")
        else:
            patience_cnt += 1
            if patience_cnt >= 5:
                print("⚠ Early stopping triggered")
                break

    print("학습완료 :", BEST_MODEL_PATH)

if __name__ == "__main__":
    main()
