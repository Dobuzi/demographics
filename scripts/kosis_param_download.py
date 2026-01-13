#!/usr/bin/env python3
import argparse
import csv
import json
import os
import re
import sys
import time
import urllib.request


KOSIS_PARAM_URL = "https://kosis.kr/openapi/Param/statisticsParameterData.do"


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
        fixed = re.sub(r'([\\{,])\\s*([A-Za-z0-9_]+)\\s*:', r'\\1\"\\2\":', text)
        return json.loads(fixed)


def encode_value(value: str) -> str:
    safe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_+-."
    return "".join(
        ch if ch in safe else f"%{ord(ch):02X}"
        for ch in value
    )


def build_url(params: dict) -> str:
    parts = []
    for key, value in params.items():
        parts.append(f"{key}={encode_value(str(value))}")
    return f"{KOSIS_PARAM_URL}?{'&'.join(parts)}"


def fetch(url: str) -> str:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (kosis-param-download)"},
    )
    with urllib.request.urlopen(req) as resp:
        return resp.read().decode("utf-8", errors="replace")


def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


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


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Download KOSIS parameter data by year."
    )
    parser.add_argument("--env-file", default=".env", help="Path to .env file.")
    parser.add_argument("--api-key", default=os.getenv("API_KEY"), help="KOSIS API key.")
    parser.add_argument("--start-year", type=int, required=True, help="Start year.")
    parser.add_argument("--end-year", type=int, required=True, help="End year.")
    parser.add_argument(
        "--prd-se",
        default="Y",
        help="Period code for requests (Y for yearly, M for monthly).",
    )
    parser.add_argument(
        "--start-prd-de",
        help="Start period (e.g., 202501 for monthly range).",
    )
    parser.add_argument(
        "--end-prd-de",
        help="End period (e.g., 202511 for monthly range).",
    )
    parser.add_argument(
        "--single-range",
        action="store_true",
        help="Fetch a single start/end period range instead of looping years.",
    )
    parser.add_argument("--out-dir", default="data/kosis_yearly", help="Output directory.")
    parser.add_argument(
        "--format",
        choices=["json", "csv"],
        default="json",
        help="Output format per year.",
    )
    parser.add_argument("--sleep", type=float, default=0.0, help="Sleep between requests.")
    args = parser.parse_args()

    load_env_file(args.env_file)
    api_key = args.api_key or os.getenv("API_KEY")
    if not api_key:
        print("Missing API key. Set API_KEY in .env or pass --api-key.", file=sys.stderr)
        return 2

    itm_id = "T70+T80"
    obj_l1 = "00+11+26+27+28+29+30+31+36+41+51+43+44+52+46+47+48+50"
    obj_l2 = obj_l1
    obj_l3 = "0+1+2"
    obj_l4 = "000+020+050+070+100+120+130+150+160+180+190+210+230+260+280+310+330+340"
    output_fields = (
        "ORG_ID+TBL_ID+TBL_NM+OBJ_ID+OBJ_NM+OBJ_NM_ENG+NM+NM_ENG+ITM_ID+"
        "ITM_NM+ITM_NM_ENG+UNIT_NM+UNIT_NM_ENG+PRD_SE+PRD_DE+LST_CHN_DE"
    )

    ensure_dir(args.out_dir)

    def run_request(start_prd: str, end_prd: str, label: str) -> None:
        params = {
            "method": "getList",
            "apiKey": api_key,
            "itmId": itm_id,
            "objL1": obj_l1,
            "objL2": obj_l2,
            "objL3": obj_l3,
            "objL4": obj_l4,
            "objL5": "",
            "objL6": "",
            "objL7": "",
            "objL8": "",
            "format": "json",
            "jsonVD": "Y",
            "prdSe": args.prd_se,
            "startPrdDe": start_prd,
            "endPrdDe": end_prd,
            "outputFields": output_fields,
            "orgId": "101",
            "tblId": "DT_1B26003",
        }

        url = build_url(params)
        raw = fetch(url)
        payload = relaxed_json_loads(raw)

        if isinstance(payload, dict) and payload.get("err"):
            err_path = os.path.join(args.out_dir, f"kosis_{label}_error.json")
            write_json(err_path, payload)
            print(f"{label}: error {payload.get('err')} {payload.get('errMsg')}", file=sys.stderr)
            return

        out_path = os.path.join(args.out_dir, f"kosis_{label}.{args.format}")
        if args.format == "csv":
            write_csv(out_path, payload)
        else:
            write_json(out_path, payload)

        print(f"{label}: wrote {out_path}")

    if args.single_range:
        if not args.start_prd_de or not args.end_prd_de:
            print("--single-range requires --start-prd-de and --end-prd-de.", file=sys.stderr)
            return 2
        if args.prd_se.upper() == "M":
            start = args.start_prd_de
            end = args.end_prd_de
            if not (len(start) == 6 and len(end) == 6):
                print("Monthly ranges must use YYYYMM format.", file=sys.stderr)
                return 2
            y, m = int(start[:4]), int(start[4:6])
            end_y, end_m = int(end[:4]), int(end[4:6])
            while (y < end_y) or (y == end_y and m <= end_m):
                label = f"{y:04d}{m:02d}"
                run_request(label, label, label)
                if args.sleep:
                    time.sleep(args.sleep)
                m += 1
                if m > 12:
                    y += 1
                    m = 1
        else:
            label = f"{args.start_prd_de}_{args.end_prd_de}"
            run_request(args.start_prd_de, args.end_prd_de, label)
        return 0

    for year in range(args.start_year, args.end_year + 1):
        run_request(str(year), str(year), str(year))
        if args.sleep:
            time.sleep(args.sleep)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
