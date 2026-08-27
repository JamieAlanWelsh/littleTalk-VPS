// Pre-generates ElevenLabs TTS audio for exercise prompts/labels into static/ and writes a text->url manifest.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const WORKSPACE_ROOT = process.cwd();
const ENV_FILE = path.join(WORKSPACE_ROOT, ".env");
const OUTPUT_DIR = path.join(
    WORKSPACE_ROOT,
    "static/exercise_assets/tts",
);
const MANIFEST_FILE = path.join(
    WORKSPACE_ROOT,
    "frontend/src/lib/ttsManifest.json",
);
const COLOURFUL_SEMANTICS_DATA_DIR = path.join(
    WORKSPACE_ROOT,
    "frontend/src/exercises/colourfulSemantics/data",
);

const loadEnvFile = (filePath) => {
    if (!fs.existsSync(filePath)) return;
    const raw = fs.readFileSync(filePath, "utf8");
    for (const line of raw.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const equalsIndex = trimmed.indexOf("=");
        if (equalsIndex === -1) continue;
        const key = trimmed.slice(0, equalsIndex).trim();
        const value = trimmed.slice(equalsIndex + 1).trim();
        if (!(key in process.env)) {
            process.env[key] = value;
        }
    }
};

loadEnvFile(ENV_FILE);

const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";

if (!API_KEY || !VOICE_ID) {
    console.error(
        "Missing ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID in .env",
    );
    process.exit(1);
}

const VOICE_SETTINGS = {
    speed: 0.75,
    stability: 0.75,
    similarity_boost: 0.5,
    style: 0.75,
};

export const normalizeTtsText = (text) =>
    text.trim().toLowerCase().replace(/\s+/g, " ");

const hashText = (normalizedText) =>
    crypto.createHash("sha1").update(normalizedText).digest("hex");

// Fixed phrases spoken outside of exercise JSON, e.g. composed at runtime alongside word clips.
const FIXED_SPEAKABLE_STRINGS = ["That's right!"];

const collectSpeakableStrings = () => {
    const strings = new Set(FIXED_SPEAKABLE_STRINGS);

    const variantFiles = [
        "standardVariant.json",
        "earlyYearsVariant.json",
        "advancedVariant.json",
    ];
    for (const fileName of variantFiles) {
        const filePath = path.join(COLOURFUL_SEMANTICS_DATA_DIR, fileName);
        const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
        for (const scene of data.scenes ?? []) {
            for (const step of scene.steps ?? []) {
                if (step.prompt) strings.add(step.prompt);
            }
        }
    }

    const assetPool = JSON.parse(
        fs.readFileSync(
            path.join(COLOURFUL_SEMANTICS_DATA_DIR, "sharedAssetPool.json"),
            "utf8",
        ),
    );
    const labelFields = [
        "label",
        "pluralLabel",
        "pastTenseLabel",
        "whatLikeVariantLabel",
    ];
    for (const options of Object.values(assetPool)) {
        for (const option of options) {
            for (const field of labelFields) {
                if (option[field]) strings.add(option[field]);
            }
        }
    }

    return [...strings];
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const requestTtsAudio = async (text, attempt = 1) => {
    try {
        const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
            {
                method: "POST",
                headers: {
                    "xi-api-key": API_KEY,
                    "Content-Type": "application/json",
                    Accept: "audio/mpeg",
                },
                body: JSON.stringify({
                    text,
                    model_id: MODEL_ID,
                    voice_settings: VOICE_SETTINGS,
                }),
            },
        );

        if (!response.ok) {
            const errorBody = await response.text().catch(() => "");
            throw new Error(
                `ElevenLabs request failed (${response.status}): ${errorBody}`,
            );
        }

        return Buffer.from(await response.arrayBuffer());
    } catch (error) {
        if (attempt >= 5) throw error;
        await sleep(1000 * attempt);
        return requestTtsAudio(text, attempt + 1);
    }
};

const main = async () => {
    const speakableStrings = collectSpeakableStrings();
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const manifest = fs.existsSync(MANIFEST_FILE)
        ? JSON.parse(fs.readFileSync(MANIFEST_FILE, "utf8"))
        : {};

    let generatedCount = 0;
    let skippedCount = 0;
    const total = speakableStrings.length;

    for (const [index, text] of speakableStrings.entries()) {
        const progress = `[${index + 1}/${total} ${Math.round(((index + 1) / total) * 100)}%]`;
        const normalizedText = normalizeTtsText(text);
        const hash = hashText(normalizedText);
        const fileName = `${hash}.mp3`;
        const filePath = path.join(OUTPUT_DIR, fileName);
        const staticUrl = `/static/exercise_assets/tts/${fileName}`;

        if (fs.existsSync(filePath) && manifest[normalizedText] === staticUrl) {
            skippedCount += 1;
            console.log(`${progress} Skipping (up to date): "${text}"`);
            continue;
        }

        console.log(`${progress} Generating: "${text}"`);
        const audioBuffer = await requestTtsAudio(text);
        fs.writeFileSync(filePath, audioBuffer);
        manifest[normalizedText] = staticUrl;
        generatedCount += 1;
    }

    fs.writeFileSync(MANIFEST_FILE, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(
        `Done. Generated ${generatedCount}, skipped ${skippedCount} (already up to date).`,
    );
};

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
