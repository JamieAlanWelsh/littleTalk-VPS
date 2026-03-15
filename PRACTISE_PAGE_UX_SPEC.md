# Practise Page — Hybrid UX Wireframe-Level Layout Spec

**Approach:** Guided-first, browse-always. The primary default is a single dominant "Start Suggested" action. Zone 3 is stage-filtered by default (one stage panel visible at a time), while full-library browsing remains available as an explicit secondary action for power users.

---

## Page-Level Structure

The page uses the existing `.main-content-inner` wrapper. Inside it, three vertical zones stack in order:

```
┌─────────────────────────────────────────────┐
│  ZONE 1: Learner context bar                │
├─────────────────────────────────────────────┤
│  ZONE 2: Hero – Guided suggestion           │
├─────────────────────────────────────────────┤
│  ZONE 3: Stage tabs + Exercise library      │
└─────────────────────────────────────────────┘
```

Max-width for all zones: `700px`, centered, matching `.container--wide` (currently `800px`; request a `700px` variant or override inline). On tablet (≤900px) the same layout applies. On mobile (≤600px) existing mobile patterns apply (see Zone 3 notes).

---

## Zone 1 — Learner Context Bar

**Purpose:** Ground the session. Tell the adult whose session this is. Remove ambiguity.

**Layout:** Single horizontal bar, full width of content area. Left side: learner name and active stage badge. Right side: "Change learner" text link.

**Anatomy:**

```
[ Arlo's icon ]  Practising with: Arlo        Stage 2 [badge]      Change learner →
```

**Specifications:**

- Container: new class `.practise-context-bar` — `display: flex`, `align-items: center`, `justify-content: space-between`, `padding: 12px 16px`, `background: var(--accent-color)`, `border-radius: var(--border-radius-light)`, `margin-bottom: 20px`
- Learner name: `font-family: var(--font-outfit)`, `font-weight: 600`, `font-size: 1rem`
- Stage badge: small pill — `background: var(--yellow-button-color)`, `border-radius: 99px`, `padding: 2px 10px`, `font-size: 0.8rem`, `font-weight: 600`, `margin-left: 10px`. Text: `Stage [N]`.
  If no screener result exists, omit badge entirely (fallback handled in Zone 2).
- "Change learner" link: `font-size: 0.85rem`, `color: var(--font-color)`, `text-decoration: underline`, links to `{% url 'profile' %}`
- Mascot image from Zone 2 is **removed** from Zone 2 and placed here as a small avatar (40×40px) left of learner name. Existing image: `arlo_butterfly.png`.

**States:**

| State | Render |
|---|---|
| Learner selected, screener done | Name + stage badge + change link |
| Learner selected, no screener | Name only + change link, no badge |
| No learner selected | Zone 1 hidden; show existing no-learner state (unchanged) |

---

## Zone 2 — Hero Guided Suggestion Card

**Purpose:** One dominant action. Adult should be able to start in under 3 seconds. All supporting detail is opt-in.

**Dimensions:** Full content-area width (700px max), no min-height. Compact enough to sit above the fold on a 768px-tall tablet with Zones 1 and 3 header visible.

### Anatomy (screener recommendation available)

```
┌──────────────────────────────────────────────────────────┐
│  Suggested for today                       [Why this? ↓] │
│                                                          │
│  Think & Find          Stage 2 · ~5–7 mins              │
│  Builds: vocabulary in context, category sorting...      │
│                                                          │
│  [ START NOW — large green btn ]  [ Choose another ]     │
│                                                          │
│  [ Too hard? ]   [ Too easy? ]                          │
└──────────────────────────────────────────────────────────┘
```

**Specifications:**

