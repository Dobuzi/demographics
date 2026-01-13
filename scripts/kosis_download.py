#!/usr/bin/env python3
import argparse
import csv
import json
import os
import re
import sys
import urllib.parse
import urllib.request


KOSIS_BASE_URL = "https://kosis.kr/openapi/statisticsData.do"


def load_env_file(path: str) -> None:
    if not os.path.exists(path):
        return
    with open(path, "r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value


def relaxed_json_loads(text: str):
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # KOSIS sometimes returns unquoted keys; patch them for basic parsing.
        fixed = re.sub(r'([\\{,])\\s*([A-Za-z0-9_]+)\\s*:', r'\\1\"\\2\":', text)
        return json.loads(fixed)


def fetch(url: str) -> str:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (kosis-download)"},
    )
    with urllib.request.urlopen(req) as resp:
        return resp.read().decode("utf-8", errors="replace")


def write_json(path: str, payload) -> None:
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)


def write_csv(path: str, payload) -> None:
    if not isinstance(payload, list) or not payload:
        raise ValueError("CSV output requires a non-empty list of objects.")
    fieldnames = sorted({key for row in payload for key in row.keys()})
    with open(path, "w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(payload)


def build_url(params: dict) -> str:
    query = urllib.parse.urlencode(params)
    return f"{KOSIS_BASE_URL}?{query}"


def ensure_parent_dir(path: str) -> None:
    parent = os.path.dirname(path)
    if parent:
        os.makedirs(parent, exist_ok=True)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Download KOSIS OpenAPI data via userStatsId."
    )
    parser.add_argument("--env-file", default=".env", help="Path to .env file.")
    parser.add_argument("--api-key", default=os.getenv("API_KEY"), help="KOSIS API key.")
    parser.add_argument(
        "--user-stats-id",
        default=os.getenv("KOSIS_USER_STATS_ID") or os.getenv("USER_STATS_ID"),
        help="KOSIS userStatsId value.",
    )
    parser.add_argument("--prd-se", default="Y", help="Period code (Y, Q, M).")
    parser.add_argument("--start", dest="start_prd_de", help="Start period (e.g., 2022).")
    parser.add_argument("--end", dest="end_prd_de", help="End period (e.g., 2022).")
    parser.add_argument(
        "--new-est-prd-cnt",
        help="Fetch the latest N periods instead of start/end.",
    )
    parser.add_argument("--prd-interval", help="Period interval step.")
    parser.add_argument(
        "--out",
        default="kosis_data.json",
        help="Output file (.json or .csv).",
    )
    parser.add_argument(
        "--json-vd",
        default="Y",
        choices=["Y", "N"],
        help="Include jsonVD flag.",
    )
    args = parser.parse_args()

    load_env_file(args.env_file)
    api_key = args.api_key or os.getenv("API_KEY")
    user_stats_id = args.user_stats_id

    if not api_key:
        print("Missing API key. Set API_KEY in .env or pass --api-key.", file=sys.stderr)
        return 2
    if not user_stats_id:
        print("Missing userStatsId. Pass --user-stats-id or set KOSIS_USER_STATS_ID.", file=sys.stderr)
        return 2

    params = {
        "method": "getList",
        "format": "json",
        "jsonVD": args.json_vd,
        "apiKey": api_key,
        "userStatsId": user_stats_id,
        "prdSe": args.prd_se,
    }

    if args.start_prd_de and args.end_prd_de:
        params["startPrdDe"] = args.start_prd_de
        params["endPrdDe"] = args.end_prd_de
    elif args.new_est_prd_cnt:
        params["newEstPrdCnt"] = args.new_est_prd_cnt

    if args.prd_interval:
        params["prdInterval"] = args.prd_interval

    url = build_url(params)
    raw = fetch(url)

    try:
        payload = relaxed_json_loads(raw)
    except json.JSONDecodeError:
        # Fall back to raw output to help diagnose API errors.
        payload = {"raw": raw}

    out_path = args.out
    ensure_parent_dir(out_path)

    if isinstance(payload, dict) and payload.get("err"):
        error_path = out_path
        if out_path.lower().endswith(".csv"):
            error_path = out_path[:-4] + "_error.json"
        write_json(error_path, payload)
        print(f"API error {payload.get('err')}: {payload.get('errMsg')}", file=sys.stderr)
        print(f"Wrote {error_path}", file=sys.stderr)
        return 1

    if out_path.lower().endswith(".csv"):
        write_csv(out_path, payload)
    else:
        write_json(out_path, payload)

    print(f"Wrote {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
