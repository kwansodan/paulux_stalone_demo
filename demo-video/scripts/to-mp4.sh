#!/usr/bin/env bash
# Convert the recorded WebM clips to MP4.
#
# Playwright only writes WebM. That plays fine in a browser but is unreliable
# on WhatsApp and in most native video players, which is where these clips are
# actually going — so MP4 is the deliverable, not an optional extra.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
src="$here/output/clips"
dest="$here/output/mp4"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg is not installed."
  echo "  macOS:   brew install ffmpeg"
  echo "  Ubuntu:  sudo apt-get install ffmpeg"
  echo "  Windows: winget install Gyan.FFmpeg   (or scoop install ffmpeg)"
  exit 1
fi

if [ ! -d "$src" ]; then
  echo "No clips found at $src — record first with: npm run record"
  exit 1
fi

shopt -s nullglob
clips=("$src"/*.webm)

if [ ${#clips[@]} -eq 0 ]; then
  echo "No .webm files in $src — did the recording run fail?"
  exit 1
fi

mkdir -p "$dest"

for clip in "${clips[@]}"; do
  name="$(basename "${clip%.webm}")"
  out="$dest/$name.mp4"

  echo "→ $name.mp4"
  # yuv420p for players that reject other pixel formats; +faststart so the file
  # starts playing before it has fully downloaded.
  ffmpeg -y -loglevel error -i "$clip" \
    -c:v libx264 -preset slow -crf 23 \
    -pix_fmt yuv420p -movflags +faststart \
    -an \
    "$out"
done

echo
echo "Done — ${#clips[@]} file(s) in output/mp4"
ls -lh "$dest"
