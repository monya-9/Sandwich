from __future__ import annotations
import math
import torch
import torch.nn as nn


class ByteLSTM(nn.Module):
    def __init__(self, vocab_size: int = 256, emb: int = 256, hidden: int = 512, layers: int = 2, dropout: float = 0.1):
        super().__init__()
        self.vocab_size = vocab_size
        self.emb = nn.Embedding(vocab_size, emb)
        self.lstm = nn.LSTM(emb, hidden, num_layers=layers, batch_first=True, dropout=dropout)
        self.proj = nn.Linear(hidden, vocab_size)
        self.dropout = nn.Dropout(dropout)

        self.apply(self._init)

    def _init(self, m):
        if isinstance(m, nn.Linear):
            nn.init.xavier_uniform_(m.weight)
            if m.bias is not None:
                nn.init.zeros_(m.bias)
        elif isinstance(m, nn.Embedding):
            nn.init.normal_(m.weight, mean=0.0, std=0.02)

    def forward(self, x, h=None):
        # x: (B, T) int64
        e = self.dropout(self.emb(x))
        y, h = self.lstm(e, h)  # (B, T, H)
        y = self.dropout(y)
        logits = self.proj(y)   # (B, T, V)
        return logits, h

    @torch.no_grad()
    def generate(self, x, max_tokens: int = 256, temperature: float = 1.0):
        self.eval()
        h = None
        out = [x]
        inp = x
        for _ in range(max_tokens):
            logits, h = self.forward(inp, h)
            last = logits[:, -1, :] / max(temperature, 1e-4)
            probs = torch.softmax(last, dim=-1)
            next_tok = torch.multinomial(probs, num_samples=1)
            out.append(next_tok)
            inp = next_tok
        return torch.cat(out, dim=1)


def byte_tokenize(text: str) -> torch.Tensor:
    data = torch.tensor(list(text.encode('utf-8')), dtype=torch.long)
    return data


def byte_detokenize(toks: torch.Tensor) -> str:
    arr = toks.detach().cpu().tolist()
    arr = [max(0, min(255, int(x))) for x in arr]
    try:
        return bytes(arr).decode('utf-8', errors='ignore')
    except Exception:
        return bytes(arr).decode('latin1', errors='ignore')


def estimate_bpc(loss: float) -> float:
    return loss / math.log(2)
