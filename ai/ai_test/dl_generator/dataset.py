from __future__ import annotations
from pathlib import Path
import json
from typing import Iterator, List

BASE = Path(__file__).resolve().parents[2]
DATA_ROOT = BASE / "data" / "apps"


def _iter_json_files(root: Path) -> Iterator[Path]:
    for p in root.rglob("*.json"):
        if p.name.lower().endswith("train.json"):
            yield p
        else:
            yield p


def _iter_jsonl(path: Path) -> Iterator[dict]:
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                yield json.loads(line)
            except Exception:
                continue


def _load_one_json(path: Path) -> dict | None:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def _read_txt(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except Exception:
        try:
            return path.read_text(encoding="cp949", errors="ignore")
        except Exception:
            return ""


def _extract_text_from_record(rec: dict) -> str:
    question = rec.get("question") or rec.get("prompt") or rec.get("problem", "")
    starter = rec.get("starter_code") or rec.get("starter", "")
    exs = rec.get("examples") or rec.get("tests") or []
    if isinstance(exs, dict):
        exs = [exs]
    examples_txt = []
    for e in exs:
        if not isinstance(e, dict):
            continue
        inp = e.get("input") or e.get("in") or ""
        out = e.get("output") or e.get("out") or ""
        examples_txt.append(f"Input:\n{inp}\nOutput:\n{out}")
    examples_block = "\n\n".join(examples_txt)

    sols = rec.get("solutions") or rec.get("solution") or []
    if isinstance(sols, str):
        sols = [sols]
    sols_txt = "\n\n".join([str(s) for s in sols])

    parts = [
        "# Problem\n",
        str(question).strip(),
        "\n\n# Starter Code\n",
        str(starter).strip(),
        "\n\n# Examples\n",
        examples_block,
        "\n\n# Solutions\n",
        sols_txt,
        "\n\n---\n",
    ]
    return "".join(parts)


def load_corpus(data_root: Path | None = None) -> str:
    root = data_root or DATA_ROOT
    if not root.exists():
        raise FileNotFoundError(f"APPS dataset root not found: {root}. Please prepare data under ai/data/apps")

    texts: List[str] = []

    jsonl = root / "train.jsonl"
    if jsonl.exists():
        for rec in _iter_jsonl(jsonl):
            txt = _extract_text_from_record(rec)
            if txt.strip():
                texts.append(txt)

    train_dir = root / "train"
    if train_dir.exists():
        for jf in _iter_json_files(train_dir):
            rec = _load_one_json(jf)
            if rec:
                txt = _extract_text_from_record(rec)
                if txt.strip():
                    texts.append(txt)

    for tf in train_dir.rglob("*.txt") if train_dir.exists() else []:
        t = _read_txt(tf)
        if t.strip():
            texts.append(t + "\n\n---\n")

    if not texts:
        raise RuntimeError(f"No training texts found under {root}. Expected JSON/JSONL or TXT files.")

    corpus = "\n\n=====\n\n".join(texts)
    return corpus
