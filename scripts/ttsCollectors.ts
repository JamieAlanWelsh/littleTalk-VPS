import { getSpeakableStrings as categorisation } from "../frontend/src/exercises/categorisation/tts";
import { getSpeakableStrings as colourfulSemantics } from "../frontend/src/exercises/colourfulSemantics/tts";
import { getSpeakableStrings as conceptQuest } from "../frontend/src/exercises/conceptQuest/tts";
import { getSpeakableStrings as inTheKnow } from "../frontend/src/exercises/inTheKnow/tts";
import { getSpeakableStrings as spotOn } from "../frontend/src/exercises/spotOn/tts";
import { getSpeakableStrings as storyTrain } from "../frontend/src/exercises/storyTrain/tts";
import { getSpeakableStrings as taskMaster } from "../frontend/src/exercises/taskMaster/tts";
import { getSpeakableStrings as thinkAndFind } from "../frontend/src/exercises/thinkAndFind/tts";
import { getSpeakableStrings as whatHappensNext } from "../frontend/src/exercises/whatHappensNext/tts";
import { getSpeakableStrings as whatsInTheBag } from "../frontend/src/exercises/whatsInTheBag/tts";
import { getSpeakableStrings as whosWho } from "../frontend/src/exercises/whosWho/tts";

// Registry of per-exercise speakable-string collectors, aggregated for TTS generation.
const EXERCISE_COLLECTORS = [
    categorisation,
    colourfulSemantics,
    conceptQuest,
    inTheKnow,
    spotOn,
    storyTrain,
    taskMaster,
    thinkAndFind,
    whatHappensNext,
    whatsInTheBag,
    whosWho,
];

// Fixed phrases spoken outside of exercise data, e.g. composed at runtime alongside word clips.
export const FIXED_SPEAKABLE_STRINGS = ["That's right!"];

export const collectAllSpeakableStrings = (): string[] => {
    const strings = new Set(FIXED_SPEAKABLE_STRINGS);

    for (const collect of EXERCISE_COLLECTORS) {
        for (const text of collect()) {
            strings.add(text);
        }
    }

    return [...strings];
};