- Container: reuse `.recommendation-box` base styles (accent bg, 30px padding, rounded, box-shadow). Add modifier class `.recommendation-box--hero` for an additional `border-bottom: 3px solid var(--accent-color-dark)`.
- Eyebrow label "Suggested for today": `<p class="eyebrow-label">` — `font-family: var(--font-outfit)`, `font-size: 0.85rem`, `font-weight: 600`, `text-transform: uppercase`, `letter-spacing: 0.05em`, `color: #555`, `margin-bottom: 6px`. Not an `<h>` tag.
- Exercise name: `<h2>`, `font-family: var(--font-outfit)`, `font-size: 1.4rem`, `margin: 0`
- Meta line (stage + time): `font-size: 0.9rem`, `color: #555`, immediately below h2. Stage uses the same pill badge from Zone 1.
- Skill preview: single-line summary from `game.bullet1`. Truncate at 1 line with `text-overflow: ellipsis`.
- **START NOW button:** `.btn .btn--green .btn--large .btn--full`. Links directly to the exercise URL. This is the only `btn--large` on the page.
- **"Choose another" button:** `.btn .btn--white .btn--small`, placed beside START NOW. Anchor-scrolls to `#stage-library` (`href="#stage-library"`). No JS required.
- **"Why this?" toggle:** top-right of the card. `.btn .btn--invisible .btn--small` with class `btn-why`. On click, toggles class `expanded` on `.hero-rationale` (hidden `<div>` below skill preview).
  - Rationale content (rendered server-side): "Based on screener completed [date]", "Focus area: [recommendation.focus]", "Next challenge: [recommendation.nextlevel]"
  - Use `display: none` toggled via vanilla JS; arrow icon rotates 180° via CSS `transition: transform 0.2s`.
- **"Too hard?" / "Too easy?" adaptors:** `.btn .btn--invisible .btn--small`, inline below primary CTAs. Both anchor-scroll to `#stage-library`; use `data-target-stage` attribute to pre-select the correct tab on arrival (`data-target-stage="1"` for too hard, `data-target-stage="3"` for too easy). Handled in the JS block (see JS section).

### State — No screener available

Replace exercise name and meta with:

```
  Not sure where to start?
  Complete the learner screener to get a suggestion tailored to [name].
  [ Take Screener ]         [ Browse all exercises ↓ ]
```

- No START NOW button
- Two equal-weight `.btn--white .btn--small` buttons
- Remove "Too hard?/Too easy?" row entirely

### State — No learner selected

Zone 2 is hidden. Existing no-learner state renders instead (unchanged).

---

## Zone 3 — Stage Tabs + Exercise Library

**Purpose:** Keep decision load low while preserving control. Default view is the selected stage only; a full-library view is optional. Exercises are grouped by stage and ordered simple-to-complex within each stage.

**Scale target:** Designed for ~15 exercises total (approximately 4-5 per stage).

### Anatomy

```
[ Stage 1 ]  [ Stage 2 ●  ]  [ Stage 3 ]  [ Browse all ]
                   ↑ active tab (recommended stage highlighted)

┌──────────────────────────┐  ┌──────────────────────────┐
│  Colourful Semantics     │  │  Think & Find    ✓ Focus  │
│  [icon]  Sentence build  │  │  [icon]  Vocabulary       │
│  [ START ]  [ Tutorial ] │  │  [ START ]  [ Tutorial ]  │
└──────────────────────────┘  └──────────────────────────┘

┌──────────────────────────┐
│  Concept Quest    🔒      │
│  Unlocks at Stage 3      │
└──────────────────────────┘
```

### Stage Tab Bar

- Container: `<div id="stage-library" class="stage-tab-bar">` — `display: flex`, `gap: 8px`, `margin-bottom: 24px`
- Each tab: `<button class="stage-tab" data-stage="[N]">` — `border: 2px solid var(--accent-color-dark)`, `border-radius: 99px`, `padding: 8px 18px`, `font-family: var(--font-outfit)`, `font-size: 0.9rem`, `background: white`, `cursor: pointer`
- Active tab: `background: var(--yellow-button-color)`, `border-color: var(--yellow-button-color)`, `font-weight: 600`
- Recommended stage tab gets a dot indicator rendered server-side: `<span class="stage-tab__dot">` — 8px filled circle, `background: var(--button-green)`, `border-radius: 50%`, positioned top-right of the tab button
- Default selected tab: recommended stage (or last selected stage if persistence is enabled)
- "Browse all" is a secondary control (not equal visual weight with stage tabs). It can be implemented as:
    - Option A: a text button next to tabs that opens an `all` panel
    - Option B: a fourth ghost-style chip (`.btn--invisible` styling), visually lighter than stage tabs
