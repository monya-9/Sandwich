import math
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

from ai.src.model.model import NeuMF

# ─── 프로젝트 루트 & 데이터 경로 ─────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data"
INTERACTIONS_CSV = DATA_DIR / "interactions.csv"

# ─── 디바이스 선택 & 최적화 ────────────────────────────────────────────────────
def get_device():
    if torch.cuda.is_available():
        device = torch.device("cuda")
        print(f"GPU: {torch.cuda.get_device_name(0)} (CUDA {torch.version.cuda})")
        torch.backends.cudnn.benchmark = True
    else:
        device = torch.device("cpu")
        print("CPU")
    return device

def estimate_batch_size(device, default_bs=1024, min_bs=32):
    if device.type == "cuda":
        props = torch.cuda.get_device_properties(device)
        total_gb = props.total_memory / (1024**3)
        factor = min(max(total_gb / 8, 0.125), 1.0)
        bs = int(default_bs * factor)
        return max(bs, min_bs)
    else:
        return default_bs

# ─── Dataset 정의 ───────────────────────────────────────────────────────────────
class InteractionDataset(Dataset):
    def __init__(self, interactions: np.ndarray):
        self.users  = torch.LongTensor(interactions[:, 0])
        self.items  = torch.LongTensor(interactions[:, 1])
        self.labels = torch.FloatTensor(interactions[:, 2])

    def __len__(self):
        return len(self.users)

    def __getitem__(self, idx):
        return self.users[idx], self.items[idx], self.labels[idx]

# 학습 메인 ─────────────────────────────────────────────────────────────────
def main():
    # 1) 데이터 로드
    if not INTERACTIONS_CSV.exists():
        raise FileNotFoundError(f"{INTERACTIONS_CSV} 이(가) 없습니다. 먼저 데이터를 생성하세요.")
    raw = np.loadtxt(INTERACTIONS_CSV, delimiter=",", skiprows=1, usecols=(0,1,2))

    max_w = raw[:, 2].max()
    raw[:, 2] = raw[:, 2] / max_w
    print(f"Labels normalized by max weight {max_w}")

    num_users = int(raw[:,0].max() + 1)
    num_items = int(raw[:,1].max() + 1)

    # 2) 디바이스 & 배치 사이즈 설정
    device     = get_device()
    batch_size = estimate_batch_size(device, default_bs=1024)
    print(f"Batch size: {batch_size}")
    loader = DataLoader(
        InteractionDataset(raw),
        batch_size=batch_size,
        shuffle=True,
        pin_memory=(device.type == "cuda")
    )

    # 3) 모델, 옵티마이저, 손실함수 준비
    model     = NeuMF(num_users, num_items).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
    criterion = nn.BCELoss()

    # 4) 학습 루프
    epochs = 5
    for epoch in range(1, epochs + 1):
        model.train()
        total_loss = 0.0
        for users, items, labels in loader:
            try:
                users  = users.to(device, non_blocking=True)
                items  = items.to(device, non_blocking=True)
                labels = labels.to(device, non_blocking=True)

                preds = model(users, items)
                loss  = criterion(preds, labels)

                optimizer.zero_grad()
                loss.backward()
                optimizer.step()
                total_loss += loss.item()

            except RuntimeError as e:
                if "out of memory" in str(e):
                    print(f"[Epoch {epoch}] WARNING: OOM 발생, 해당 배치 스킵 및 캐시 비움")
                    torch.cuda.empty_cache()
                    continue
                else:
                    raise

        avg_loss = total_loss / math.ceil(len(raw) / batch_size)
        print(f"[Epoch {epoch}/{epochs}] Avg Loss: {avg_loss:.4f}")

    # 5) 모델 저장
    save_path = BASE_DIR / "models" / "neumf.pth"
    save_path.parent.mkdir(exist_ok=True, parents=True)
    torch.save(model.state_dict(), save_path)
    print(f"모델 저장: {save_path}")

if __name__ == "__main__":
    main()
