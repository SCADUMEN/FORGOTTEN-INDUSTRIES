#!/usr/bin/env python3
"""Create local Whisper transcript sidecars for Forgotten Industries audio intake.

This script never writes to an input audio file.  It runs Whisper locally and
writes one JSON sidecar per input under intake/_transcripts/<YYYY-MM-DD>/.
Those sidecars are intentionally ignored by Git and are detected by
manifest_audio_intake.cjs.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path
from tempfile import NamedTemporaryFile


REPO_ROOT = Path(__file__).resolve().parent.parent
SUPPORTED_SUFFIXES = {".wav", ".mp3", ".m4a", ".aiff", ".aif"}


def date_from_filename(path: Path) -> str | None:
    """Return YYYY-MM-DD when a WS-882 filename begins with YYMMDD_."""
    stem = path.stem
    if len(stem) < 7 or stem[6] != "_" or not stem[:6].isdigit():
        return None
    return f"20{stem[:2]}-{stem[2:4]}-{stem[4:6]}"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def write_json_atomically(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with NamedTemporaryFile("w", encoding="utf-8", dir=path.parent, delete=False) as temp:
        json.dump(payload, temp, indent=2, ensure_ascii=False)
        temp.write("\n")
        temporary_path = Path(temp.name)
    temporary_path.replace(path)


def make_ffmpeg_available() -> bool:
    """Use a system ffmpeg, or the local imageio-ffmpeg binary when installed."""
    if shutil.which("ffmpeg") is not None:
        return True
    try:
        import imageio_ffmpeg  # type: ignore[import-not-found]

        ffmpeg_path = Path(imageio_ffmpeg.get_ffmpeg_exe())
    except (ImportError, RuntimeError):
        return False
    # imageio-ffmpeg uses a platform-specific filename. Whisper invokes the
    # conventional `ffmpeg` command, so expose a local alias under work/.
    bin_dir = REPO_ROOT / "work" / "whisper-bin"
    bin_dir.mkdir(parents=True, exist_ok=True)
    alias = bin_dir / "ffmpeg"
    if not alias.exists():
        alias.symlink_to(ffmpeg_path)
    os.environ["PATH"] = f"{bin_dir}{os.pathsep}{os.environ.get('PATH', '')}"
    return shutil.which("ffmpeg") is not None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Transcribe selected audio locally with Whisper; input audio is never modified."
    )
    parser.add_argument("audio", nargs="+", type=Path, help="Audio files to transcribe")
    parser.add_argument(
        "--date",
        help="Transcript batch date in YYYY-MM-DD. Defaults to the WS-882 filename date.",
    )
    parser.add_argument(
        "--transcript-root",
        type=Path,
        default=REPO_ROOT / "intake" / "_transcripts",
        help="Directory that contains dated transcript folders.",
    )
    parser.add_argument(
        "--model",
        default="base",
        help="Whisper model name or a local model file path (default: base).",
    )
    parser.add_argument(
        "--model-dir",
        type=Path,
        default=REPO_ROOT / "work" / "whisper-models",
        help="Local directory for downloaded Whisper model weights.",
    )
    parser.add_argument("--language", help="Optional spoken-language code, such as en.")
    parser.add_argument("--overwrite", action="store_true", help="Replace an existing sidecar.")
    parser.add_argument(
        "--dry-run", action="store_true", help="Show sidecar destinations without loading Whisper."
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not args.dry_run and not make_ffmpeg_available():
        print(
            "ffmpeg is required for local Whisper transcription. Install ffmpeg or "
            "requirements-local-whisper.txt, then rerun.",
            file=sys.stderr,
        )
        return 2

    jobs: list[tuple[Path, Path]] = []
    for audio_path in args.audio:
        audio_path = audio_path.expanduser().resolve()
        if not audio_path.is_file():
            print(f"Not a readable file: {audio_path}", file=sys.stderr)
            return 2
        if audio_path.suffix.lower() not in SUPPORTED_SUFFIXES:
            print(f"Unsupported audio type: {audio_path.name}", file=sys.stderr)
            return 2
        batch_date = args.date or date_from_filename(audio_path)
        if batch_date is None:
            print(f"Cannot infer a batch date from {audio_path.name}; pass --date YYYY-MM-DD.", file=sys.stderr)
            return 2
        destination = args.transcript_root.expanduser().resolve() / batch_date / f"{audio_path.stem}.json"
        jobs.append((audio_path, destination))

    model = None
    if not args.dry_run:
        try:
            import whisper  # type: ignore[import-not-found]
        except ModuleNotFoundError:
            print(
                "Local Whisper is not installed. Create a virtual environment and install "
                "requirements-local-whisper.txt first.",
                file=sys.stderr,
            )
            return 2
        model = whisper.load_model(args.model, download_root=str(args.model_dir.expanduser()))

    for audio_path, destination in jobs:
        if destination.exists() and not args.overwrite:
            print(f"Exists; skipped: {destination}")
            continue
        if args.dry_run:
            print(f"Would transcribe {audio_path} -> {destination}")
            continue

        assert model is not None
        result = model.transcribe(str(audio_path), language=args.language, fp16=False)
        payload = {
            "schema": "forgotten-industries.local-whisper-transcript.v1",
            "audio_file": str(audio_path),
            "audio_sha256": sha256(audio_path),
            "audio_bytes": audio_path.stat().st_size,
            "transcribed_at_utc": datetime.now(timezone.utc).isoformat(),
            "engine": "openai-whisper",
            "model": args.model,
            "language": result.get("language"),
            "text": result.get("text", "").strip(),
            "segments": result.get("segments", []),
        }
        write_json_atomically(destination, payload)
        print(f"Wrote: {destination}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
