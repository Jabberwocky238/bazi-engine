"""
Validate shishen.ts output against scraped JSON.

For every bazi_data/**/*.json sample:
  - extract the 4 pillars from `bz`
  - feed to `bun run shishen` (one JSON per line)
  - compare `ss` / `cg` / `cgss` exactly against the scraped data
"""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8")

ROOT = Path(__file__).parent
DATA_DIR = ROOT / "bazi_data"


def pillars_from_json(data: dict) -> dict | None:
    bz = data.get("bz") or {}
    try:
        return {
            "year":  {"gan": bz["0"], "zhi": bz["1"]},
            "month": {"gan": bz["2"], "zhi": bz["3"]},
            "day":   {"gan": bz["4"], "zhi": bz["5"]},
            "hour":  {"gan": bz["6"], "zhi": bz["7"]},
        }
    except KeyError:
        return None


def iter_samples():
    for path in sorted(DATA_DIR.rglob("*.json")):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        pillars = pillars_from_json(data)
        if pillars is None:
            continue
        truth = {
            "ss":   data.get("ss"),
            "cg":   data.get("cg"),
            "cgss": data.get("cgss"),
        }
        if not all(isinstance(v, list) and len(v) == 4 for v in truth.values()):
            continue
        yield path, pillars, truth


def main() -> int:
    if shutil.which("bun") is None:
        print("[fatal] bun not found in PATH", file=sys.stderr)
        return 2

    proc = subprocess.Popen(
        ["bun", "run", "shishen"],
        cwd=str(ROOT),
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=sys.stderr,
        text=True,
        encoding="utf-8",
        bufsize=1,
    )
    assert proc.stdin is not None and proc.stdout is not None

    n_total = n_ok = n_bad = 0
    per_field: dict[str, int] = {"ss": 0, "cg": 0, "cgss": 0}
    shown = 0
    SHOW_LIMIT = 10

    try:
        for path, pillars, truth in iter_samples():
            proc.stdin.write(json.dumps(pillars, ensure_ascii=False) + "\n")
            proc.stdin.flush()
            line = proc.stdout.readline()
            if not line:
                print("[fatal] ts subprocess closed stdout", file=sys.stderr)
                return 2
            resp = json.loads(line)
            if resp.get("type") != "result":
                print(f"[err] {path.name}: {resp}", file=sys.stderr)
                n_bad += 1
                continue

            n_total += 1
            computed = resp["value"]
            diffs: list[tuple[str, list, list]] = []
            for field in ("ss", "cg", "cgss"):
                if computed[field] != truth[field]:
                    per_field[field] += 1
                    diffs.append((field, truth[field], computed[field]))

            if diffs:
                n_bad += 1
                if shown < SHOW_LIMIT:
                    rel = path.relative_to(DATA_DIR)
                    print(f"\n[diff] {rel}  pillars={pillars}")
                    for field, want, got in diffs:
                        print(f"    {field:5s}  want={want}")
                        print(f"           got ={got}")
                    shown += 1
            else:
                n_ok += 1
    finally:
        try:
            proc.stdin.close()
        except Exception:
            pass
        proc.wait(timeout=5)

    print(f"\n[done] total={n_total}  ok={n_ok}  bad={n_bad}")
    for k, v in per_field.items():
        if v:
            print(f"  {k} mismatches: {v}")
    return 0 if n_bad == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
