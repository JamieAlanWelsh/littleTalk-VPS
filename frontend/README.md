# littleTalk Exercises - React Frontend

This directory contains React components for littleTalk exercises, built with Vite for fast development and optimized production bundles.

## Structure

```
src/
├── exercises/          # Entry points for each exercise (creates separate bundles)
├── components/         # React exercise components
│   ├── shared/        # Base components (SelectionExercise, SequencingExercise)
│   └── [Exercise].jsx # Individual exercise implementations
└── hooks/             # Shared hooks (useScoring, useTimer, useAPI)
```

## Development

### Install dependencies
```bash
npm install
```

### Start dev server
```bash
npm run dev
```

Runs on http://localhost:5173 with hot module replacement.

### Build for production
```bash
npm run build
```

Outputs separate bundles to `/workspace/static/js/exercises/`:
- `colourful-semantics.js`
- `think-and-find.js`
- `concept-quest.js`
- `categorisation.js`
- `story-train.js`

Each bundle is self-contained and includes React + exercise logic.

## Adding a New Exercise

1. Create component in `src/components/NewExercise.jsx`
2. Create entry point in `src/exercises/new-exercise.jsx`
3. Add to `vite.config.js` exercises array:
   ```js
   const exercises = [
     // ... existing
     'new-exercise',
   ]
   ```
4. Build: `npm run build`

## Integration with Django

In Django templates, embed exercise like:
```html
<div id="exercise-root" 
     data-learner-uuid="{{ learner.uuid }}"
     data-difficulty="normal"
     data-exercise-data='{{ exercise_data_json }}'></div>
<script src="/static/js/exercises/colourful-semantics.js"></script>
```

Exercise will:
1. Initialize with learner UUID from data attributes
2. Handle gameplay locally
3. POST results to `/api/learners/{uuid}/update-exp/` on completion
4. Show results screen

## Key Hooks

- **useScoring()** - Calculate score based on answers + difficulty
- **useTimer()** - Track exercise duration
- **useAPI()** - Submit results to Django backend

## Base Components

- **SelectionExercise** - For multiple choice exercises
- **SequencingExercise** - For ordering/sequencing exercises

Extend these to quickly build new exercise types.