- "Browse all" shows all exercises grouped by stage headers, ordered Stage 1 → 2 → 3 by ascending complexity
- Active tab set server-side: template adds `active` class to the tab matching `recommended_stage`. On page load JS is not required to set the default; it only handles user interaction.

### Quick Picks Row (above stage grid)

Add a compact row directly under the stage tab bar to reduce time-to-start:

- `Suggested now` (same destination as Zone 2 START NOW)
- `Continue last session`
- `Easiest in this stage`

Rules:

- Max 3 items, horizontal row on tablet/laptop, wrap on small widths
- Secondary visual weight (smaller than hero CTA)
- If no history exists, hide `Continue last session`

### Tab Switching (JS)

On `.stage-tab` click: remove `active` from all tabs, add to clicked tab, hide all `.stage-panel` divs, show panel with matching `data-stage`. See JS section.

### Exercise Card Grid

- Stage panel container: `<div class="stage-panel" data-stage="[N]">`. Panels not matching the default active tab have `display: none` in template (server-rendered).
- Grid: `display: grid`, `grid-template-columns: 1fr 1fr` on viewports ≥700px. Single column on ≤600px. `gap: 20px`.
- Each card: `.exercise-card` — `background: var(--accent-color)`, `border-radius: var(--border-radius-light)`, `box-shadow: var(--box-shadow)`, `padding: 16px`, `display: flex`, `flex-direction: column`, `gap: 10px`
- Progressive reveal per stage: show first 3 cards by default, then a `Show more` control to reveal remaining cards in that stage.

Progressive reveal behaviour:

- If stage exercise count is `<= 3`: no `Show more` control
- If stage exercise count is `> 3`: render hidden cards with class `.is-collapsed` and add a button: `Show 2 more` (dynamic count)
- On click: reveal all remaining cards for that stage and change label to `Show less`

**Card internal layout (top to bottom):**

1. Icon row: exercise icon (48×48px) + exercise title, `display: flex`, `align-items: center`, `gap: 12px`
2. Skills summary: one bullet point, `font-size: 0.85rem`, `color: #555`
3. Button row: START (`.btn .btn--green .btn--small .btn--short`) + Tutorial (`.btn .btn--white .btn--small .btn--short`)

**Recommended badge:** if this exercise matches `recommendation.focus`, apply modifier `.exercise-card--recommended`:
- `border: 2px solid var(--button-green)`
- Small top-right label: `"✓ Recommended"`, `font-size: 0.75rem`, `color: var(--button-green)`, `font-weight: 600`, positioned `absolute`, `top: 10px`, `right: 10px`
- Parent card needs `position: relative`

**Locked state:** `opacity: 0.6`, START replaced with `<span class="btn btn--grey btn--small btn--short">Locked</span>` (non-interactive). One-line unlock reason below: e.g., `"Available in Stage 3"` or `"Complete the screener to unlock"`.

### Stage Section Heading (inside each panel)

```html
<h3 class="stage-heading">Stage 2 — Building Language</h3>
<hr class="stage-divider">
```

- `font-family: var(--font-outfit)`, `font-size: 1rem`, `font-weight: 600`, `margin-bottom: 8px`, `color: #555`
- Static subtitle copy per stage describes its focus area
- Rendered even when "All" tab is active (acts as a visual section divider between groups)

---

## Backend Changes Required

### `littleTalkApp/views_modules/practise.py`

Add two new context variables:

```python
recommended_stage = None
recommended_stage_display = None

if learner_selected and selected_learner.recommendation_level is not None:
    level = selected_learner.recommendation_level
    # Mapping: levels 0-1 → Stage 1, level 2 → Stage 2, level 3 → Stage 3
    LEVEL_TO_STAGE = {0: 1, 1: 1, 2: 2, 3: 3}
    recommended_stage = LEVEL_TO_STAGE.get(level, 1)
    recommended_stage_display = f"Stage {recommended_stage}"

context = {
    ...existing keys...,
    "recommended_stage": recommended_stage,
    "recommended_stage_display": recommended_stage_display,
}
```

