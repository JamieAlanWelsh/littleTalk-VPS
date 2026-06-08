import fs from "node:fs";
import path from "node:path";

const WORKSPACE_ROOT = process.cwd();
const DATA_FILE = path.join(
    WORKSPACE_ROOT,
    "frontend/src/exercises/taskMaster/exerciseData.json",
);
const GRID_ROWS = 5;
const GRID_COLUMNS = 7;
const QUESTIONS_PER_SCENE = 5;

const toDiskPath = (staticUrl) =>
    path.join(WORKSPACE_ROOT, staticUrl.replace(/^\//, ""));

const fail = (issues) => {
    console.error("Task Master data validation failed:");
    for (const issue of issues) {
        console.error(`- ${issue}`);
    }
    process.exit(1);
};

const raw = fs.readFileSync(DATA_FILE, "utf8");
const data = JSON.parse(raw);
const issues = [];

if (!Array.isArray(data.tasks) || data.tasks.length === 0) {
    issues.push("tasks must be a non-empty array");
}

if (!Array.isArray(data.objects) || data.objects.length === 0) {
    issues.push("objects must be a non-empty array");
}

const sceneIds = new Set();

for (const [sceneIndex, scene] of (data.tasks ?? []).entries()) {
    const sceneLabel = `tasks[${sceneIndex}]`;

    if (!scene?.id || typeof scene.id !== "string") {
        issues.push(`${sceneLabel}.id must be a string`);
    } else if (sceneIds.has(scene.id)) {
        issues.push(`${sceneLabel}.id '${scene.id}' is duplicated`);
    } else {
        sceneIds.add(scene.id);
    }

    if (typeof scene?.imageUrl !== "string") {
        issues.push(`${sceneLabel}.imageUrl must be a string`);
    } else {
        const diskPath = toDiskPath(scene.imageUrl);
        if (!fs.existsSync(diskPath)) {
            issues.push(`${sceneLabel}.imageUrl does not exist on disk: ${scene.imageUrl}`);
        }
    }

    if (!Array.isArray(scene?.questions)) {
        issues.push(`${sceneLabel}.questions must be an array`);
        continue;
    }

    if (scene.questions.length !== QUESTIONS_PER_SCENE) {
        issues.push(
            `${sceneLabel}.questions must contain exactly ${QUESTIONS_PER_SCENE} entries`,
        );
    }

    const questionIds = new Set();

    for (const [questionIndex, question] of scene.questions.entries()) {
        const questionLabel = `${sceneLabel}.questions[${questionIndex}]`;

        if (!question?.id || typeof question.id !== "string") {
            issues.push(`${questionLabel}.id must be a string`);
        } else if (questionIds.has(question.id)) {
            issues.push(`${questionLabel}.id '${question.id}' is duplicated in scene`);
        } else {
            questionIds.add(question.id);
        }

        if (!Array.isArray(question?.answer) || question.answer.length === 0) {
            issues.push(`${questionLabel}.answer must be a non-empty coordinate array`);
            continue;
        }

        for (const [coordIndex, coord] of question.answer.entries()) {
            if (!Array.isArray(coord) || coord.length !== 2) {
                issues.push(`${questionLabel}.answer[${coordIndex}] must be [row, col]`);
                continue;
            }

            const [row, col] = coord;

            if (!Number.isInteger(row) || !Number.isInteger(col)) {
                issues.push(
                    `${questionLabel}.answer[${coordIndex}] must use integer row/col values`,
                );
                continue;
            }

            if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLUMNS) {
                issues.push(
                    `${questionLabel}.answer[${coordIndex}] [${row}, ${col}] is outside ${GRID_COLUMNS}x${GRID_ROWS} grid`,
                );
            }
        }
    }
}

for (const [objectIndex, object] of (data.objects ?? []).entries()) {
    const objectLabel = `objects[${objectIndex}]`;

    if (typeof object?.imageUrl !== "string") {
        issues.push(`${objectLabel}.imageUrl must be a string`);
        continue;
    }

    const diskPath = toDiskPath(object.imageUrl);
    if (!fs.existsSync(diskPath)) {
        issues.push(`${objectLabel}.imageUrl does not exist on disk: ${object.imageUrl}`);
    }
}

if (issues.length > 0) {
    fail(issues);
}

console.log(
    `Task Master data is valid: ${data.tasks.length} scenes, ${QUESTIONS_PER_SCENE} questions each, ${GRID_COLUMNS}x${GRID_ROWS} bounds checked.`,
);
