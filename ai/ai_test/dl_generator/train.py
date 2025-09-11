from __future__ import annotations
import argparse
from pathlib import Path
import math
import time
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset

try:
    from .dataset import load_corpus, DATA_ROOT
    from .model import ByteLSTM, byte_tokenize, estimate_bpc
except ImportError:
    from ai_test.dl_generator.dataset import load_corpus, DATA_ROOT
    from ai_test.dl_generator.model import ByteLSTM, byte_tokenize, estimate_bpc

BASE = Path(__file__).resolve().parents[2]
MODELS = BASE / "models"
CKPT = MODELS / "dl_problem_gen.pth"


class ChunkedBytes(Dataset):
    def __init__(self, data: torch.Tensor, ctx: int):
        self.data = data
        self.ctx = ctx
    def __len__(self):
        return max(0, len(self.data) - self.ctx - 1)
    def __getitem__(self, idx):
        x = self.data[idx:idx+self.ctx]
        y = self.data[idx+1:idx+self.ctx+1]
        return x, y


def get_device():
    if torch.cuda.is_available():
        try:
            name = torch.cuda.get_device_name(0)
            print(f"✔ GPU: {name}")
        except Exception:
            print("✔ GPU available")
        return torch.device("cuda")
    print("✔ CPU")
    return torch.device("cpu")


def train(args):
    t0 = time.time()
    print("Loading corpus from:", args.data_root)
    corpus = load_corpus(Path(args.data_root))
    data = byte_tokenize(corpus)
    print(f"Corpus bytes: {len(data):,}")

    ds = ChunkedBytes(data, args.ctx)
    dl = DataLoader(ds, batch_size=args.batch_size, shuffle=True, drop_last=True)

    dev = get_device()
    model = ByteLSTM(vocab_size=256, emb=args.emb, hidden=args.hidden, layers=args.layers, dropout=args.dropout).to(dev)
    opt = torch.optim.Adam(model.parameters(), lr=args.lr)
    crit = nn.CrossEntropyLoss()

    MODELS.mkdir(parents=True, exist_ok=True)

    best = float('inf')
    for ep in range(1, args.epochs+1):
        model.train()
        total = 0.0
        n = 0
        for x, y in dl:
            x = x.to(dev)
            y = y.to(dev)
            logits, _ = model(x)
            loss = crit(logits.view(-1, 256), y.reshape(-1))
            opt.zero_grad(set_to_none=True)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            opt.step()

            total += loss.item()
            n += 1
        avg = total / max(1, n)
        bpc = estimate_bpc(avg)
        print(f"[ep {ep}] loss {avg:.4f} | bpc {bpc:.3f} | steps {n} | ctx {args.ctx} | bs {args.batch_size}")

        if avg < best:
            best = avg
            torch.save({
                'model_state_dict': model.state_dict(),
                'meta': {
                    'vocab_size': 256,
                    'emb': args.emb,
                    'hidden': args.hidden,
                    'layers': args.layers,
                    'dropout': args.dropout,
                    'ctx': args.ctx,
                }
            }, CKPT)
            print("✔ saved:", CKPT)

    print(f"done in {time.time()-t0:.1f}s. best loss {best:.4f}")


def parse_args():
    p = argparse.ArgumentParser(description="Train a byte-level LSTM on APPS dataset to generate coding problems")
    p.add_argument('--data-root', type=str, default=str(DATA_ROOT), help='APPS dataset root (default: ai/data/apps)')
    p.add_argument('--epochs', type=int, default=2)
    p.add_argument('--batch-size', type=int, default=64)
    p.add_argument('--lr', type=float, default=1e-3)
    p.add_argument('--ctx', type=int, default=512)
    p.add_argument('--emb', type=int, default=256)
    p.add_argument('--hidden', type=int, default=512)
    p.add_argument('--layers', type=int, default=2)
    p.add_argument('--dropout', type=float, default=0.1)
    return p.parse_args()


if __name__ == '__main__':
    args = parse_args()
    train(args)
