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
bash scripts/convert-colourful-semantics-images.sh \
  "CS new symbols" /tmp/colourful-semantics-staging 256 75
```

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

Compare the staged names against the currently referenced image names and
explicitly account for missing, extra, or renamed images before deployment.
Check actual formats and decode errors with `webpinfo` or `dwebp`, inspect
representative images and transparency, and review the reported sizes. Once
approved, copy only the mapped files to the destination and update any
affected metadata references. Keep old images where no replacement is
available; do not delete audio files. Run:

```sh
node --test scripts/tests/colourful-semantics-assets.test.mjs
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
bash scripts/convert-colourful-semantics-images.sh \
  "/path/to/new target images" /tmp/colourful-semantics-target-staging 1024 75
```

The example width and the word-option size target are not requirements for
scenes. Compare quality and file sizes with the displayed scene dimensions;
retain aspect ratio, transparency, and any needed detail. Verify each filename
against the `targetImageUrl` values in the variant JSON files before copying
into either target-image directory. Review missing, extra, and renamed images
and update metadata only where appropriate. Do not overwrite or delete
existing scenes until the replacements have been reviewed.
