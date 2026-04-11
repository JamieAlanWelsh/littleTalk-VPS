# Exercises App Architecture - Design Decisions

## Journey & Reasoning

### 1. Created Separate `exercises` App
**Problem:** Exercise logic was mixed into `littleTalkApp` - unclear ownership

**Decision:** Extracted `ExerciseSession`, `SubmitExerciseView`, serializers into new `exercises` app

**Reasoning:** 
- Separation of concerns - exercises is now self-contained
- Reusable module - could be extracted to package later
- Clear responsibility - littleTalkApp is learner/auth, exercises is exercise management
- Makes team work easier - different devs can own different apps

### 2. Kept ExerciseSession Model in exercises App (with db_table preservation)
**Decision:** Model lives in `exercises/models.py` while keeping legacy `littleTalkApp_exercisesession` table name

**Why:** 
- Zero database migration needed
- Django sees the model as new but uses existing table
- Cross-app relationships still work: `Learner` from `littleTalkApp` ForeignKeys to `ExerciseSession` in `exercises`

### 3. Initially Considered Django-First Question Loading
**Explored:** 
- Endpoint approach with parameters
- Descriptor endpoints
- Factory pattern with inheritance
- Service layer for question selection

**Problem:** Over-engineered for project scale (20-30 questions per exercise max)

**Decision Factors:**
- Only 20-30 questions per exercise (not 1000+)
- Questions don't change frequently
- No need for dynamic generation server-side
- Adds unnecessary complexity (Django service layer + React coordination)

### 4. Switched to React-Only Question Management
**Final Decision:** Keep all questions + selection logic in React

**Reasoning:**
- Simpler: No Django endpoints needed for question loading
- Faster deployment: No need for API round-trips
- Easier maintenance: Questions live where they're used
- Parameters defined in React: teachers adjust num_questions, difficulty directly
- Django just receives submission data

**Future Consideration:** If later we need:
- Different user roles seeing different questions
- Dynamic question generation based on learner performance
- A/B testing question variants
- Advanced analytics on question difficulty

...then refactor to Django. But YAGNI (You Aren't Gonna Need It) principle applies here.

### 5. Separated Setup/Configuration from Exercise Running
**Problem:** Putting difficulty selection in ExerciseLayout = too many responsibilities

**Solution:** 
- **ExerciseSetup component:** Handles parameter selection (num_questions, num_options, etc)
- **ExerciseLayout component:** Runs the exercise (question progression, submission, exit)
- **Parent component:** Orchestrates state flow between setup → layout → complete

**Reasoning:**
- Single Responsibility Principle - each component has one job
- ExerciseLayout stays focused on exercise execution, not configuration
- Easy to test/modify each piece independently
- Clear state flow: setup params → filter questions → run exercise
- Each exercise component (SentenceMatching, ColourfulSemantics) owns its ExerciseSetup configuration

### 6. Accepted Some Duplication (React + Django)
**Reality:** If adding new parameter (e.g., word complexity)
- React: Update ExerciseSetup, question selection logic
- Django: Update serializer validation (if needed)

**Decision:** This is acceptable because:
- Not happening frequently
- Clear where changes need to go
- Alternative (generalized parameter system) adds more complexity than it saves
- For 20-30 exercises, maintainability is better than perfect DRY

## Current Architecture

```
Frontend:
├─ ExerciseSetup (parameter selection) 
│   └─ State: num_questions, num_options, difficulty, etc
│
├─ ExerciseLayout (exercise running)
│   └─ State: current question index, exit modal, etc
│
└─ Exercise-specific components (SentenceMatching, ColourfulSemantics)
    └─ Render the interactive content

Backend:
├─ SubmitExerciseView API endpoint 
│   └─ POST /api/learners/<uuid>/submit-exercise/
│
└─ ExerciseSession model
    └─ Records what was completed (no question details)
```

## Component Breakdown

**SentenceMatchingExercise.tsx (Parent Orchestrator)**
```
1. Manage hasStarted state
2. If not started → Show ExerciseSetup
3. When setup complete → Filter questions, create tracking, show ExerciseLayout
4. When exercise done → Show ExerciseEndscreen
```

**ExerciseSetup.tsx**
- Input controls for: num_questions, num_options, difficulty
- Submit button that calls parent's onStart(params)
- Handles all parameter validation

**ExerciseLayout.tsx**
- Receives: questions array, tracking object, submission callback
- Manages question progression
- Manages exit confirmation modal
- No knowledge of how questions were selected or what parameters were used

## Key Principles
1. **Ship simple, refactor when constraint becomes reality**
2. **Don't optimize for hypothetical 1000-question exercises or frequent parameter changes that don't exist yet**
3. **Component responsibilities are clear and non-overlapping**
4. **React owns parameters and question selection logic**
5. **Django only records completed exercises, doesn't generate them**

## Future Refactoring Points
If the following become true:
- Multiple exercises with hundreds of questions each
- Questions change frequently without code deployment
- Need to generate questions dynamically based on learner performance
- Need fine-grained analytics on question difficulty

...then move question loading to Django with ExerciseLoaderFactory pattern (documented in earlier design exploration).
