#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 || $# -gt 5 || ( $# -eq 5 && "$5" != "--trim" ) ]]; then
  echo "Usage: bash $0 INPUT_DIR OUTPUT_DIR [WIDTH=256] [QUALITY=75] [--trim]" >&2
  exit 1
fi

input_dir="$1"
output_dir="$2"
width="${3:-256}"
quality="${4:-75}"
trim="${5:-}"

if ! command -v cwebp >/dev/null 2>&1; then
  echo "cwebp is required; install the webp tools first." >&2
  exit 1
fi
if [[ "$trim" == "--trim" ]] && { ! command -v node >/dev/null 2>&1 || ! command -v dwebp >/dev/null 2>&1; }; then
  echo "Trimming requires node and dwebp." >&2
  exit 1
fi
if [[ ! -d "$input_dir" || ! -d "$output_dir" ]]; then
  echo "Input and output image directories must already exist." >&2
  exit 1
fi
if [[ ! "$width" =~ ^[1-9][0-9]*$ || ! "$quality" =~ ^[0-9]+$ ]] || (( 10#$quality > 100 )); then
  echo "Width must be a positive integer and quality must be between 0 and 100." >&2
  exit 1
fi
input_dir="$(cd "$input_dir" && pwd -P)"
output_dir="$(cd "$output_dir" && pwd -P)"
if [[ "$input_dir" == "$output_dir" ]]; then
  echo "Input and output directories must be different." >&2
  exit 1
fi

mapfile -d '' -t inputs < <(find "$input_dir" -maxdepth 1 -type f -print0 | sort -z)
if (( ${#inputs[@]} == 0 )); then
  echo "No input files found in $input_dir." >&2
  exit 1
fi

declare -A destinations=()
outputs=()
for input in "${inputs[@]}"; do
  name="${input##*/}"
  extension="${name##*.}"
  case "${extension,,}" in
    png|jpg|jpeg|webp) ;;
    *) echo "Unsupported input file: $input" >&2; exit 1 ;;
  esac
  stem="${name%.*}"
  if [[ "${stem,,}" == *.webp ]]; then
    stem="${stem%.*}"
  fi
  if [[ -z "$stem" ]]; then
    echo "Empty output name for: $input" >&2
    exit 1
  fi
  output="$output_dir/$stem.webp"
  if [[ -n "${destinations[$output]+set}" ]]; then
    echo "Output collision: $input and ${destinations[$output]} both map to $output" >&2
    exit 1
  fi
  if [[ -e "$output" || -L "$output" ]]; then
    echo "Refusing to overwrite: $output" >&2
    exit 1
  fi
  destinations["$output"]="$input"
  outputs+=("$output")
done

temporary=""
temporary_pam=""
cleanup() {
  if [[ -n "$temporary" && -f "$temporary" ]]; then
    rm -- "$temporary"
  fi
  if [[ -n "$temporary_pam" && -f "$temporary_pam" ]]; then
    rm -- "$temporary_pam"
  fi
}
trap cleanup EXIT

oversize=0
skipped=0
for index in "${!inputs[@]}"; do
  input="${inputs[$index]}"
  output="${outputs[$index]}"
  temporary="$(mktemp "$output_dir/.webp-conversion.XXXXXXXX")"
  source="$input"
  output_width="$width"
  trim_report=""
  if [[ "$trim" == "--trim" ]]; then
    temporary_pam="$(mktemp "$output_dir/.webp-trim.XXXXXXXX")"
    if ! trim_report="$(node "$(dirname "${BASH_SOURCE[0]}")/trim-image-padding.mjs" "$input" "$temporary_pam" "$width")"; then
      echo "Trimming failed: $input" >&2
      exit 1
    fi
    if [[ "$trim_report" == SKIP\ * ]]; then
      printf '%s: %s\n' "$input" "$trim_report"
      rm -- "$temporary" "$temporary_pam"
      temporary=""
      temporary_pam=""
      skipped=$((skipped + 1))
      continue
    fi
    output_width="${trim_report#TRIM }"
    output_width="${output_width%% *}"
    source="$temporary_pam"
  fi
  if ! cwebp -quiet -q "$quality" -m 6 -resize "$output_width" 0 "$source" -o "$temporary"; then
    echo "Conversion failed: $input" >&2
    exit 1
  fi
  bytes="$(wc -c < "$temporary")"
  mv -n -- "$temporary" "$output"
  if [[ -e "$temporary" ]]; then
    echo "Refusing to overwrite: $output" >&2
    exit 1
  fi
  temporary=""
  if [[ -n "$temporary_pam" ]]; then
    rm -- "$temporary_pam"
    temporary_pam=""
  fi
  report_suffix=""
  if [[ -n "$trim_report" ]]; then
    report_suffix=" $trim_report"
  fi
  if (( bytes > 10240 )); then
    printf '%s -> %s: %s bytes (over 10 KiB)%s\n' "$input" "$output" "$bytes" "$report_suffix"
    oversize=$((oversize + 1))
  else
    printf '%s -> %s: %s bytes%s\n' "$input" "$output" "$bytes" "$report_suffix"
  fi
done
if [[ "$trim" == "--trim" ]]; then
  printf 'Converted %s files; %s skipped; %s exceed 10 KiB. Sources were not modified.\n' "$(( ${#inputs[@]} - skipped ))" "$skipped" "$oversize"
else
  printf 'Converted %s files; %s exceed 10 KiB. Sources were not modified.\n' "${#inputs[@]}" "$oversize"
fi
