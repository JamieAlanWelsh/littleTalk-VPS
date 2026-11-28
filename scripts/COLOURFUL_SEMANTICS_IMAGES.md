# Colourful Semantics image replacement

The game stores word-option images in
`static/exercise_assets/colourful_semantics/word_options/`. Scene images are in
`target_images/` and `advanced_target_images/`. The source artwork is separate
from these deployed images; keep the originals.

## Conversion

Install the WebP command-line tools (`cwebp`, `dwebp`, and `webpinfo`) using
your operating system's package manager. Work from the repository root. Create a
new, empty staging directory outside the source and destination directories:

```sh
mkdir -p /tmp/colourful-semantics-staging
bash scripts/convert-images-to-webp-staged.sh \
  "CS new symbols" /tmp/colourful-semantics-staging 256 75
```

The staged converter is general-purpose and can also be used for other
exercises. It is separate from the older `convert-images-to-webp.sh` script,
which scans static directories and deletes source files.

The last two arguments are output width in pixels and lossy quality (0–100);
they default to 256 and 75. Height is scaled proportionally, small inputs can
be upscaled, and transparency is preserved. These settings are a starting
point for the word options, not a
strict 10 KiB limit: the script reports every file's size and flags files over
10 KiB. Check the images visually at normal and high-density display sizes;
adjust quality or dimensions if necessary. A complex image may reasonably
exceed the target.

The script converts PNG, JPEG, and WebP content even when the file extension
does not match the actual format. It preserves the input files, strips a
trailing `.webp` before another extension, refuses ambiguous output names and
existing destination files, and fails explicitly for unsupported or corrupt
inputs. If a batch fails after writing some files, inspect or clear that
specific staging directory before rerunning. Only files directly inside the
input directory are processed; subdirectories are not scanned.

### Optional padding and background cleanup

For word-option artwork that has transparent padding, opt in explicitly:

```sh
mkdir -p /tmp/colourful-semantics-trimmed
bash scripts/convert-images-to-webp-staged.sh \
  "/path/to/image-only originals" /tmp/colourful-semantics-trimmed 256 75 --trim
```

Node.js and `dwebp` are also required for this mode. The input directory must
contain only supported image files; copy images into a separate input directory
if it also contains files such as `desktop.ini`. Never remove the originals to
prepare a batch.

The opt-in mode finds pixels with alpha greater than 8/255, keeps a four-pixel
margin at the source resolution, and removes only edge-connected background
pixels with alpha at most 8/255 that are more than four pixels from visible
artwork. It skips images whose visible artwork touches an edge, have no
detectable foreground, or would lose more than 0.5% of their total alpha. It
does not identify opaque backgrounds or guarantee that faint pixels are
unimportant. An image marked `SKIP` has no staged output: keep the current
deployed image and review it separately.

The width argument is the longest-side limit in trim mode (rather than an
exact width), preserving the cropped artwork's aspect ratio. Reports include
crop coordinates, estimated size gain under `object-fit: contain`, discarded
low-alpha pixel counts and file sizes. Review the results on the actual tile
colours and at desktop, mobile, and high-density sizes before copying them.
Keep or restore the existing file whenever details are lost or the result is
uncertain. Trimming alone may produce little or no visible enlargement,
especially for full-frame or tall narrow images.

For future title/slot image replacements, stage the new source files
separately and use the same opt-in command with appropriate dimensions and
quality. Match reviewed outputs to the eight files under
`static/exercise_assets/colourful_semantics/level_icons/` before replacing
anything. The current level icons are not modified by the conversion script.

Compare the staged names against the currently referenced image names and
explicitly account for missing, extra, or renamed images before deployment.
Check actual formats and decode errors with `webpinfo` or `dwebp`, inspect
representative images and transparency, and review the reported sizes. Once
approved, copy only the mapped files to the destination and update any
affected metadata references. Keep old images where no replacement is
available; do not delete audio files. Run:

```sh
node --test scripts/tests/colourful-semantics-assets.test.mjs scripts/tests/trim-image-padding.test.mjs
npm run build
```

Existing image URLs can be cached in browsers or a CDN after replacement.
Invalidate those caches or use the deployment's established cache-versioning
process.

## Future target images

For replacements supplied later, use a separate empty staging directory for
each input batch, then run the same script with dimensions and quality chosen
for the larger scene display, for example:

```sh
mkdir -p /tmp/colourful-semantics-target-staging
bash scripts/convert-images-to-webp-staged.sh \
  "/path/to/new target images" /tmp/colourful-semantics-target-staging 1024 75
```

The example width and the word-option size target are not requirements for
scenes. Compare quality and file sizes with the displayed scene dimensions;
retain aspect ratio, transparency, and any needed detail. Verify each filename
against the `targetImageUrl` values in the variant JSON files before copying
into either target-image directory. Review missing, extra, and renamed images
and update metadata only where appropriate. Do not overwrite or delete
existing scenes until the replacements have been reviewed.
