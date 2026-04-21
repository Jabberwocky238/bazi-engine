"""
Walks bazi_data/ recursively; for each existing bazi sample JSON, extracts
its four ganzhi pillars (bz["0"..."7"]) and queries getGZRelaction3.php for
the 合冲刑害 / 暗合 / 合化 relations among them.

The result is saved to a *new* file alongside the original, in the same
folder, named "<stem>.liuyi.json". The original bazi JSON is never touched.
Output files that already exist are skipped so re-runs resume. Ctrl+C to stop.

Example path mapping:
    bazi_data/1955/02/21/08-00-00_s0.json          (input,  unchanged)
    bazi_data/1955/02/21/08-00-00_s0.liuyi.json    (output, created here)

Response structure (2 arrays, each item CSV-like):
    [
      [ "己癸相克,克,己_癸,", "戊癸合化火,合化火,戊_癸," ],           # 天干
      [ "巳酉半合金局,半合金局,,巳_酉", "巳酉暗合,暗合,,巳_酉", ... ] # 地支
    ]
"""
from __future__ import annotations

import json
import sys
import time
from pathlib import Path
from urllib.parse import urlencode

import urllib.request
import urllib.error

API = "https://bzapi4.iwzbz.com/getGZRelaction3.php"
REFERER = "https://pcbz.iwzwh.com/"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36"

ROOT = Path(__file__).parent
DATA_DIR = ROOT / "bazi_data"
OUT_SUFFIX = ".liuyi.json"
INTERVAL_SEC = 0.5
USERGUID = "0c0d17ca-6673-436e-8f63-a18cb231bda9"
VIP = 0


def is_bazi_input(path: Path) -> bool:
    """Accept only the original bazi files, skip anything ending in OUT_SUFFIX."""
    return path.suffix == ".json" and not path.name.endswith(OUT_SUFFIX)


def out_path_for(in_path: Path) -> Path:
    # foo.json → foo.liuyi.json (same directory)
    return in_path.with_suffix(OUT_SUFFIX)


def extract_bz(sample: dict) -> list[str] | None:
    """bz["0"..."7"] → [年干支, 月干支, 日干支, 时干支]."""
    bz = sample.get("bz")
    if not isinstance(bz, dict):
        return None
    try:
        gz = [bz["0"] + bz["1"], bz["2"] + bz["3"], bz["4"] + bz["5"], bz["6"] + bz["7"]]
    except KeyError:
        return None
    if not all(isinstance(x, str) and len(x) == 2 for x in gz):
        return None
    return gz


def build_url(gz: list[str]) -> str:
    params = {"gz": " ".join(gz), "userguid": USERGUID, "vip": VIP}
    return f"{API}?{urlencode(params)}"


def fetch(url: str, timeout: float = 15.0):
    req = urllib.request.Request(
        url,
        headers={"Referer": REFERER, "User-Agent": UA, "Accept": "application/json,*/*"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read().decode("utf-8", errors="replace")
    return json.loads(raw)


def save(path: Path, gz: list[str], data) -> None:
    payload = {"gz": gz, "result": data}
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    tmp.replace(path)


def main() -> None:
    if not DATA_DIR.is_dir():
        print(f"[err] input missing: {DATA_DIR}", file=sys.stderr)
        sys.exit(1)

    n_ok = n_skip = n_bad = n_err = 0
    started = time.time()
    print(f"[start] dir={DATA_DIR}  out-suffix={OUT_SUFFIX!r}  interval={INTERVAL_SEC}s")

    for in_path in sorted(DATA_DIR.rglob("*.json")):
        if not is_bazi_input(in_path):
            continue
        # 只处理0不处理1，因为一样
        if in_path.name.endswith("1.json"):
            continue
        out_path = out_path_for(in_path)
        if out_path.exists():
            n_skip += 1
            continue

        try:
            sample = json.loads(in_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as e:
            n_bad += 1
            print(f"[bad-in] {in_path.relative_to(DATA_DIR)}: {e}", file=sys.stderr)
            continue

        gz = extract_bz(sample)
        if gz is None:
            n_bad += 1
            print(f"[bad-in] {in_path.relative_to(DATA_DIR)}: bz missing/malformed", file=sys.stderr)
            continue

        url = build_url(gz)
        try:
            data = fetch(url)
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError) as e:
            n_err += 1
            print(f"[err] {in_path.relative_to(DATA_DIR)}: {type(e).__name__}: {e}", file=sys.stderr)
            time.sleep(5.0)
            continue

        try:
            save(out_path, gz, data)
        except OSError as e:
            n_err += 1
            print(f"[err-write] {out_path.relative_to(DATA_DIR)}: {e}", file=sys.stderr)
            continue

        n_ok += 1
        rate = n_ok / max(1e-3, time.time() - started)
        rel = out_path.relative_to(DATA_DIR)
        print(f"[ok {n_ok:>6}] {' '.join(gz)}  skip={n_skip} bad={n_bad} err={n_err}  {rate:.2f}/s  -> {rel}")

        time.sleep(INTERVAL_SEC)

    print(f"\n[done] ok={n_ok}  skip={n_skip}  bad={n_bad}  err={n_err}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n[stop] interrupted")