No new model fields required for Phase 1.

### `littleTalkApp/content/assessments.py`

1. Add `stage` (int) and `stage_label` (str) keys to each entry in `RECOMMENDATIONS`:

```python
RECOMMENDATIONS = [
    {"stage": 1, "stage_label": "Stage 1 — Foundations", "exercises": [...], "focus": ..., "nextlevel": ...},
    {"stage": 1, "stage_label": "Stage 1 — Foundations", ...},
    {"stage": 2, "stage_label": "Stage 2 — Building Language", ...},
    {"stage": 3, "stage_label": "Stage 3 — Advanced Language", ...},
]
```

2. Add a new `STAGES` dict for the library panel structure. Populate exercise lists for Stages 2 and 3 once those exercise assets exist:

```python
STAGES = {
    1: {
        "label": "Stage 1 — Foundations",
        "exercises": ["colourful_semantics", "think_and_find"],
    },
    2: {
        "label": "Stage 2 — Building Language",
        "exercises": ["concept_quest", "categorisation"],
    },
    3: {
        "label": "Stage 3 — Advanced Language",
        "exercises": ["story_train"],  # extend when Stage 3 exercises are added
    },
}
```

Pass `STAGES` into the template context from the view.

---

## New CSS Required

Add to `static/styles/pages/practice.css`. Do not modify or remove existing `.exercise-widget` or `.recommendation-box` rules during Phase 1.

```css
/* Zone 1 */
.practise-context-bar { ... }
.stage-badge { ... }  /* pill used in both Zone 1 and Zone 2 meta */

/* Zone 2 */
.recommendation-box--hero { border-bottom: 3px solid var(--accent-color-dark); }
.eyebrow-label { font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #555; margin-bottom: 6px; }
.hero-rationale { display: none; margin-top: 10px; padding: 10px; background: #f0f3ff; border-radius: 8px; font-size: 0.9rem; }
.hero-rationale.expanded { display: block; }
.btn-why .arrow { display: inline-block; transition: transform 0.2s; }
.btn-why.expanded .arrow { transform: rotate(180deg); }

/* Zone 3 */
.stage-tab-bar { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
.stage-tab { border: 2px solid var(--accent-color-dark); border-radius: 99px; padding: 8px 18px; font-family: var(--font-outfit); font-size: 0.9rem; background: white; cursor: pointer; position: relative; }
.stage-tab.active { background: var(--yellow-button-color); border-color: var(--yellow-button-color); font-weight: 600; }
.stage-tab__dot { width: 8px; height: 8px; border-radius: 50%; background: var(--button-green); position: absolute; top: 4px; right: 6px; }
.stage-browse-all { background: transparent; border: none; text-decoration: underline; font-size: 0.85rem; }
.quick-picks { display: flex; gap: 8px; margin: 8px 0 16px; flex-wrap: wrap; }
.stage-panel { display: none; }
.stage-panel.active { display: block; }
.stage-panel__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.stage-heading { font-family: var(--font-outfit); font-size: 1rem; font-weight: 600; color: #555; margin-bottom: 8px; }
.stage-divider { border: none; border-top: 1px solid var(--border-grey); margin-bottom: 16px; }
.exercise-card { background: var(--accent-color); border-radius: var(--border-radius-light); box-shadow: var(--box-shadow); padding: 16px; display: flex; flex-direction: column; gap: 10px; position: relative; }
.exercise-card.is-collapsed { display: none; }
.stage-show-more { margin-top: 12px; }
.exercise-card--recommended { border: 2px solid var(--button-green); }
.exercise-card__recommended-label { position: absolute; top: 10px; right: 10px; font-size: 0.75rem; color: var(--button-green); font-weight: 600; }
.exercise-card__icon-row { display: flex; align-items: center; gap: 12px; }
.exercise-card__icon-row img { width: 48px; height: 48px; border-radius: var(--border-radius-light); }
.exercise-card__summary { font-size: 0.85rem; color: #555; margin: 0; }
.exercise-card__buttons { display: flex; gap: 8px; }

@media (max-width: 600px) {
    .stage-panel__grid { grid-template-columns: 1fr; }
}
```

