import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const [input, output, maxDimension] = process.argv.slice(2);
const threshold = 8;
const margin = 4;
const maximumRemovedAlphaFraction = 0.005;

const run = (command, args) => {
    const result = spawnSync(command, args, { maxBuffer: 256 * 1024 * 1024 });
    if (result.error || result.status !== 0) {
        throw new Error(
            `${command} failed for ${input}: ${result.error?.message ?? result.stderr.toString().trim()}`,
        );
    }
    return result.stdout;
};

const main = () => {
    if (!input || !output || !/^[1-9]\d*$/.test(maxDimension ?? "")) {
        throw new Error(
            "Usage: node trim-image-padding.mjs INPUT OUTPUT.pam MAX_DIMENSION",
        );
    }
    const temporary = mkdtempSync(path.join(tmpdir(), "image-trim-"));
    try {
        const header = readFileSync(input).subarray(0, 12);
        const isWebp =
            header.toString("ascii", 0, 4) === "RIFF" &&
            header.toString("ascii", 8, 12) === "WEBP";
        const webp = isWebp ? input : path.join(temporary, "decoded.webp");
        if (!isWebp) {
            run("cwebp", ["-quiet", "-lossless", "-z", "0", input, "-o", webp]);
        }
        const pam = run("dwebp", ["-quiet", webp, "-pam", "-o", "-"]);
        const marker = Buffer.from("ENDHDR\n");
        const headerEnd = pam.indexOf(marker);
        if (headerEnd < 0) throw new Error(`Invalid PAM output for ${input}`);
        const fields = Object.fromEntries(
            pam
                .subarray(0, headerEnd)
                .toString("ascii")
                .split("\n")
                .slice(1)
                .filter((line) => line && !line.startsWith("#"))
                .map((line) => line.split(/\s+/, 2)),
        );
        const width = Number(fields.WIDTH);
        const height = Number(fields.HEIGHT);
        const pixels = pam.subarray(headerEnd + marker.length);
        if (
            !Number.isSafeInteger(width) ||
            !Number.isSafeInteger(height) ||
            width <= 0 ||
            height <= 0 ||
            fields.DEPTH !== "4" ||
            fields.MAXVAL !== "255" ||
            pixels.length !== width * height * 4
        ) {
            throw new Error(`Unsupported PAM output for ${input}`);
        }

        let left = width;
        let top = height;
        let right = -1;
        let bottom = -1;
        let totalAlpha = 0;
        const stride = width + 1;
        const foreground = new Uint32Array(stride * (height + 1));
        for (let y = 0; y < height; y++) {
            let rowForeground = 0;
            for (let x = 0; x < width; x++) {
                const alpha = pixels[(y * width + x) * 4 + 3];
                totalAlpha += alpha;
                if (alpha > threshold) {
                    rowForeground++;
                    left = Math.min(left, x);
                    top = Math.min(top, y);
                    right = Math.max(right, x);
                    bottom = Math.max(bottom, y);
                }
                foreground[(y + 1) * stride + x + 1] =
                    foreground[y * stride + x + 1] + rowForeground;
            }
        }
        if (right < 0) {
            console.log(
                "SKIP no sufficiently visible foreground; review required",
            );
            return;
        }
        if (
            left === 0 ||
            top === 0 ||
            right === width - 1 ||
            bottom === height - 1
        ) {
            console.log(
                "SKIP visible artwork touches an image edge; review required",
            );
            return;
        }

        const x0 = Math.max(0, left - margin);
        const y0 = Math.max(0, top - margin);
        const x1 = Math.min(width - 1, right + margin);
        const y1 = Math.min(height - 1, bottom + margin);
        if (x0 === 0 && y0 === 0 && x1 === width - 1 && y1 === height - 1) {
            console.log("SKIP no removable outer margin");
            return;
        }

        const background = new Uint8Array(width * height);
        const queue = new Uint32Array(width * height);
        let queueLength = 0;
        const visit = (index) => {
            if (!background[index] && pixels[index * 4 + 3] <= threshold) {
                background[index] = 1;
                queue[queueLength++] = index;
            }
        };
        for (let x = 0; x < width; x++) {
            visit(x);
            visit((height - 1) * width + x);
        }
        for (let y = 1; y < height - 1; y++) {
            visit(y * width);
            visit(y * width + width - 1);
        }
        for (let index = 0; index < queueLength; index++) {
            const pixel = queue[index];
            const x = pixel % width;
            const y = Math.floor(pixel / width);
            if (x > 0) visit(pixel - 1);
            if (x + 1 < width) visit(pixel + 1);
            if (y > 0) visit(pixel - width);
            if (y + 1 < height) visit(pixel + width);
        }
        const isBackgroundArtifact = (x, y) => {
            const index = y * width + x;
            if (!background[index] || pixels[index * 4 + 3] === 0) return false;
            const xMin = Math.max(0, x - margin);
            const xMax = Math.min(width, x + margin + 1);
            const yMin = Math.max(0, y - margin);
            const yMax = Math.min(height, y + margin + 1);
            const nearby =
                foreground[yMax * stride + xMax] -
                foreground[yMin * stride + xMax] -
                foreground[yMax * stride + xMin] +
                foreground[yMin * stride + xMin];
            return nearby === 0;
        };

        let removedPixels = 0;
        let removedAlpha = 0;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const alpha = pixels[(y * width + x) * 4 + 3];
                const outside = x < x0 || x > x1 || y < y0 || y > y1;
                if (alpha > 0 && (outside || isBackgroundArtifact(x, y))) {
                    removedPixels++;
                    removedAlpha += alpha;
                }
            }
        }
        if (removedAlpha / totalAlpha > maximumRemovedAlphaFraction) {
            console.log(
                "SKIP substantial translucent content outside crop; review required",
            );
            return;
        }

        const cropWidth = x1 - x0 + 1;
        const cropHeight = y1 - y0 + 1;
        const crop = Buffer.allocUnsafe(cropWidth * cropHeight * 4);
        for (let y = 0; y < cropHeight; y++) {
            pixels.copy(
                crop,
                y * cropWidth * 4,
                ((y + y0) * width + x0) * 4,
                ((y + y0) * width + x0 + cropWidth) * 4,
            );
            for (let x = 0; x < cropWidth; x++) {
                if (isBackgroundArtifact(x + x0, y + y0)) {
                    crop[(y * cropWidth + x) * 4 + 3] = 0;
                }
            }
        }
        const pamHeader = Buffer.from(
            `P7\nWIDTH ${cropWidth}\nHEIGHT ${cropHeight}\nDEPTH 4\nMAXVAL 255\nTUPLTYPE RGB_ALPHA\nENDHDR\n`,
        );
        writeFileSync(output, Buffer.concat([pamHeader, crop]));
        const outputWidth = Math.max(
            1,
            Math.round(
                (Number(maxDimension) * cropWidth) /
                    Math.max(cropWidth, cropHeight),
            ),
        );
        const gain = Math.max(width, height) / Math.max(cropWidth, cropHeight);
        console.log(
            `TRIM ${outputWidth} crop=${x0},${y0},${cropWidth},${cropHeight} gain=${gain.toFixed(3)} removed-low-alpha-pixels=${removedPixels} removed-alpha-fraction=${(removedAlpha / totalAlpha).toFixed(6)}`,
        );
    } finally {
        rmSync(temporary, { recursive: true, force: true });
    }
};

try {
    main();
} catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
}
