#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${1:-/workspace}"

if ! command -v cwebp >/dev/null 2>&1; then
  echo "cwebp is not installed. Install package 'webp' first." >&2
  exit 1
fi

convert_count=0
skip_count=0
error_count=0

convert_file() {
  local src="$1"
  local lower
  lower="$(echo "$src" | tr '[:upper:]' '[:lower:]')"
  local out="${src%.*}.webp"

  case "$lower" in
    */static/images/linking/chatterdillo_url_img.png)
      skip_count=$((skip_count + 1))
      return 0
      ;;
    */static/images/chatterdillo_logo_official.png)
      if [[ ! -f "$out" ]]; then
        if ! cwebp -q 82 "$src" -o "$out" >/dev/null 2>&1; then
          echo "Failed: $src" >&2
          error_count=$((error_count + 1))
          return 0
        fi
        convert_count=$((convert_count + 1))
      fi
      skip_count=$((skip_count + 1))
      return 0
      ;;
  esac

  if [[ -f "$out" ]]; then
    rm -f "$src"
    convert_count=$((convert_count + 1))
    return 0
  fi

  if [[ "$lower" =~ \.(jpg|jpeg)$ ]]; then
    if ! cwebp -q 82 -m 6 "$src" -o "$out" >/dev/null 2>&1; then
      echo "Failed: $src" >&2
      error_count=$((error_count + 1))
      return 0
    fi
  else
    if ! cwebp -lossless -z 6 "$src" -o "$out" >/dev/null 2>&1; then
      echo "Failed: $src" >&2
      error_count=$((error_count + 1))
      return 0
    fi
  fi

  rm -f "$src"
  convert_count=$((convert_count + 1))
}

while IFS= read -r -d '' file; do
  convert_file "$file"
done < <(find "$ROOT_DIR/static/images" "$ROOT_DIR/static/exercise_assets" "$ROOT_DIR/static/icons" \
  -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' \) -print0)

echo "Converted: $convert_count"
echo "Skipped: $skip_count"
echo "Errors: $error_count"

if [[ "$error_count" -gt 0 ]]; then
  exit 1
fi
