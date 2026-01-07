#!/usr/bin/env python3
import csv
import json
import re
import sys
from pathlib import Path

FULL_NAME_COL = "What is your Full Name?"


def slugify_filename(name: str) -> str:
    name = (name or "").strip()
    if not name:
        return ""
    # spaces -> underscores, remove unsafe chars, collapse repeats
    name = name.replace(" ", "_")
    name = re.sub(r"[^A-Za-z0-9._-]+", "", name)  # keep safe filename chars
    name = re.sub(r"_+", "_", name).strip("._-")  # cleanup
    return name


def main():
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} input.csv output_dir", file=sys.stderr)
        sys.exit(1)

    input_csv = Path(sys.argv[1])
    out_dir = Path(sys.argv[2])
    out_dir.mkdir(parents=True, exist_ok=True)

    if not input_csv.exists():
        print(f"Error: input file not found: {input_csv}", file=sys.stderr)
        sys.exit(1)

    # Track duplicates so filenames don't collide
    seen = {}

    with input_csv.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames is None:
            print("Error: CSV appears to have no header row.", file=sys.stderr)
            sys.exit(1)

        if FULL_NAME_COL not in reader.fieldnames:
            print(f"Error: Could not find column: {FULL_NAME_COL}", file=sys.stderr)
            print("Found headers:", reader.fieldnames, file=sys.stderr)
            sys.exit(1)

        count = 0
        for idx, row in enumerate(reader, start=1):
            # Use the full name as filename
            raw_name = row.get(FULL_NAME_COL, "")
            base = slugify_filename(raw_name)

            # Fallback name if missing
            if not base:
                base = f"unknown_row_{idx}"

            # Ensure uniqueness if duplicate names
            n = seen.get(base, 0) + 1
            seen[base] = n
            filename = f"{base}.json" if n == 1 else f"{base}_{n}.json"

            out_path = out_dir / filename

            # Write pretty JSON
            with out_path.open("w", encoding="utf-8") as out:
                json.dump(row, out, ensure_ascii=False, indent=2)

            count += 1

    print(f"Done. Wrote {count} JSON files to: {out_dir}")


if __name__ == "__main__":
    main()