---

## New JS Required

Add a single `<script>` block at the bottom of `practise.html`, or extract to `static/js/practise.js`.

Three behaviours, under 40 lines total:

```javascript
(function () {
  // 1. Tab switching
    const tabs = document.querySelectorAll('[data-stage]');
  const panels = document.querySelectorAll('.stage-panel');

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('active'); });
      panels.forEach(function (p) { p.classList.remove('active'); });
      tab.classList.add('active');
      var target = document.querySelector('.stage-panel[data-stage="' + tab.dataset.stage + '"]');
      if (target) target.classList.add('active');
    });
  });

  // 2. "Why this?" toggle
  var whyBtn = document.querySelector('.btn-why');
  if (whyBtn) {
    whyBtn.addEventListener('click', function () {
      var rationale = document.querySelector('.hero-rationale');
      if (rationale) rationale.classList.toggle('expanded');
      whyBtn.classList.toggle('expanded');
    });
  }

    // 3. Anchor scroll + stage pre-selection (from "Too hard?", "Too easy?", "Choose another")
  if (window.location.hash === '#stage-library') {
    var target = document.getElementById('stage-library');
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  }

  document.querySelectorAll('[data-target-stage]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var stageNum = btn.dataset.targetStage;
            var matchingTab = document.querySelector('[data-stage="' + stageNum + '"]');
      if (matchingTab) matchingTab.click();
    });
  });

    // Optional extension for scale: per-stage show more/show less toggle
    // (implement when stage exercises exceed 3 items)
})();
```

---

## Template Structure (`practise.html`)

Replace the current template body with the following structure. Existing `{% with game=... %}` blocks are replaced by template loops over `stages`:

```
{% if not learner_selected %}
    [existing no-learner block — unchanged]
{% else %}

    {# Zone 1: Learner context bar #}
    <div class="practise-context-bar"> ... </div>

    {# Zone 2: Hero guided suggestion #}
    {% if recommendation %}
        <div class="recommendation-box recommendation-box--hero"> ... guided hero ... </div>
    {% else %}
        <div class="recommendation-box recommendation-box--hero"> ... screener prompt ... </div>
    {% endif %}

    {# Zone 3: Stage tabs + exercise library #}
    <div id="stage-library">
        <div class="stage-tab-bar">
            {% for stage_num, stage_data in stages.items %}
                <button class="stage-tab {% if stage_num == recommended_stage %}active{% endif %}"
                        data-stage="{{ stage_num }}">
                    {{ stage_data.label }}
                    {% if stage_num == recommended_stage %}<span class="stage-tab__dot"></span>{% endif %}
                </button>
            {% endfor %}
            <button class="stage-browse-all" data-stage="all">Browse all</button>
        </div>

        <div class="quick-picks">
            <a class="btn btn--white btn--small" href="{{ recommendation_start_url }}">Suggested now</a>
            {% if continue_last_url %}<a class="btn btn--white btn--small" href="{{ continue_last_url }}">Continue last session</a>{% endif %}
            <button class="btn btn--white btn--small" data-target-stage="{{ recommended_stage }}">Easiest in this stage</button>
        </div>

        {% for stage_num, stage_data in stages.items %}
            <div class="stage-panel {% if stage_num == recommended_stage %}active{% endif %}"
                 data-stage="{{ stage_num }}">
                <h3 class="stage-heading">{{ stage_data.label }}</h3>
                <hr class="stage-divider">
                <div class="stage-panel__grid">
                    {% for exercise_key in stage_data.exercises %}
                        {% with game=game_descriptions|get_item:exercise_key %}
                            <div class="exercise-card {% if game.title == recommendation.focus %}exercise-card--recommended{% endif %}{% if forloop.counter > 3 %} is-collapsed{% endif %}">
                                ... card contents ...
                            </div>
                        {% endwith %}
                    {% endfor %}
                </div>
                {% if stage_data.exercises|length > 3 %}
                    <button class="btn btn--invisible btn--small stage-show-more">Show {{ stage_data.exercises|length|add:"-3" }} more</button>
                {% endif %}
            </div>
        {% endfor %}

        {# All panel #}
        <div class="stage-panel" data-stage="all">
            {% for stage_num, stage_data in stages.items %}
                <h3 class="stage-heading">{{ stage_data.label }}</h3>
                <hr class="stage-divider">
                <div class="stage-panel__grid">
                    ... same card loop as above ...
                </div>
            {% endfor %}
        </div>
    </div>

    <script src="{% static 'js/practise.js' %}"></script>
{% endif %}
```

