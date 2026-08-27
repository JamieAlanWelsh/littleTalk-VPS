export const PROMPT_PHRASINGS = [
    "Where is the",
    "Can you find the",
    "Do you see the",
    "Can you spot the",
];

// basePrompt is stored as "Find the {descriptor}." — extract the descriptor
export const getDescriptorFromBasePrompt = (basePrompt: string): string =>
    basePrompt.replace(/^Find the /i, "").replace(/\.$/, "");

export const buildFindPrompt = (phrasing: string, descriptor: string): string =>
    `${phrasing} ${descriptor}?`;

export const randomPrompt = (basePrompt: string): string => {
    const descriptor = getDescriptorFromBasePrompt(basePrompt);
    const phrasing =
        PROMPT_PHRASINGS[Math.floor(Math.random() * PROMPT_PHRASINGS.length)];
    return buildFindPrompt(phrasing, descriptor);
};
