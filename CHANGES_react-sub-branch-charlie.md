# Changes: `react-sub-branch-charlie` vs `react-sub-branch`

This document summarises the frontend refactoring changes made on `react-sub-branch-charlie`. These are focused on structural improvements to the exercise framework — cleaner component boundaries, CSS modules, shared types, and a redesigned action bar.

---

## Overview

The core goals of this branch were:

1. **Remove the monolithic `framework/` directory** and replace it with a cleaner, more modular `components/` + `layouts/` structure
2. **Migrate all styles to CSS Modules** (scoped per component) instead of a single global `framework.css`
3. **Introduce Zod for payload validation** at the exercise entry point
4. **Redesign the `ExerciseActionBar`** as a standalone component using typed phase-based switching
5. **Update the exercise component** (`SentenceToImageMatching`) to use the new types and components

---

## Directory Structure Changes

### Removed: `frontend/src/framework/`

The entire `framework/` directory has been deleted. This contained:

| Old file | Reason removed |
|---|---|
| `framework/layouts/ExerciseLayout.tsx` | Replaced by `layouts/ExerciseLayout.tsx` |
| `framework/layouts/index.ts` | No longer needed |
| `framework/primitives/TextPrompt.tsx` | Inline into layout, not needed as a primitive |
| `framework/primitives/index.ts` | No longer needed |
| `framework/zones/ZoneActions.tsx` | Replaced by `ExerciseActionBar` component |
| `framework/zones/ZoneInteractables.tsx` | Inline into layout's children slot |
| `framework/zones/ZonePrompt.tsx` | Inline into `ExerciseLayout` prompt card |
| `framework/zones/index.ts` | No longer needed |
| `framework/framework.css` | 299 lines of global CSS, now split into per-component CSS Modules |

### Added: `frontend/src/layouts/`

New location for layout-level components:

- `layouts/ExerciseLayout.tsx` — the main exercise shell (see below)
- `layouts/exerciseLayout.module.css` — scoped CSS for layout

### Added: `frontend/src/components/`

New location for reusable UI primitives:

| Component | Description |
|---|---|
| `components/Button/Button.tsx` | Generic action button (`primary` / `secondary` variants) |
| `components/Button/Button.module.css` | Scoped button styles, **single source of truth** for all button variants |
| `components/ExerciseActionBar/ExerciseActionBar.tsx` | Fixed bottom bar with phase-driven content |
| `components/ExerciseActionBar/exerciseActionBar.module.css` | Scoped styles for the action bar |
| `components/ImageOption/ImageOption.tsx` | Clickable image card (migrated from `framework/primitives`) |
| `components/ImageOption/ImageOption.module.css` | Styles for image option states |
| `components/ImageOption/index.ts` | Re-export for cleaner imports |

---

## Key Changes in Detail

### 1. `ExerciseLayout` — Redesigned Shell

**Old** (`framework/layouts/ExerciseLayout.tsx`): Accepted a `prompt` slot (a `ZonePrompt` component) and children. The exercise component was responsible for composing all three zones (`ZonePrompt`, `ZoneInteractables`, `ZoneActions`) manually.

**New** (`layouts/ExerciseLayout.tsx`): Accepts `title`, `instruction`, `actionBarPhase`, and the three action callbacks directly. The layout owns the bottom action bar and prompt card itself. The `children` slot is just for interactable content.

```tsx
// Old usage
<ExerciseLayout prompt={<ZonePrompt title={...} instruction={...} />}>
  <ZoneInteractables>...</ZoneInteractables>
  <ZoneActions primaryAction={...} tone={...} />
</ExerciseLayout>

// New usage
<ExerciseLayout
  title={EXERCISE_METADATA.title}
  instruction={payload.questions[currentIndex].prompt}
  actionBarPhase={questionState.answerState}
  onCheckAnswer={onCheckAnswer}
  onTryAgain={onTryAgain}
  onContinue={onContinue}
>
  {/* just the interactable content */}
</ExerciseLayout>
```

The layout also selects a random feedback message internally from preset `correctFeedbackMessages` / `incorrectFeedbackMessages` arrays based on `actionBarPhase`.

---

### 2. `ExerciseActionBar` — Phase-Based Switch

The old `ZoneActions` component used a combination of ternary chains and a `ZoneAction` object prop to decide what to render. The new `ExerciseActionBar` uses a `switch` statement on `AnswerState`:

```tsx
switch (actionBarPhase) {
  case 'notAnswered':
    rightContent = <Button label="Check Answer" onClick={onCheckAnswer} />;
    break;
  case 'correct':
    toneClass = styles.exerciseZoneActionsCorrect;
    leftContent = <p>{feedbackMessage}</p>;
    rightContent = <Button label="Continue" onClick={onContinue} />;
    break;
  case 'incorrect':
    toneClass = styles.exerciseZoneActionsIncorrect;
    leftContent = (
      <>
        <p>{feedbackMessage}</p>
        <Button label="Try Again" onClick={onTryAgain} variant="secondary" />
      </>
    );
    break;
  default: {
    const exhaustiveCheck: never = actionBarPhase;
    throw new Error(`Unhandled action bar phase: ${exhaustiveCheck}`);
  }
}
```

Key points:
- The `never` check in the default case means TypeScript will error at compile time if a new `AnswerState` value is added without handling it here
- Background colour is driven by CSS Module classes (`exerciseZoneActionsCorrect`, `exerciseZoneActionsIncorrect`) instead of inline `style={{ backgroundColor }}`
- Left/right slots give a consistent two-column layout regardless of phase

---

### 3. `Button` Component — Centralised Styles