> **Note:** The `|get_item` template filter does not exist by default in Django. Either add a custom `get_item` template filter in a `templatetags` file, or restructure `STAGES` in `assessments.py` so each exercise entry is a full dict (not a key reference) to avoid the lookup entirely.

---

## Phased Rollout

### Phase 1 — Core structure
All changes described in this spec:
- Zone 1 learner context bar
- Zone 2 guided hero (with screener fallback state)
- Zone 3 stage tab library with 2-column grid
- Zone 3 defaults to selected stage only (one stage panel at a time)
- "Why this?" toggle
- Tab JS, anchor scroll
- Backend: `recommended_stage` context, `STAGES` data structure

Existing `.exercise-widget` card blocks remain in the template below Zone 3 during Phase 1, hidden via CSS (`display: none` on a wrapping div), until Phase 2 QA sign-off.

### Phase 2 — Adaptors, persistence, and scale controls
- "Too hard / Too easy" `data-target-stage` links wired up
- Mode persistence via `localStorage` key `practise_default_mode`
- `exercise-card--recommended` badge on relevant cards
- Progressive reveal (`Show more/Show less`) when stage has more than 3 exercises
- Quick Picks row (`Suggested now`, `Continue last session`, `Easiest in this stage`)
- De-emphasized `Browse all` control (secondary visual treatment)
- Remove old `.exercise-widget` blocks

### Phase 3 — New stage content
- Populate Stage 2 and Stage 3 exercise data in `STAGES` once exercise assets exist
- Update screener scoring logic to output a `stage` value directly
- Screener recommendation can suggest both a `stage` and an `exercise` within that stage

---

## Files To Change

| File | Change |
|---|---|
| `littleTalkApp/views_modules/practise.py` | Add `recommended_stage`, `recommended_stage_display`, `stages` to context |
| `littleTalkApp/content/assessments.py` | Add `stage`/`stage_label` to `RECOMMENDATIONS`; add new `STAGES` dict |
| `littleTalkApp/templates/practise/practise.html` | Full template restructure per zone spec above |
| `static/styles/pages/practice.css` | Add new CSS classes; do not remove existing ones in Phase 1 |
| `static/js/practise.js` | New file — 3-behaviour vanilla JS (tab switch, why-this toggle, anchor scroll) |

---

## Acceptance Criteria

1. `/practise/` with a learner who has a screener result — START NOW is visible without scrolling on a 768×1024 tablet viewport.
2. All three stage tabs switch correctly — correct exercises appear/disappear, no page reload.
3. "Why this?" expands inline on click; collapses on second click.
4. "Too hard?" scrolls to `#stage-library` and activates Stage 1 tab. "Too easy?" activates Stage 3 tab.
5. `/practise/` with learner and no screener — hero shows screener prompt, START NOW is absent, all tabs and library remain fully accessible.
6. `/practise/` with no learner selected — existing no-learner state renders; nothing else changes.
7. Resize to ≤600px — exercise grid collapses to single column; context bar stacks gracefully.
8. Existing test suite (`test_assessment_flows.py`) passes with no regressions.
9. With 4-5 exercises per stage, each stage initially shows at most 3 cards, with a working `Show more` toggle.
10. `Browse all` is available but visually secondary to stage selection controls.
11. `Browse all` opens the all-exercises panel without page reload and preserves stage ordering (Stage 1 → 2 → 3).
