import ttsManifest from "./ttsManifest.json";

const normalizeTtsText = (text: string) =>
    text.trim().toLowerCase().replace(/\s+/g, " ");

// Looks up pre-generated ElevenLabs audio for exact exercise text; returns null if not yet generated.
export const getTtsAudioUrl = (text: string): string | null => {
    const manifest = ttsManifest as Record<string, string>;
    return manifest[normalizeTtsText(text)] ?? null;
};

export default getTtsAudioUrl;
