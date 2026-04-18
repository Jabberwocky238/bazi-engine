"""
Validate shensha.ts + shishen.ts output against scraped JSON.

For every bazi_data/**/*.json sample:
  - extract the 4 pillars from `bz`
  - feed them to `bun run index.ts` (one JSON per line)
  - compare shensha (intersected with SUPPORTED_SHENSHA) and shishen (ss/cg/cgss)
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

PILLAR_KEYS = ("year", "month", "day", "hour")


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
        truth = data.get("szshensha") or []
        if len(truth) < 4:
            continue
        yield path, pillars, truth[:4]


def main() -> int:
    if shutil.which("bun") is None:
        print("[fatal] bun not found in PATH", file=sys.stderr)
        return 2

    proc = subprocess.Popen(
        ["bun", "run", "shensha"],
        cwd=str(ROOT),
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=sys.stderr,
        text=True,
        encoding="utf-8",
        bufsize=1,
    )
    assert proc.stdin is not None and proc.stdout is not None

    try:
        handshake = json.loads(proc.stdout.readline())
    except json.JSONDecodeError as e:
        print(f"[fatal] bad handshake from ts: {e}", file=sys.stderr)
        proc.kill()
        return 2
    if handshake.get("type") != "supported":
        print(f"[fatal] unexpected handshake: {handshake}", file=sys.stderr)
        proc.kill()
        return 2
    supported = set(handshake["value"])
    print(f"[info] supported ({len(supported)}): {sorted(supported)}")

    n_total = n_ok = n_bad = 0
    per_shensha_missing: dict[str, int] = {}
    per_shensha_extra: dict[str, int] = {}
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
            diffs = []
            for i, key in enumerate(PILLAR_KEYS):
                want = set(truth[i]) & supported
                got = set(computed[key]) & supported
                if want == got:
                    continue
                missing = sorted(want - got)
                extra = sorted(got - want)
                for s in missing:
                    per_shensha_missing[s] = per_shensha_missing.get(s, 0) + 1
                for s in extra:
                    per_shensha_extra[s] = per_shensha_extra.get(s, 0) + 1
                diffs.append((key, missing, extra))

            if diffs:
                n_bad += 1
                if shown < SHOW_LIMIT:
                    rel = path.relative_to(DATA_DIR)
                    print(f"\n[diff] {rel}  pillars={pillars}")
                    for key, missing, extra in diffs:
                        print(f"    {key:5s}  missing={missing}  extra={extra}")
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
    if per_shensha_missing:
        print("  missing (in truth, not in ts):")
        for k, v in sorted(per_shensha_missing.items(), key=lambda kv: -kv[1]):
            print(f"    {k:10s} {v}")
    if per_shensha_extra:
        print("  extra (in ts, not in truth):")
        for k, v in sorted(per_shensha_extra.items(), key=lambda kv: -kv[1]):
            print(f"    {k:10s} {v}")
    return 0 if n_bad == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
