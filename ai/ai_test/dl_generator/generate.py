from __future__ import annotations
import argparse
import json
import time
from pathlib import Path
import re
import torch

try:
    from .model import ByteLSTM, byte_detokenize
except ImportError:
    from ai_test.dl_generator.model import ByteLSTM, byte_detokenize

BASE = Path(__file__).resolve().parents[2]
OUT_DIR = BASE / "ai_test" / "dl_generator" / "output"
OUT_DIR.mkdir(parents=True, exist_ok=True)
DEFAULT_CKPT = BASE / "models" / "dl_problem_gen.pth"


def load_model(ckpt_path: Path, device: torch.device) -> ByteLSTM:
    ck = torch.load(ckpt_path, map_location=device)
    meta = ck.get('meta', {})
    model = ByteLSTM(
        vocab_size=meta.get('vocab_size', 256),
        emb=meta.get('emb', 256),
        hidden=meta.get('hidden', 512),
        layers=meta.get('layers', 2),
        dropout=meta.get('dropout', 0.1)
    ).to(device)
    model.load_state_dict(ck['model_state_dict'])
    model.eval()
    return model


def get_device():
    if torch.cuda.is_available():
        return torch.device('cuda')
    return torch.device('cpu')


def _split_problems(text: str) -> list[str]:
    parts = re.split(r"\n\s*(?:=====|---)\s*\n", text)
    parts = [p.strip() for p in parts if len(p.strip()) > 60]
    return parts


def _heuristic_to_struct(chunk: str, idx: int) -> dict:
    title = None
    for line in chunk.splitlines():
        s = line.strip().lstrip('#').strip()
        if len(s) >= 5:
            title = s[:80]
            break
    if not title:
        title = f"Generated Problem {idx+1}"

    def section(name):
        m = re.split(rf"^\s*#\s*{name}\s*$", chunk, flags=re.IGNORECASE | re.MULTILINE)
        if len(m) >= 2:
            after = m[1]
            # up to next heading
            nxt = re.split(r"^\s*#\s*[A-Za-z].*$", after, flags=re.MULTILINE)
            return nxt[0].strip()
        return ""

    description = section("Problem") or chunk[:4000].strip()
    starter_code = section("Starter Code")
    examples = section("Examples")
    solutions = section("Solutions")

    example_list = []
    for ex in re.split(r"\n\n+", examples):
        inp = ""
        out = ""
        mi = re.search(r"Input:\s*(.*)", ex, flags=re.IGNORECASE | re.DOTALL)
        mo = re.search(r"Output:\s*(.*)", ex, flags=re.IGNORECASE | re.DOTALL)
        if mi:
            inp = mi.group(1).strip()
        if mo:
            out = mo.group(1).strip()
        if inp or out:
            example_list.append({"input": inp, "output": out, "explanation": ""})

    return {
        "id": f"DL{idx+1}",
        "title": title,
        "difficulty": "medium",
        "description": description,
        "input_format": "자유 형식 (데이터셋에서 유추)",
        "output_format": "자유 형식 (데이터셋에서 유추)",
        "constraints": "없음",
        "examples": example_list[:3],
        "topic_tags": ["apps", "code-generation", "lstm"],
        "starter_code": starter_code or None,
        "solution_code": solutions.strip()[:8000] if solutions else None,
        "explanation": None,
    }


def generate(args):
    dev = get_device()
    model = load_model(Path(args.ckpt), dev)

    # Seed prompt encourages sectioned output
    seed_text = (
        "# Problem\n문제 설명을 작성하세요.\n\n"
        "# Starter Code\n# 여기에 시작 코드를 작성하세요.\n\n"
        "# Examples\nInput:\n\nOutput:\n\n\n# Solutions\n"
    )
    seed = torch.tensor([[c for c in seed_text.encode('utf-8')]], dtype=torch.long, device=dev)
    toks = model.generate(seed, max_tokens=args.max_tokens, temperature=args.temperature)
    full = byte_detokenize(toks[0])

    # Produce multiple problems by sampling multiple times
    problems = []
    for i in range(args.num):
        toks = model.generate(seed, max_tokens=args.max_tokens, temperature=args.temperature)
        txt = byte_detokenize(toks[0])
        chunks = _split_problems(txt)
        if not chunks:
            chunks = [txt]
        problems.append(_heuristic_to_struct(chunks[0], i))

    ts = time.strftime("%Y%m%d_%H%M%S")
    base = f"dl_coding_problems_{args.num}_{ts}"
    jsonl_path = OUT_DIR / f"{base}.jsonl"
    md_path = OUT_DIR / f"{base}.md"

    with jsonl_path.open('w', encoding='utf-8') as f:
        for p in problems:
            f.write(json.dumps(p, ensure_ascii=False) + "\n")

    with md_path.open('w', encoding='utf-8') as f:
        f.write(f"#자동 생성 코딩문제 ({base})\n\n")
        for p in problems:
            f.write(f"## {p['title']} ({p['id']})\n\n")
            f.write("- 난이도: " + p['difficulty'] + "\n\n")
            f.write(p['description'] + "\n\n")
            if p.get('examples'):
                f.write("### 예시\n\n")
                for j, e in enumerate(p['examples'], 1):
                    f.write(f"예시 {j}\n\n입력:\n{e.get('input','')}\n\n출력:\n{e.get('output','')}\n\n")
            if p.get('starter_code'):
                f.write("### 시작 코드\n\n````python\n" + p['starter_code'] + "\n````\n\n")
            if p.get('solution_code'):
                f.write("### 정답 코드(생성본)\n\n````python\n" + p['solution_code'] + "\n````\n\n")
            f.write("---\n\n")

    print("Saved:")
    print(" - jsonl:", jsonl_path)
    print(" - md:   ", md_path)


def parse_args():
    p = argparse.ArgumentParser(description="Generate coding problems using trained byte-level LSTM")
    p.add_argument('--ckpt', type=str, default=str(DEFAULT_CKPT))
    p.add_argument('--num', type=int, default=3)
    p.add_argument('--temperature', type=float, default=0.9)
    p.add_argument('--max-tokens', type=int, default=600)
    p.add_argument('--seed', type=int, default=0)
    return p.parse_args()


if __name__ == '__main__':
    args = parse_args()
    if args.seed:
        torch.manual_seed(args.seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(args.seed)
    generate(args)
