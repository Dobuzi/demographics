#!/usr/bin/env python3
import argparse
import json
import os
import re
from pathlib import Path


def relaxed_json_loads(text: str):
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        fixed = re.sub(r'([\\{,])\\s*([A-Za-z0-9_]+)\\s*:', r'\\1\"\\2\":', text)
        return json.loads(fixed)


def trim_row(row: dict) -> dict:
    keep = ("C1", "C2", "C3", "C4", "ITM_ID", "DT", "PRD_DE")
    return {key: row.get(key) for key in keep}


def main() -> int:
    parser = argparse.ArgumentParser(description="Merge KOSIS yearly/monthly JSON files.")
    parser.add_argument(
        "--input-dir",
        default="data/kosis_yearly",
        help="Directory containing kosis_*.json files.",
    )
    parser.add_argument(
        "--output",
        default="data/kosis_all.json",
        help="Merged output JSON path.",
    )
    args = parser.parse_args()

    input_dir = Path(args.input_dir)
    if not input_dir.exists():
        raise SystemExit(f"Missing input directory: {input_dir}")

    merged = {}
    for path in sorted(input_dir.glob("kosis_*.json")):
        if path.name.endswith("_error.json"):
            continue
        key = path.stem.replace("kosis_", "")
        text = path.read_text(encoding="utf-8")
        payload = relaxed_json_loads(text)
        if isinstance(payload, dict) and payload.get("err"):
            continue
        merged[key] = [trim_row(row) for row in payload]

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "periods": merged,
        "fields": ["C1", "C2", "C3", "C4", "ITM_ID", "DT", "PRD_DE"],
    }
    output_path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
