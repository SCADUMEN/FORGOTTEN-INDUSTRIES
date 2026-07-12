#!/usr/bin/env python3
"""
hash_counter.py — a tiny local, tamper-evident counter.

Each entry contains:
- sequential entry number
- counter value
- UTC timestamp
- optional note
- SHA-256 hash of the previous entry
- SHA-256 hash of the current entry

This creates a hash chain. Editing or deleting an old entry breaks verification.

Important:
A hash chain detects tampering, but it does not prove the original claim was true.
To make later alteration harder, periodically copy the newest hash somewhere
independent (for example, email it to yourself or commit it to a private Git repo).
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

GENESIS_HASH = "0" * 64


def canonical_json(data: dict[str, Any]) -> str:
    """Stable JSON encoding so the same record always hashes identically."""
    return json.dumps(data, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def load_log(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise RuntimeError(f"Could not read {path}: {exc}") from exc

    if not isinstance(data, list):
        raise RuntimeError(f"{path} must contain a JSON list.")

    return data


def save_log(path: Path, entries: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(entries, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def record_payload(entry: dict[str, Any]) -> dict[str, Any]:
    """Return only fields included in the entry's hash."""
    return {
        "entry": entry["entry"],
        "count": entry["count"],
        "timestamp_utc": entry["timestamp_utc"],
        "note": entry["note"],
        "previous_hash": entry["previous_hash"],
    }


def calculate_record_hash(entry: dict[str, Any]) -> str:
    return sha256_text(canonical_json(record_payload(entry)))


def add_entry(path: Path, count: int, note: str) -> dict[str, Any]:
    entries = load_log(path)
    previous_hash = entries[-1]["hash"] if entries else GENESIS_HASH

    entry: dict[str, Any] = {
        "entry": len(entries) + 1,
        "count": count,
        "timestamp_utc": datetime.now(timezone.utc)
        .isoformat(timespec="seconds")
        .replace("+00:00", "Z"),
        "note": note,
        "previous_hash": previous_hash,
    }
    entry["hash"] = calculate_record_hash(entry)

    entries.append(entry)
    save_log(path, entries)
    return entry


def verify(path: Path) -> tuple[bool, str]:
    entries = load_log(path)
    expected_previous = GENESIS_HASH

    for index, entry in enumerate(entries, start=1):
        required = {
            "entry",
            "count",
            "timestamp_utc",
            "note",
            "previous_hash",
            "hash",
        }
        missing = required.difference(entry)
        if missing:
            return False, f"Entry {index} is missing fields: {sorted(missing)}"

        if entry["entry"] != index:
            return False, f"Entry numbering breaks at entry {index}."

        if entry["previous_hash"] != expected_previous:
            return False, f"Previous-hash link breaks at entry {index}."

        calculated = calculate_record_hash(entry)
        if entry["hash"] != calculated:
            return False, f"Hash mismatch at entry {index}."

        expected_previous = entry["hash"]

    if not entries:
        return True, "Log is empty but structurally valid."

    return True, (
        f"Verified {len(entries)} entries. "
        f"Latest count: {entries[-1]['count']}. "
        f"Latest hash: {entries[-1]['hash']}"
    )


def show(path: Path) -> None:
    entries = load_log(path)
    if not entries:
        print("No entries.")
        return

    for entry in entries:
        note = f" — {entry['note']}" if entry["note"] else ""
        print(
            f"#{entry['entry']:04d}  count={entry['count']}  "
            f"{entry['timestamp_utc']}{note}\n"
            f"       {entry['hash']}"
        )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Maintain a local SHA-256 hash-chained counter."
    )
    parser.add_argument(
        "--file",
        default="counter_log.json",
        help="Path to the JSON log (default: counter_log.json).",
    )

    subparsers = parser.add_subparsers(dest="command", required=True)

    add_parser = subparsers.add_parser("add", help="Add a counter entry.")
    add_parser.add_argument("count", type=int, help="Current counter value.")
    add_parser.add_argument(
        "--note",
        default="",
        help="Optional private note. Avoid sensitive detail if the file may be shared.",
    )

    subparsers.add_parser("verify", help="Verify the entire hash chain.")
    subparsers.add_parser("show", help="Display all entries.")

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    path = Path(args.file)

    try:
        if args.command == "add":
            entry = add_entry(path, args.count, args.note)
            print(f"Recorded count {entry['count']}.")
            print(f"Entry hash: {entry['hash']}")
            print(f"Saved to: {path.resolve()}")
        elif args.command == "verify":
            valid, message = verify(path)
            print(message)
            return 0 if valid else 1
        elif args.command == "show":
            show(path)
    except RuntimeError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
