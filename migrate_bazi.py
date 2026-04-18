"""
Migrate flat bazi_data/*.json into nested bazi_data/YYYY/MM/DD/HH-MM-SS_sN.json.

Safe to re-run: skips files already in their target location, refuses to
overwrite if target exists with different content.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent / "bazi_data"
PATTERN = re.compile(r"^(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})_s([01])\.json$")


def target_for(name: str) -> Path | None:
    m = PATTERN.match(name)
    if not m:
        return None
    y, mo, d, hh, mm, ss, sex = m.groups()
    return ROOT / y / mo / d / f"{hh}-{mm}-{ss}_s{sex}.json"


def main() -> None:
    if not ROOT.exists():
        print(f"[skip] {ROOT} does not exist")
        return

    n_moved = n_skip = n_conflict = n_bad = 0
    for src in sorted(ROOT.iterdir()):
        if not src.is_file():
            continue
        dst = target_for(src.name)
        if dst is None:
            print(f"[bad ] {src.name}", file=sys.stderr)
            n_bad += 1
            continue
        if dst == src:
            n_skip += 1
            continue
        if dst.exists():
            if dst.read_bytes() == src.read_bytes():
                src.unlink()
                n_skip += 1
            else:
                print(f"[conflict] {src.name} -> {dst.relative_to(ROOT)} (differs)", file=sys.stderr)
                n_conflict += 1
            continue
        dst.parent.mkdir(parents=True, exist_ok=True)
        src.replace(dst)
        n_moved += 1

    print(f"[done] moved={n_moved} skip={n_skip} conflict={n_conflict} bad={n_bad}")


if __name__ == "__main__":
    main()
