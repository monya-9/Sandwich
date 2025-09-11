from pathlib import Path
import numpy as np
import torch, torch.nn as nn
from torch.utils.data import Dataset, DataLoader, random_split
from src.model.model import FeatureDeepRec
from src.utils.io import load_json
from contextlib import nullcontext

BASE = Path(__file__).resolve().parents[2]
DATA = BASE / "data"
CSV  = DATA / "interactions.csv"
UFNP = DATA / "user_skills.npy"
IFNP = DATA / "project_tools.npy"
MODEL= BASE / "models" / "best_feature_deeprec.pth"

class InterDs(Dataset):
    def __init__(self, arr, U, I):
        self.u = torch.LongTensor(arr[:,0])
        self.i = torch.LongTensor(arr[:,1])
        self.y = torch.FloatTensor(arr[:,2])
        self.U = torch.FloatTensor(U)
        self.I = torch.FloatTensor(I)
    def __len__(self): return len(self.u)
    def __getitem__(self, k):
        u,i,y = self.u[k], self.i[k], self.y[k]
        return u, i, self.U[u], self.I[i], y

def get_device():
    if torch.cuda.is_available():
        torch.backends.cudnn.benchmark=True
        print("✔ GPU:", torch.cuda.get_device_name(0))
        return torch.device("cuda")
    print("✔ CPU"); return torch.device("cpu")

def autocast_cm(enabled: bool):
    if not enabled:
        return nullcontext()
    # Prefer torch.amp.autocast with device_type when available
    try:
        return torch.amp.autocast(device_type='cuda', enabled=True)
    except TypeError:
        # Older torch.amp.autocast without device_type
        try:
            return torch.amp.autocast(enabled=True)
        except AttributeError:
            # Very old versions only have torch.cuda.amp.autocast
            return torch.cuda.amp.autocast(enabled=True)

def main():
    arr = np.loadtxt(CSV, delimiter=",", skiprows=1)  # u_idx,p_idx,label
    U = np.load(UFNP); I = np.load(IFNP)
    num_users, num_items = U.shape[0], I.shape[0]

    ds = InterDs(arr, U, I)
    val = int(len(ds)*0.2)
    tr, va = random_split(ds, [len(ds)-val, val])

    dev = get_device()
    bs  = 1024 if dev.type=="cpu" else max(64, int(1024 * min(1.0, torch.cuda.get_device_properties(dev).total_memory/(8*(1024**3)))))
    tl  = DataLoader(tr, batch_size=bs, shuffle=True, pin_memory=(dev.type=="cuda"))
    vl  = DataLoader(va, batch_size=bs, shuffle=False, pin_memory=(dev.type=="cuda"))

    model = FeatureDeepRec(num_users, num_items, U.shape[1], I.shape[1]).to(dev)
    opt = torch.optim.Adam(model.parameters(), lr=1e-3, weight_decay=1e-5)

    def make_plateau(optimizer):
        try:
            return torch.optim.lr_scheduler.ReduceLROnPlateau(
                optimizer, mode='min', factor=0.5, patience=3, verbose=True
            )
        except TypeError:
            # verbose 미지원 버전 호환
            return torch.optim.lr_scheduler.ReduceLROnPlateau(
                optimizer, mode='min', factor=0.5, patience=3
            )

    sch = make_plateau(opt)
    crit = nn.BCEWithLogitsLoss()

    best=float("inf"); patience=0
    MODEL.parent.mkdir(parents=True, exist_ok=True)

    try:
        scaler = torch.amp.GradScaler(device_type='cuda', enabled=(dev.type=="cuda"))
    except TypeError:
        scaler = torch.amp.GradScaler(enabled=(dev.type=="cuda"))
    except AttributeError:
        scaler = torch.cuda.amp.GradScaler(enabled=(dev.type=="cuda"))
    accum_steps = 2 if (dev.type=="cuda" and bs>=128) else 1
    max_grad_norm = 1.0

    for ep in range(1, 40):  # 조금 더 학습
        model.train(); tr_loss=0.0
        opt.zero_grad(set_to_none=True)
        step=0
        for u,i,uf,if_,y in tl:
            u,i,uf,if_,y = u.to(dev),i.to(dev),uf.to(dev),if_.to(dev),y.to(dev)
            try:
                with autocast_cm(enabled=(dev.type=="cuda")):
                    logits = model(u,i,uf,if_, return_logits=True)
                    loss = crit(logits, y)
                    loss = loss / accum_steps
                scaler.scale(loss).backward()

                if (step + 1) % accum_steps == 0:
                    # Unscale before clipping when using GradScaler
                    scaler.unscale_(opt)
                    torch.nn.utils.clip_grad_norm_(model.parameters(), max_grad_norm)
                    scaler.step(opt)
                    scaler.update()
                    opt.zero_grad(set_to_none=True)
                tr_loss += loss.item() * accum_steps
                step += 1
            except RuntimeError as e:
                if "out of memory" in str(e).lower():
                    print("⚠ CUDA OOM: skipping batch, clearing cache")
                    opt.zero_grad(set_to_none=True)
                    if dev.type=="cuda":
                        torch.cuda.empty_cache()
                    continue
                else:
                    raise
        tr_loss /= max(len(tl),1)

        model.eval(); va_loss=0.0
        with torch.no_grad():
            for u,i,uf,if_,y in vl:
                u,i,uf,if_,y = u.to(dev),i.to(dev),uf.to(dev),if_.to(dev),y.to(dev)
                with autocast_cm(enabled=(dev.type=="cuda")):
                    logits = model(u,i,uf,if_, return_logits=True)
                    va_loss += crit(logits, y).item()
        va_loss /= max(len(vl),1)
        print(f"[{ep}] train {tr_loss:.4f} | val {va_loss:.4f} | bs {bs} acc {accum_steps} AMP {(dev.type=='cuda')}")

        sch.step(va_loss)
        if va_loss < best:
            best=va_loss; patience=0
            torch.save({
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': opt.state_dict(),
                'scaler_state_dict': scaler.state_dict(),
                'epoch': ep,
                'val_loss': va_loss,
            }, MODEL)
            print("✔ saved:", MODEL)
        else:
            patience+=1
            if patience>=6:
                print("⚠ early stop"); break

    print("done. best:", best)

if __name__=="__main__":
    main()
