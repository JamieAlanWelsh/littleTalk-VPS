import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
    mkdtempSync,
    mkdirSync,
    readFileSync,
    readdirSync,
    rmSync,
    writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../..",
);
const helper = path.join(root, "scripts/trim-image-padding.mjs");
const converter = path.join(root, "scripts/convert-images-to-webp-staged.sh");

const makePam = (width, height, alphaAt) => {
    const header = Buffer.from(
        `P7\nWIDTH ${width}\nHEIGHT ${height}\nDEPTH 4\nMAXVAL 255\nTUPLTYPE RGB_ALPHA\nENDHDR\n`,
    );
    const pixels = Buffer.alloc(width * height * 4);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            pixels[index] = 180;
            pixels[index + 1] = 60;
            pixels[index + 2] = 30;
            pixels[index + 3] = alphaAt(x, y);
        }
    }
    return Buffer.concat([header, pixels]);
};

const readPam = (file) => {
    const data = readFileSync(file);
    const marker = Buffer.from("ENDHDR\n");
    const end = data.indexOf(marker);
    const header = data.subarray(0, end).toString("ascii");
    return {
        width: Number(header.match(/WIDTH (\d+)/)[1]),
        height: Number(header.match(/HEIGHT (\d+)/)[1]),
        pixels: data.subarray(end + marker.length),
    };
};

test("trim protects artwork and removes faint connected background noise", () => {
    const temporary = mkdtempSync(path.join(tmpdir(), "image-trim-test-"));
    try {
        const source = path.join(temporary, "source.pam");
        const webp = path.join(temporary, "mislabeled.webp");
        const output = path.join(temporary, "cropped.pam");
        writeFileSync(
            source,
            makePam(60, 60, (x, y) => {
                if (x >= 15 && x <= 44 && y >= 15 && y <= 44) return 255;
                if (x === 14 && y === 25) return 5;
                if (x === 20 && y === 10) return 100;
                if ((x === 0 && y === 0) || (x === 40 && y === 8)) return 4;
                return 0;
            }),
        );
        execFileSync("cwebp", [
            "-quiet",
            "-lossless",
            "-exact",
            source,
            "-o",
            webp,
        ]);
        const report = execFileSync("node", [helper, webp, output, "256"], {
            encoding: "utf8",
        });
        assert.match(report, /^TRIM 226 crop=11,6,38,43 /);
        assert.match(report, /removed-low-alpha-pixels=2/);
        const cropped = readPam(output);
        assert.equal(cropped.width, 38);
        assert.equal(cropped.height, 43);
        const alpha = (x, y) =>
            cropped.pixels[((y - 6) * cropped.width + x - 11) * 4 + 3];
        assert.equal(
            alpha(14, 25),
            5,
            "soft edge adjacent to artwork is preserved",
        );
        assert.equal(
            alpha(20, 10),
            100,
            "disconnected translucent detail is preserved",
        );
        assert.equal(alpha(40, 8), 0, "edge-connected faint noise is removed");
        assert.equal(alpha(15, 15), 255);
    } finally {
        rmSync(temporary, { recursive: true, force: true });
    }
});

test("trim skips opaque, transparent and uncertain artwork", () => {
    const temporary = mkdtempSync(path.join(tmpdir(), "image-trim-test-"));
    try {
        for (const [name, alphaAt, reason] of [
            ["opaque", () => 255, /touches an image edge/],
            ["transparent", () => 0, /no sufficiently visible foreground/],
            [
                "uncertain",
                (x, y) => (x >= 25 && x < 35 && y >= 25 && y < 35 ? 255 : 8),
                /substantial translucent content/,
            ],
        ]) {
            const source = path.join(temporary, `${name}.pam`);
            const image = path.join(temporary, `${name}.webp`);
            const output = path.join(temporary, `${name}-out.pam`);
            writeFileSync(source, makePam(60, 60, alphaAt));
            execFileSync("cwebp", ["-quiet", "-lossless", source, "-o", image]);
            const report = execFileSync(
                "node",
                [helper, image, output, "256"],
                {
                    encoding: "utf8",
                },
            );
            assert.match(report, reason);
            assert.throws(() => readFileSync(output), { code: "ENOENT" });
        }
    } finally {
        rmSync(temporary, { recursive: true, force: true });
    }
});

test("opt-in converter handles mislabeled PNG and cleans temporary files on failure", () => {
    const temporary = mkdtempSync(path.join(tmpdir(), "image-trim-test-"));
    try {
        const input = path.join(temporary, "input");
        const output = path.join(temporary, "output");
        mkdirSync(input);
        mkdirSync(output);
        const pam = path.join(temporary, "source.pam");
        const webp = path.join(temporary, "source.webp");
        writeFileSync(
            pam,
            makePam(60, 60, (x, y) =>
                x >= 15 && x < 45 && y >= 10 && y < 50 ? 255 : 0,
            ),
        );
        execFileSync("cwebp", ["-quiet", "-lossless", pam, "-o", webp]);
        execFileSync("dwebp", [
            "-quiet",
            webp,
            "-o",
            path.join(input, "image.webp"),
        ]);
        execFileSync(
            "bash",
            [converter, input, output, "128", "75", "--trim"],
            {
                stdio: "pipe",
            },
        );
        const result = readFileSync(path.join(output, "image.webp"));
        assert.equal(result.toString("ascii", 8, 12), "WEBP");
        assert.deepEqual(readdirSync(output), ["image.webp"]);

        const brokenInput = path.join(temporary, "broken");
        const brokenOutput = path.join(temporary, "broken-output");
        mkdirSync(brokenInput);
        mkdirSync(brokenOutput);
        writeFileSync(path.join(brokenInput, "broken.webp"), "broken");
        assert.notEqual(
            spawnSync(
                "bash",
                [converter, brokenInput, brokenOutput, "128", "75", "--trim"],
                {
                    stdio: "pipe",
                },
            ).status,
            0,
        );
        assert.deepEqual(readdirSync(brokenOutput), []);
    } finally {
        rmSync(temporary, { recursive: true, force: true });
    }
});
