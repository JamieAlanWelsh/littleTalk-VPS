const fs = require('fs');
const path = require('path');

const advancedVariantPath = 'frontend/src/exercises/colourful_semantics/data/advancedVariant.json';
const sharedAssetPoolPath = 'frontend/src/exercises/colourful_semantics/data/sharedAssetPool.json';

// --- Update advancedVariant.json ---
let advancedVariant = JSON.parse(fs.readFileSync(advancedVariantPath, 'utf8'));

// 1) Ensure availableOptionalSlotIds includes "to-who" and "when"
if (!advancedVariant.availableOptionalSlotIds) {
    advancedVariant.availableOptionalSlotIds = [];
}
const slots = advancedVariant.availableOptionalSlotIds;
if (!slots.includes('to-who')) slots.push('to-who');
if (!slots.includes('when')) slots.push('when');
// Re-order and unique (though the requirement says "includes both... in that order, no duplicates")
// I will just make sure they are there. If I need a specific order for the whole array, the prompt says "includes both 'to-who' and 'when' (in that order, no duplicates)".
// Let's assume it means 'to-who' should come before 'when' if they are present.
const newSlots = [];
slots.forEach(s => {
    if (s !== 'to-who' && s !== 'when') newSlots.push(s);
});
newSlots.push('to-who', 'when');
advancedVariant.availableOptionalSlotIds = [...new Set(newSlots)];

// 2 & 3 & 4) Add "when" step to specific scenes
const scenesToUpdate = {
    'blowing-bubbles': 'when-in-morning',
    'children-digging-sandpit': 'when-in-afternoon',
    'children-sitting-mat-school': 'when-in-morning',
    'boy-licking-icecream': 'when-in-summer'
};

advancedVariant.scenes.forEach(scene => {
    if (scenesToUpdate[scene.id]) {
        const correctOptionId = scenesToUpdate[scene.id];
        const whenStep = {
            id: `${scene.id}-when`,
            slot: "when",
            title: "when",
            prompt: "When?",
            color: "#b88163",
            levelIconUrl: "/static/exercise_assets/colourful_semantics/level_icons/when.png",
            levelIconAlt: "When level icon",
            optionIds: ["when-in-morning", "when-in-afternoon", "when-in-evening", "when-at-night", "when-in-summer"],
            correctOptionId: correctOptionId
        };
        
        // Remove existing when step if present
        scene.steps = scene.steps.filter(step => step.slot !== 'when');
        // Add as last step
        scene.steps.push(whenStep);
    }
});

fs.writeFileSync(advancedVariantPath, JSON.stringify(advancedVariant, null, 2) + '\n');

// --- Update sharedAssetPool.json ---
let sharedAssetPool = JSON.parse(fs.readFileSync(sharedAssetPoolPath, 'utf8'));

sharedAssetPool.when = [
    {id:"when-in-morning", imageUrl:"/static/exercise_assets/colourful_semantics/word_options/park.png", label:"in the morning", sfxUrl:"/static/exercise_assets/colourful_semantics/word_options/park.wav"},
    {id:"when-in-afternoon", imageUrl:"/static/exercise_assets/colourful_semantics/word_options/classroom.png", label:"in the afternoon", sfxUrl:"/static/exercise_assets/colourful_semantics/word_options/classroom.wav"},
    {id:"when-in-evening", imageUrl:"/static/exercise_assets/colourful_semantics/word_options/house.png", label:"in the evening", sfxUrl:"/static/exercise_assets/colourful_semantics/word_options/house.wav"},
    {id:"when-at-night", imageUrl:"/static/exercise_assets/colourful_semantics/word_options/bedroom.png", label:"at night", sfxUrl:"/static/exercise_assets/colourful_semantics/word_options/bedroom.wav"},
    {id:"when-in-summer", imageUrl:"/static/exercise_assets/colourful_semantics/word_options/beach.png", label:"in summer", sfxUrl:"/static/exercise_assets/colourful_semantics/word_options/beach.wav"}
];

fs.writeFileSync(sharedAssetPoolPath, JSON.stringify(sharedAssetPool, null, 2) + '\n');

console.log('Updated advancedVariant.json and sharedAssetPool.json');