Previously, button styles were duplicated across `framework.css`, the action bar CSS, and inline styles. Now there is a single `Button` component (`components/Button/Button.tsx`) backed by one `Button.module.css`.

All styling for `primary` and `secondary` variants — including hover, disabled, and responsive rules — lives in `Button.module.css`. Nothing else defines button styles.

---

### 4. New Type System (`lib/types.ts`)

Added Zod schemas and inferred TypeScript types to replace the old hand-written interfaces:

```ts
// New Zod-backed types
export const QuestionSchema = z.object({ id, prompt, correctIconIds });
export type Question = z.infer<typeof QuestionSchema>;

export const PictureSchema = z.object({ id, imageUrl, label, altText? });
export type Picture = z.infer<typeof PictureSchema>;

export const MatchingExercisePayload2Schema = z.object({ questions, pictures });
export type MatchingExercisePayload2 = z.infer<typeof MatchingExercisePayload2Schema>;

export type AnswerState = 'notAnswered' | 'correct' | 'incorrect';

export interface QuestionState {
  selectedIconIds: string[];
  answerState: AnswerState;
}
```

`AnswerState` (previously called `ActionBarPhase`) replaces the old boolean `isCorrect` + `showingFeedback` flags. This makes state transitions clearer and the action bar's `switch` exhaustive.

Removed: `ExerciseContextProps` (no longer needed — props are passed directly).

Added three text-size variables to `variables.css`:
```css
--text-small:  0.875rem;
--text-medium: 1rem;
--text-large:  1.25rem;
```

---

### 5. `SentenceToImageMatching` — Updated Exercise

The exercise component was updated to use the new types and component structure:

- **Props**: `payload: MatchingExercisePayload2` (replaces old `MatchingExercisePayload` with `pairs`/`icons`/`prompts`)
- **State**: Single `QuestionState` object (`selectedIconIds` + `answerState`) instead of the old multi-field `ExerciseState`
- **No `onComplete` callback** for now (removed temporarily)
- Uses `payload.questions` and `payload.pictures` (not legacy `pairs`, `icons`, `prompts`)
- Adds a local `EXERCISE_METADATA` object for static config (title, instruction string)

State management simplified — three handlers:
- `onCheckAnswer` — checks if selected IDs match `question.correctIconIds`, sets `answerState`
- `onTryAgain` — resets `questionState` to `notAnswered`
- `onContinue` — advances to next question (moves `currentQuestionStateIndex`)

---

### 6. Entry Point (`sentence-matching-example.tsx`)

- Switched from `parseExercisePayload` to the new generic `getDataExercisePayload` (reads raw JSON from `data-exercise-payload`)
- Added Zod parse at the entry point: `MatchingExercisePayload2Schema.parse(...)`
- This means any payload shape mismatch from Django is caught early with a clear error message, rather than crashing at render time
- Removed `onComplete` prop (not currently wired)

---

### 7. CSS Modules Setup (`vite-env.d.ts`)

Added `frontend/src/vite-env.d.ts` so TypeScript understands CSS Module imports:

```ts
/// <reference types="vite/client" />

declare module '*.module.css' {
  const classes: { [key: string]: string }
  export default classes
}
```

Without this, `import styles from './foo.module.css'` would produce a TypeScript error.

---

### 8. `style.css` Cleanup

- Removed `@import 'tailwindcss'` (was not in use)
- Removed `@import './framework/framework.css'` (deleted)
- Retained `@import './variables.css'` and `body.exercise-page` base styles

---

## File Summary

| Status | File |
|---|---|
| ✅ Added | `frontend/src/layouts/ExerciseLayout.tsx` |
| ✅ Added | `frontend/src/layouts/exerciseLayout.module.css` |
| ✅ Added | `frontend/src/components/Button/Button.tsx` |
| ✅ Added | `frontend/src/components/Button/Button.module.css` |
| ✅ Added | `frontend/src/components/ExerciseActionBar/ExerciseActionBar.tsx` |
| ✅ Added | `frontend/src/components/ExerciseActionBar/exerciseActionBar.module.css` |
| ✅ Added | `frontend/src/components/ImageOption/ImageOption.tsx` |
| ✅ Added | `frontend/src/components/ImageOption/ImageOption.module.css` |
| ✅ Added | `frontend/src/components/ImageOption/index.ts` |
| ✅ Added | `frontend/src/vite-env.d.ts` |
| ✅ Added | `frontend/src/lib/bootstrap.ts` (new `getDataExercisePayload` function) |
| ✏️ Modified | `frontend/src/exercises/SentenceToImageMatching.tsx` |
| ✏️ Modified | `frontend/src/exercises/sentence-matching-example.tsx` |
| ✏️ Modified | `frontend/src/lib/types.ts` |
| ✏️ Modified | `frontend/src/style.css` |
| ✏️ Modified | `frontend/src/variables.css` |
| ❌ Deleted | `frontend/src/framework/framework.css` |
| ❌ Deleted | `frontend/src/framework/layouts/ExerciseLayout.tsx` |
| ❌ Deleted | `frontend/src/framework/layouts/index.ts` |
| ❌ Deleted | `frontend/src/framework/primitives/TextPrompt.tsx` |
| ❌ Deleted | `frontend/src/framework/primitives/index.ts` |
| ❌ Deleted | `frontend/src/framework/zones/ZoneActions.tsx` |
| ❌ Deleted | `frontend/src/framework/zones/ZoneInteractables.tsx` |
| ❌ Deleted | `frontend/src/framework/zones/ZonePrompt.tsx` |
| ❌ Deleted | `frontend/src/framework/zones/index.ts` |
| ❌ Deleted | `frontend/src/exercises/hello.tsx` |
