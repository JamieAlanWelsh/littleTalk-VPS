import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
    mkdtempSync,
    mkdirSync,
    readFileSync,
    rmSync,
    copyFileSync,
    writeFileSync,
    existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../..",
);
const dataDir = path.join(
    root,
    "frontend/src/exercises/colourfulSemantics/data",
);
const script = path.join(root, "scripts/convert-colourful-semantics-images.sh");
const loadJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const localAsset = (url) => {
    assert.ok(url.startsWith("/static/"), `Unexpected asset URL: ${url}`);
    return path.join(root, url.slice(1));
};

test("word-option images and scene answers resolve across variants", () => {
    const pool = loadJson(path.join(dataDir, "sharedAssetPool.json"));
    for (const options of Object.values(pool)) {
        for (const option of options) {
            const image = readFileSync(localAsset(option.imageUrl));
            assert.equal(
                image.toString("ascii", 0, 4),
                "RIFF",
                option.imageUrl,
            );
            assert.equal(
                image.toString("ascii", 8, 12),
                "WEBP",
                option.imageUrl,
            );
        }
    }

    for (const name of [
        "standardVariant",
        "earlyYearsVariant",
        "advancedVariant",
    ]) {
        const variant = loadJson(path.join(dataDir, `${name}.json`));
        for (const scene of variant.scenes) {
            for (const step of scene.steps) {
                const allowed = variant.optionAllowlistBySlot?.[step.slot];
                assert.ok(
                    pool[step.slot].some(
                        (option) => option.id === step.correctOptionId,
                    ) &&
                        (!allowed || allowed.includes(step.correctOptionId)),
                    `${name}: ${scene.id} references unavailable ${step.correctOptionId}`,
                );
            }
        }
    }
});

test("friend options share one image and retain their distinct answers and speech", () => {
    const pool = loadJson(path.join(dataDir, "sharedAssetPool.json"));
    const manifest = loadJson(
        path.join(root, "frontend/src/lib/ttsManifest.json"),
    );
    for (const [id, label] of [
        ["to-who-friend-male", "to his friend"],
        ["to-who-friend-female", "to her friend"],
    ]) {
        const option = pool["to-who"].find((item) => item.id === id);
        assert.ok(option, id);
        assert.equal(
            option.imageUrl,
            "/static/exercise_assets/colourful_semantics/word_options/friend.webp",
        );
        assert.equal(option.label, label);
        assert.ok(
            manifest[label] && existsSync(localAsset(manifest[label])),
            `Missing TTS for ${label}`,
        );
    }
});

test("converter handles mislabeled files and refuses collisions and overwrites", () => {
    const temporary = mkdtempSync(
        path.join(tmpdir(), "colourful-semantics-test-"),
    );
    try {
        const input = path.join(temporary, "input");
        const output = path.join(temporary, "output");
        mkdirSync(input);
        mkdirSync(output);
        const image = path.join(
            root,
            "static/exercise_assets/colourful_semantics/word_options/returning.webp",
        );
        const png = path.join(input, "mislabeled.webp");
        execFileSync("dwebp", [image, "-o", png], { stdio: "pipe" });
        copyFileSync(image, path.join(input, "actual.webp"));
        copyFileSync(png, path.join(input, "shopping_bag.webp.png"));

        execFileSync("bash", [script, input, output, "128", "75"], {
            stdio: "pipe",
        });
        for (const name of [
            "mislabeled.webp",
            "actual.webp",
            "shopping_bag.webp",
        ]) {
            const converted = readFileSync(path.join(output, name));
            assert.equal(converted.toString("ascii", 0, 4), "RIFF");
            assert.equal(converted.toString("ascii", 8, 12), "WEBP");
        }
        const info = execFileSync(
            "webpinfo",
            ["-summary", path.join(output, "mislabeled.webp")],
            { encoding: "utf8" },
        );
        assert.match(info, /Alpha: 1/);
        assert.match(info, /(?:Canvas size 128 x|Width: 128)/);
        assert.equal(readFileSync(png).toString("hex", 0, 4), "89504e47");
        assert.notEqual(
            spawnSync("bash", [script, input, output], { stdio: "pipe" })
                .status,
            0,
        );

        const collisions = path.join(temporary, "collisions");
        const collisionOutput = path.join(temporary, "collision-output");
        mkdirSync(collisions);
        mkdirSync(collisionOutput);
        copyFileSync(png, path.join(collisions, "same.png"));
        copyFileSync(png, path.join(collisions, "same.webp"));
        assert.notEqual(
            spawnSync("bash", [script, collisions, collisionOutput], {
                stdio: "pipe",
            }).status,
            0,
        );
        assert.ok(!existsSync(path.join(collisionOutput, "same.webp")));

        const invalid = path.join(temporary, "invalid");
        mkdirSync(invalid);
        writeFileSync(path.join(invalid, "broken.webp"), "not an image");
        assert.notEqual(
            spawnSync("bash", [script, invalid, collisionOutput], {
                stdio: "pipe",
            }).status,
            0,
        );
    } finally {
        rmSync(temporary, { recursive: true, force: true });
    }
});
