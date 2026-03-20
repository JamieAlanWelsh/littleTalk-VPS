/**
 * Multiple Choice Exercise — React sandbox component.
 *
 * Uses htm (https://github.com/developit/htm) so JSX-like syntax works with
 * no build step. React and ReactDOM must be loaded before this file.
 *
 * Entry point: window.__mountReactExercise(exerciseName) is called when the
 * user clicks a [data-react-exercise] button on the practise page.
 */

(function () {
    const html = htm.bind(React.createElement);
    const { useState, useEffect, useMemo, useRef } = React;

    // ---------------------------------------------------------------------------
    // Image pool + randomized rounds for the sandbox
    // ---------------------------------------------------------------------------
    const IMAGE_POOL = [
        {
            id: "butterfly",
            label: "butterfly",
            src: "/static/images/landing/arlo_butterfly.png",
        },
        {
            id: "book",
            label: "book",
            src: "/static/images/landing/arlo_book.png",
        },
        {
            id: "teacher",
            label: "teacher",
            src: "/static/images/landing/arlo_teacher.png",
        },
        {
            id: "waving",
            label: "waving",
            src: "/static/images/landing/arlo_waving.png",
        },
        {
            id: "running",
            label: "running",
            src: "/static/images/landing/arlo_running.png",
        },
        {
            id: "target",
            label: "target",
            src: "/static/images/landing/target.png",
        },
        {
            id: "science",
            label: "science",
            src: "/static/images/landing/science.png",
        },
        {
            id: "earth",
            label: "earth",
            src: "/static/images/landing/earth.png",
        },
        {
            id: "what_we_do",
            label: "what we do",
            src: "/static/images/landing/what_we_do.png",
        },
        {
            id: "who_we_are",
            label: "who we are",
            src: "/static/images/landing/who_we_are.png",
        },
    ];

    function shuffle(items) {
        const copy = [...items];
        for (let i = copy.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }

    function buildRounds(roundCount, optionsPerRound) {
        const targets = shuffle(IMAGE_POOL).slice(0, roundCount);

        return targets.map((target, index) => {
            const distractors = shuffle(IMAGE_POOL.filter((item) => item.id !== target.id)).slice(
                0,
                optionsPerRound - 1
            );
            const options = shuffle([target, ...distractors]);

            return {
                id: index + 1,
                target,
                options,
            };
        });
    }

    // ---------------------------------------------------------------------------
    // Question screen
    // ---------------------------------------------------------------------------
    function QuestionScreen({ round, questionIndex, total, wrongCount, selectedCorrectId, onPick }) {
        function getTileClass(option) {
            const isCorrect = option.id === round.target.id;
            if (selectedCorrectId && isCorrect) {
                return "mc-tile mc-tile--correct";
            }
            return "mc-tile";
        }

        return html`
            <div class="mc-question">
                <p class="mc-progress">Question ${questionIndex + 1} of ${total}</p>
                <div class="mc-grid" role="list" aria-label="Image options">
                    ${round.options.map((opt) => html`
                        <button
                            key=${opt.id}
                            class=${getTileClass(opt)}
                            onClick=${() => onPick(opt)}
                            aria-label=${opt.label}
                        >
                            <img src=${opt.src} alt=${opt.label} class="mc-tile-image" loading="lazy" />
                        </button>
                    `)}
                </div>
                <p class="mc-instruction">Click the <strong>${round.target.label}</strong> icon.</p>
                <p class="mc-feedback mc-feedback--hint">${wrongCount > 0 ? "Not quite, try again." : ""}</p>
            </div>
        `;
    }

    // ---------------------------------------------------------------------------
    // Score / finish screen
    // ---------------------------------------------------------------------------
    function ScoreScreen({ score, total, onClose }) {
        const percent = Math.round((score / total) * 100);

        return html`
            <div class="mc-score">
                <div class="mc-score-circle">
                    <span class="mc-score-number">${score}/${total}</span>
                </div>
                <h2>Exercise Complete!</h2>
                <p class="mc-score-message">
                    ${percent >= 80
                        ? "Fantastic work! Keep it up."
                        : percent >= 50
                        ? "Good effort! Try again to improve your score."
                        : "Keep practising — you'll get there!"}
                </p>
                <button class="btn btn--green" onClick=${onClose}>Back to practise page</button>
            </div>
        `;
    }

    // ---------------------------------------------------------------------------
    // Top-level exercise component (manages state across questions)
    // ---------------------------------------------------------------------------
    function MultipleChoiceExercise({ onComplete }) {
        const rounds = useMemo(() => buildRounds(5, 5), []);
        const [questionIndex, setQuestionIndex] = useState(0);
        const [score, setScore] = useState(0);
        const [incorrectAnswers, setIncorrectAnswers] = useState(0);
        const [attemptsPerQuestion, setAttemptsPerQuestion] = useState([]);
        const [currentWrongCount, setCurrentWrongCount] = useState(0);
        const [selectedCorrectId, setSelectedCorrectId] = useState(null);
        const [finished, setFinished] = useState(false);
        const startedAt = useRef(new Date().toISOString());

        function handlePick(option) {
            if (selectedCorrectId) return;

            const currentRound = rounds[questionIndex];
            const isCorrect = option.id === currentRound.target.id;

            if (!isCorrect) {
                setCurrentWrongCount((count) => count + 1);
                setIncorrectAnswers((count) => count + 1);
                return;
            }

            const nextScore = score + 1;
            const nextAttempts = [...attemptsPerQuestion, currentWrongCount + 1];
            setScore(nextScore);
            setAttemptsPerQuestion(nextAttempts);
            setSelectedCorrectId(option.id);

            window.setTimeout(() => {
                const isLast = questionIndex + 1 >= rounds.length;
                if (isLast) {
                    submitSession(nextScore, incorrectAnswers, nextAttempts, rounds.length);
                    setFinished(true);
                    return;
                }

                setQuestionIndex((index) => index + 1);
                setCurrentWrongCount(0);
                setSelectedCorrectId(null);
            }, 350);
        }

        function submitSession(finalScore, finalIncorrect, finalAttempts, totalQuestions) {
            const config = window.__EXERCISE_CONFIG__ || {};
            if (!config.learnerUuid) return;

            const now = new Date().toISOString();
            fetch(`/api/learners/${config.learnerUuid}/update-exp/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": config.csrfToken,
                },
                body: JSON.stringify({
                    exp: finalScore * 2,
                    total_exercises: 1,
                    timestamp: now,
                    nonce: crypto.randomUUID(),
                    exercise_id: "MultipleChoice",
                    difficulty_selected: "easy",
                    started_at: startedAt.current,
                    completed_at: now,
                    total_questions: totalQuestions,
                    incorrect_answers: finalIncorrect,
                    attempts_per_question: finalAttempts,
                }),
            });
        }

        if (finished) {
            return html`<${ScoreScreen} score=${score} total=${rounds.length} onClose=${onComplete} />`;
        }

        return html`
            <${QuestionScreen}
                round=${rounds[questionIndex]}
                questionIndex=${questionIndex}
                total=${rounds.length}
                wrongCount=${currentWrongCount}
                selectedCorrectId=${selectedCorrectId}
                onPick=${handlePick}
            />
        `;
    }

    // ---------------------------------------------------------------------------
    // Full-screen overlay wrapper
    // ---------------------------------------------------------------------------
    function ExerciseOverlay({ onClose }) {
        // Close on Escape key
        useEffect(() => {
            function onKey(e) {
                if (e.key === "Escape") onClose();
            }
            document.addEventListener("keydown", onKey);
            return () => document.removeEventListener("keydown", onKey);
        }, [onClose]);

        return html`
            <div class="mc-overlay" role="dialog" aria-modal="true" aria-label="Exercise">
                <div class="mc-shell">
                    <header class="mc-topbar">
                        <button class="btn btn--white mc-back" onClick=${onClose}>Back to practise page</button>
                        <p class="mc-title">Multiple Choice (React Sandbox)</p>
                    </header>
                    <main class="mc-main">
                        <div class="mc-container">
                            <${MultipleChoiceExercise} onComplete=${onClose} />
                        </div>
                    </main>
                </div>
            </div>
        `;
    }

    // ---------------------------------------------------------------------------
    // Mount / unmount helpers
    // ---------------------------------------------------------------------------
    let activeRoot = null;
    let isClosing = false;

    function resetPageAfterExercise() {
        const container = document.getElementById("exercise-root");
        if (container) container.setAttribute("hidden", "");
        document.documentElement.classList.remove("exercise-active");
        document.body.classList.remove("exercise-active");
        document.body.style.overflow = "";
    }

    function mountExercise() {
        const container = document.getElementById("exercise-root");
        if (!container) return;
        isClosing = false;
        container.removeAttribute("hidden");
        document.documentElement.classList.add("exercise-active");
        document.body.classList.add("exercise-active");
        document.body.style.overflow = "hidden";

        activeRoot = ReactDOM.createRoot(container);
        activeRoot.render(html`<${ExerciseOverlay} onClose=${unmountExercise} />`);
    }

    function unmountExercise() {
        if (isClosing) return;

        const container = document.getElementById("exercise-root");
        const overlay = container ? container.querySelector(".mc-overlay") : null;

        if (overlay && activeRoot) {
            isClosing = true;
            overlay.classList.add("mc-overlay--closing");

            window.setTimeout(() => {
                if (activeRoot) {
                    activeRoot.unmount();
                    activeRoot = null;
                }
                resetPageAfterExercise();
                isClosing = false;
            }, 220);
            return;
        }

        if (activeRoot) {
            activeRoot.unmount();
            activeRoot = null;
        }
        resetPageAfterExercise();
    }

    // ---------------------------------------------------------------------------
    // Wire up [data-react-exercise] buttons on the practise page
    // ---------------------------------------------------------------------------
    document.addEventListener("click", function (e) {
        const btn = e.target.closest("[data-react-exercise]");
        if (!btn) return;
        mountExercise();
    });
})();
