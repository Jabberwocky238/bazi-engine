"""
Polls https://bzapi4.iwzbz.com/getbasebz8.php with a randomly sampled 'd'
(birth datetime) each iteration. Year is uniform in [YEAR_MIN, YEAR_MAX];
month/day/hour/minute/second are uniform within their valid ranges.

Each response is saved as JSON in OUT_DIR at a path derived from the
parameters so re-runs skip already-fetched files. Ctrl+C to stop.
"""
from __future__ import annotations

import calendar
import json
import random
import sys
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import urlencode

import urllib.request
import urllib.error

API = "https://bzapi4.iwzbz.com/getbasebz8.php"
REFERER = "https://pcbz.iwzwh.com/"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36"

OUT_DIR = Path(__file__).parent / "bazi_data"
YEAR_MIN = 1950
YEAR_MAX = 2026
INTERVAL_SEC = 0.5      # wait between successful requests
SEXES = (1, 0)          # male (1) then female (0) for each sampled datetime
VIP = 0
USERGUID = ""
YZS = 0


def random_datetime() -> datetime:
    y = random.randint(YEAR_MIN, YEAR_MAX)
    m = random.randint(1, 12)
    d = random.randint(1, calendar.monthrange(y, m)[1])
    return datetime(y, m, d, random.randint(0, 23), 0, 0)


def path_for(d: datetime, sex: int) -> Path:
    return OUT_DIR / d.strftime("%Y") / d.strftime("%m") / d.strftime("%d") / f"{d.strftime('%H-%M-%S')}_s{sex}.json"


def build_url(d: datetime, today: datetime, sex: int) -> str:
    params = {
        "d": d.strftime("%Y-%m-%d %H:%M:%S"),
        "s": sex,
        "today": today.strftime("%Y-%m-%d %H:%M:%S"),
        "vip": VIP,
        "userguid": USERGUID,
        "yzs": YZS,
    }
    return f"{API}?{urlencode(params)}"


def fetch(url: str, timeout: float = 15.0) -> dict:
    req = urllib.request.Request(
        url,
        headers={"Referer": REFERER, "User-Agent": UA, "Accept": "application/json,*/*"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read().decode("utf-8", errors="replace")
    return json.loads(raw)


def save(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    tmp.replace(path)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    today = datetime.now()
    n_ok = n_skip = n_err = 0
    started = time.time()

    print(f"[start] out={OUT_DIR}  years={YEAR_MIN}-{YEAR_MAX}  sexes={SEXES}  interval={INTERVAL_SEC}s")
    while True:
        cur = random_datetime()
        for sex in SEXES:
            path = path_for(cur, sex)
            if path.exists():
                n_skip += 1
                continue

            url = build_url(cur, today, sex)
            try:
                data = fetch(url)
                save(path, data)
                n_ok += 1
                rate = n_ok / max(1e-3, time.time() - started)
                print(f"[ok {n_ok:>6}] {cur} s={sex}  skip={n_skip} err={n_err}  {rate:.2f}/s  -> {path.relative_to(OUT_DIR)}")
            except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError) as e:
                n_err += 1
                print(f"[err] {cur} s={sex}: {type(e).__name__}: {e}", file=sys.stderr)
                time.sleep(5.0)
                continue

            time.sleep(INTERVAL_SEC)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n[stop] interrupted")
