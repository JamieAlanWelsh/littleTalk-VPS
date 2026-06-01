import type {
    WhosWhoChoiceCount,
    WhosWhoExercisePayload,
    WhosWhoItem,
    WhosWhoPronoun,
    WhosWhoScenario,
    WhosWhoSettings,
    WhosWhoTargetRole,
} from "./types";

const PRONOUN_TO_TARGET_ROLE: Record<WhosWhoPronoun, WhosWhoTargetRole> = {
    he: "boy",
    him: "boy",
    she: "girl",
    her: "girl",
    they: "group",
    them: "group",
};

const pickRandom = <T>(items: T[]): T => {
    return items[Math.floor(Math.random() * items.length)];
};

const shuffleItems = <T>(items: T[]): T[] => {
    const shuffled = [...items];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [
            shuffled[swapIndex],
            shuffled[index],
        ];
    }

    return shuffled;
};

const toPromptItemText = (item: WhosWhoItem) => {
    const withoutArticle = item.label.replace(/^The\s+/i, "").trim();
    return withoutArticle.toLowerCase();
};

const buildPrompt = (
    pronoun: WhosWhoPronoun,
    item: WhosWhoItem,
    templatesByPronoun: WhosWhoExercisePayload["generationConfig"]["promptTemplates"],
) => {
    const templateOptions = templatesByPronoun[pronoun];
    const template = pickRandom(templateOptions);

    return template.replaceAll("{item}", toPromptItemText(item));
};

const getDistractorTargetRole = (correctRole: WhosWhoTargetRole) => {
    if (correctRole === "group") {
        return pickRandom(["boy", "girl"] as const);
    }

    if (correctRole === "boy") {
        return pickRandom(["girl", "group"] as const);
    }

    return pickRandom(["boy", "group"] as const);
};

const getDistractorItemCount = (choiceCount: WhosWhoChoiceCount) =>
    Math.max(0, Math.min(2, choiceCount - 1));

const pickDistractorItems = (
    allItems: WhosWhoItem[],
    correctItemId: string,
    distractorCount: number,
) => {
    if (distractorCount === 0) {
        return [];
    }

    return shuffleItems(
        allItems
            .filter((item) => item.id !== correctItemId)
            .map((item) => item.id),
    ).slice(0, distractorCount);
};

export const generateWhosWhoScenarios = ({
    payload,
    rounds,
    selectedPronouns,
    choiceCount,
}: {
    payload: WhosWhoExercisePayload;
    rounds: number;
    selectedPronouns: WhosWhoSettings["selectedPronouns"];
    choiceCount: WhosWhoChoiceCount;
}): WhosWhoScenario[] => {
    const pronounPool =
        selectedPronouns.length > 0
            ? selectedPronouns
            : (["he", "she", "him", "her", "they", "them"] as const);

    const itemPool = shuffleItems(payload.items);
    let itemCursor = 0;

    const scenarios: WhosWhoScenario[] = [];

    for (let roundIndex = 0; roundIndex < rounds; roundIndex += 1) {
        const pronoun = pickRandom(pronounPool);
        const correctRole = PRONOUN_TO_TARGET_ROLE[pronoun];
        const distractorRole = getDistractorTargetRole(correctRole);

        const correctTargetId = pickRandom(
            payload.generationConfig.targetPools[correctRole],
        );
        const distractorTargetId = pickRandom(
            payload.generationConfig.targetPools[distractorRole],
        );

        const currentItem = itemPool[itemCursor % itemPool.length];
        itemCursor += 1;

        const distractorItemIds = pickDistractorItems(
            payload.items,
            currentItem.id,
            getDistractorItemCount(choiceCount),
        );

        scenarios.push({
            id: `generated-${roundIndex + 1}-${pronoun}-${currentItem.id}`,
            pronoun,
            prompt: buildPrompt(
                pronoun,
                currentItem,
                payload.generationConfig.promptTemplates,
            ),
            draggableItemId: currentItem.id,
            correctTargetId,
            targetIds: shuffleItems([correctTargetId, distractorTargetId]),
            distractorItemIds,
        });
    }

    return scenarios;
};
