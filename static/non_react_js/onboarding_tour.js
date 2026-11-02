/* Chatterdillo new-user guided tour.
   State is kept in localStorage; steps are anchored to pages via data-tour selectors. */
(function () {
    "use strict";

    var STORAGE_KEY = "chatterdilloOnboardingTour";

    // Linear tour. Each step is tied to a page (path) and a target selector.
    // primaryClicksTarget: the tooltip's primary button triggers the real element,
    // so the tour can be driven either by the page CTA or the tooltip.
    var STEPS = [
        {
            id: "dashboard-welcome",
            path: "/dashboard/learner/",
            selector: '[data-tour="go-to-learners"]',
            title: "Welcome to Chatterdillo!",
            body: "Let's set up your first pupil together. We'll walk you through adding a learner, running a quick screener, and starting your first exercise.",
            primaryLabel: "Add a pupil",
            primaryClicksTarget: true,
        },
        {
            id: "profile-add-learner",
            path: "/profile/",
            selector: '[data-tour="add-learner"]',
            title: "Add your first pupil",
            body: "Click here to create a learner. You can use a real pupil or an example to explore with.",
            primaryLabel: "Add a pupil",
            primaryClicksTarget: true,
        },
        {
            id: "learner-form",
            path: "/add-learner/",
            selector: '[data-tour="learner-form"]',
            title: "Tell us about your pupil",
            body: "Enter a name (or nickname) and age, then submit. We'll bring you back to your profile.",
            primaryLabel: "Got it",
            primaryClicksTarget: false,
        },
        {
            id: "profile-screener",
            path: "/profile/",
            selector: ".sidebar-screener a",
            title: "Now run a screener",
            body: "Great — your pupil is added! Next, open the Screener to profile their needs and get exercise recommendations.",
            primaryLabel: "Open screener",
            primaryClicksTarget: true,
        },
        {
            id: "start-screener",
            path: "/screener/",
            selector: '[data-tour="start-screener"]',
            title: "Start the screener",
            body: "This short questionnaire takes about 10 minutes and tailors exercise suggestions to your pupil.",
            primaryLabel: "Start screener",
            primaryClicksTarget: true,
        },
        {
            id: "screener-answers",
            path: "/screener/v2/start/",
            selector: '[data-tour="screener-answers"]',
            title: "Answer each question",
            body: "Tap Yes or No for each question about your pupil. When you're done we'll show you a results summary.",
            primaryLabel: "Got it",
            primaryClicksTarget: false,
        },
        {
            id: "summary-practise",
            path: "/screener/summary/",
            selector: '[data-tour="practise-cta"]',
            title: "Here are the results",
            body: "These are your pupil's strengths and areas for support. Now head to Practise to pick an exercise.",
            primaryLabel: "Go to Practise",
            primaryClicksTarget: true,
        },
        {
            id: "first-exercise",
            path: "/practise/",
            selector: '[data-tour="first-exercise"]',
            title: "Start your first exercise",
            body: "Press START to begin. That's it — you're all set up. Enjoy exploring Chatterdillo!",
            primaryLabel: "Finish",
            primaryClicksTarget: false,
            isLast: true,
        },
    ];

    function readState() {
        try {
            var raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    }

    function writeState(state) {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            /* storage unavailable — tour simply won't persist */
        }
    }

    function currentPath() {
        return window.location.pathname;
    }

    // Pick the first step at or after the stored index whose page matches and
    // whose target is present. This lets the real CTA navigation advance the tour.
    function resolveStep(state) {
        var start = state && typeof state.step === "number" ? state.step : 0;
        for (var i = start; i < STEPS.length; i++) {
            var step = STEPS[i];
            if (step.path !== currentPath()) continue;
            var target = step.selector ? document.querySelector(step.selector) : null;
            if (step.selector && !target) continue;
            return { index: i, step: step, target: target };
        }
        return null;
    }

    var els = {};

    function removeOverlay() {
        ["backdrop", "spotlight", "tooltip"].forEach(function (key) {
            if (els[key] && els[key].parentNode) {
                els[key].parentNode.removeChild(els[key]);
            }
            els[key] = null;
        });
        window.removeEventListener("resize", reposition);
        window.removeEventListener("scroll", reposition, true);
    }

    var activeTarget = null;

    function positionSpotlight() {
        if (!els.spotlight) return;
        if (!activeTarget) {
            els.spotlight.classList.add("ob-tour-spotlight--novalue");
            return;
        }
        els.spotlight.classList.remove("ob-tour-spotlight--novalue");
        var rect = activeTarget.getBoundingClientRect();
        var pad = 8;
        els.spotlight.style.left = rect.left - pad + "px";
        els.spotlight.style.top = rect.top - pad + "px";
        els.spotlight.style.width = rect.width + pad * 2 + "px";
        els.spotlight.style.height = rect.height + pad * 2 + "px";
    }

    function positionTooltip() {
        if (!els.tooltip) return;
        var tip = els.tooltip;
        var tipRect = tip.getBoundingClientRect();
        var margin = 14;

        if (!activeTarget) {
            tip.style.left = Math.max(20, (window.innerWidth - tipRect.width) / 2) + "px";
            tip.style.top = Math.max(20, (window.innerHeight - tipRect.height) / 2) + "px";
            return;
        }

        var rect = activeTarget.getBoundingClientRect();
        var spaceBelow = window.innerHeight - rect.bottom;
        var top;
        if (spaceBelow >= tipRect.height + margin) {
            top = rect.bottom + margin;
        } else if (rect.top >= tipRect.height + margin) {
            top = rect.top - tipRect.height - margin;
        } else {
            top = Math.max(20, (window.innerHeight - tipRect.height) / 2);
        }

        var left = rect.left + rect.width / 2 - tipRect.width / 2;
        left = Math.max(20, Math.min(left, window.innerWidth - tipRect.width - 20));
        tip.style.left = left + "px";
        tip.style.top = top + "px";
    }

    function reposition() {
        positionSpotlight();
        positionTooltip();
    }

    function complete(status) {
        writeState({ status: status, step: STEPS.length });
        removeOverlay();
    }

    function renderStep(resolved, state) {
        removeOverlay();
        activeTarget = resolved.target;
        var step = resolved.step;

        writeState({ status: "active", step: resolved.index });

        var backdrop = document.createElement("div");
        backdrop.className = "ob-tour-backdrop";

        var spotlight = document.createElement("div");
        spotlight.className = "ob-tour-spotlight";

        var tooltip = document.createElement("div");
        tooltip.className = "ob-tour-tooltip";
        tooltip.setAttribute("role", "dialog");
        tooltip.setAttribute("aria-modal", "true");

        var stepLabel = document.createElement("span");
        stepLabel.className = "ob-tour-tooltip__step";
        stepLabel.textContent = "Step " + (resolved.index + 1) + " of " + STEPS.length;

        var title = document.createElement("h3");
        title.className = "ob-tour-tooltip__title";
        title.textContent = step.title;

        var body = document.createElement("p");
        body.className = "ob-tour-tooltip__body";
        body.textContent = step.body;

        var actions = document.createElement("div");
        actions.className = "ob-tour-tooltip__actions";

        var skip = document.createElement("button");
        skip.type = "button";
        skip.className = "ob-tour-tooltip__skip";
        skip.textContent = "Skip tour";
        skip.addEventListener("click", function () {
            complete("skipped");
        });

        var primary = document.createElement("button");
        primary.type = "button";
        primary.className = "btn btn--yellow btn--small ob-tour-tooltip__next";
        primary.textContent = step.primaryLabel || "Next";
        primary.addEventListener("click", function () {
            if (step.isLast) {
                complete("completed");
                if (resolved.target) resolved.target.click();
                return;
            }
            if (step.primaryClicksTarget && resolved.target) {
                resolved.target.click();
            } else {
                removeOverlay();
            }
        });

        actions.appendChild(skip);
        actions.appendChild(primary);
        tooltip.appendChild(stepLabel);
        tooltip.appendChild(title);
        tooltip.appendChild(body);
        tooltip.appendChild(actions);

        document.body.appendChild(backdrop);
        document.body.appendChild(spotlight);
        document.body.appendChild(tooltip);
        els.backdrop = backdrop;
        els.spotlight = spotlight;
        els.tooltip = tooltip;

        // On the final step, completing the tour the moment the real CTA is used.
        if (step.isLast && resolved.target) {
            resolved.target.addEventListener(
                "click",
                function () {
                    complete("completed");
                },
                { once: true }
            );
        }

        reposition();
        window.addEventListener("resize", reposition);
        window.addEventListener("scroll", reposition, true);
    }

    function init() {
        if (document.body.dataset.obTour !== "enabled") return;

        var state = readState();
        if (state && (state.status === "completed" || state.status === "skipped")) {
            return;
        }
        if (!state) {
            state = { status: "active", step: 0 };
            writeState(state);
        }

        var resolved = resolveStep(state);
        if (resolved) {
            renderStep(resolved, state);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
