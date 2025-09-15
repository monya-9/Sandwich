from pathlib import Path
import json

def ensure_dir(p: Path):
    p.parent.mkdir(parents=True, exist_ok=True)

def save_json(obj, path: Path):
    ensure_dir(path)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False)

def load_json(path: Path, default=None):
    if not path.exists(): return default
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)
