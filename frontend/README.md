# littleTalk Exercises - React Framework

This directory contains a TypeScript-first React exercise framework and example exercises built with Vite for fast development and optimized production bundles.

## Framework Architecture

```
src/
├── exercises/                 # Exercise entry points (one per game, creates separate bundles)
│   ├── hello.tsx             # Proof of concept
│   ├── sentence-matching-example.tsx
│   └── [exercise-name].tsx
├── framework/                 # Reusable exercise framework
│   ├── primitives/           # Atomic UI components (text, icons)
│   │   ├── SentenceBlock.tsx # Text prompts and feedback
│   │   ├── IconBlock.tsx     # Image/icon answer options
│   │   └── index.ts
│   ├── layouts/              # Exercise container/layout components
│   │   ├── ExerciseShell.tsx # Generic exercise frame
│   │   └── index.ts
│   └── framework.css         # Framework styling with CSS variables
├── lib/                       # Shared utilities
│   ├── types.ts              # TypeScript type definitions
│   ├── bootstrap.ts          # Payload parsing and initialization
│   └── index.ts
├── components/               # Exercise-specific components (if needed)
│   └── ...
├── style.css                 # Global styles + imports
└── variables.css            # CSS custom properties (mirrors main app)
```

## Type System

The framework is built around typed payloads that Django provides via template data attributes:

```typescript
// SentenceBlock: Text display
{
  id: string;
  text: string;
  role?: 'prompt' | 'instruction' | 'feedback' | 'result';
}

// IconBlock: Image answer option
{
  id: string;
  imageUrl: string;
  label?: string;
  altText?: string;
}

// MatchingExercisePayload: Complete exercise definition
{
  exerciseId: string;
  title: string;
  instructions: string;
  prompts: SentenceBlock[];
  icons: IconBlock[];
  pairs: MatchingPair[];
  showFeedback?: boolean;
  allowRetry?: boolean;
}
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

Runs on http://localhost:5173 with hot module replacement and React Fast Refresh.

### Build for production
```bash
npm run build
```

Outputs separate bundles to `/workspace/static/js/exercises/`:
- `hello-bundle.js` (proof of concept)
- `sentence-matching-example-bundle.js` (framework example)
- `css/sentence-matching-example.css` (styles per exercise)

Each bundle is self-contained and includes React + framework + exercise logic.

## Building a New Exercise

### 1. Define Your Exercise Component

Create `src/components/MyExercise.tsx`:

```typescript
import React, { useState } from 'react';
import { MatchingExercisePayload } from '../lib/types';
import ExerciseShell from '../framework/layouts/ExerciseShell';
import { SentenceBlock, IconBlock } from '../framework/primitives';

interface MyExerciseProps {
  payload: MatchingExercisePayload;
  onComplete?: (score: number) => void;
}

export const MyExercise: React.FC<MyExerciseProps> = ({ payload, onComplete }) => {
  // Your exercise logic here
  return (
    <ExerciseShell
      title={payload.title}
      instructions={payload.instructions}
      // ... configure shell props
    >
      {/* Your exercise UI using SentenceBlock and IconBlock */}
    </ExerciseShell>
  );
};
```

### 2. Create the Entry Point

Create `src/exercises/my-exercise.tsx`:

```typescript
import 'vite/modulepreload-polyfill';
import React from 'react';
import ReactDOM from 'react-dom/client';
import '../style.css';
import MyExercise from '../components/MyExercise';
import { parseExercisePayload } from '../lib/bootstrap';

const rootElement = document.getElementById('exercise-root');

if (!rootElement) {
  console.error('Root element #exercise-root not found');
} else {
  try {
    const payload = parseExercisePayload(rootElement);
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <MyExercise payload={payload} />
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Failed to initialize exercise:', error);
  }
}
```

### 3. Register in Vite Config

Add to `vite.config.js` exercises array:

```javascript
const exercises = [
  'hello',
  'sentence-matching-example',
  'my-exercise',  // Add here
]
```

### 4. Build

```bash
npm run build
```

## Django Integration

### 1. Create a View

In `littleTalkApp/views_modules/`:

```python
import json
from django.shortcuts import render

def my_exercise(request):
    exercise_payload = {
        "exerciseId": "my-exercise",
        "title": "My Exercise Title",
        "instructions": "Instructions here...",
        "prompts": [...],
        "icons": [...],
        "pairs": [...],
        "showFeedback": True,
        "allowRetry": True
    }
    
    context = {
        "exercise_payload_json": json.dumps(exercise_payload)
    }
    return render(request, "exercises/my_exercise.html", context)
```

### 2. Create a Template

Create `littleTalkApp/templates/exercises/my_exercise.html`:

```html
{% load django_vite %}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Exercise</title>
    {% vite_hmr_client %}
    {% vite_asset 'frontend/src/style.css' %}
</head>
<body style="margin: 0; padding: 20px; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
    <div id="exercise-root" data-exercise-payload='{{ exercise_payload_json|escapejs }}'></div>
    {% vite_react_refresh %}
    {% vite_asset 'frontend/src/exercises/my-exercise.tsx' %}
</body>
</html>
```

### 3. Add URL Route

In `littleTalkApp/urls.py`:

```python
path('exercise-framework/my-exercise/', my_exercise_views.my_exercise, name='my_exercise'),
```

## Styling

The framework uses CSS custom properties (variables) for consistent styling across all exercises. Edit `frontend/src/variables.css` to match your design system:

```css
:root {
  --button-green: #33DA73;
  --target-red: #f44336;
  --border-radius: 30px;
  /* ... more variables */
}
```

Framework components use Tailwind for utility classes and custom CSS for framework-specific styles. All colors and spacing use CSS variables to maintain consistency.

## Testing

### Manual Testing

1. Start dev server: `npm run dev`
2. Load the exercise URL: `http://localhost:8000/exercise-framework/sentence-matching/`
3. Test interaction: click options, submit answers, verify feedback states

### Example Route
- **Sentence Matching Example**: `http://localhost:8000/exercise-framework/sentence-matching/`

## CSS Classes

Framework components expose these CSS classes for customization:

- `.exercise-container` - Main exercise wrapper
- `.exercise-title` - Exercise title
- `.exercise-instructions` - Instructions text
- `.exercise-prompt-area` - Prompt/question display
- `.sentence-block` - Sentence primitive
- `.exercise-answer-grid` - Answer options grid
- `.icon-block` - Individual icon option button
- `.icon-block.selected`, `.icon-block.correct`, `.icon-block.incorrect` - State variants
- `.exercise-feedback` - Feedback message
- `.exercise-button` - Action buttons
- `.exercise-button.primary`, `.exercise-button.secondary` - Button variants

See `framework/framework.css` for full styling reference.
