/* Chatterdillo new-user guided tour.
   State is persisted per-user on the server (shared-device safe); the current status/step
   are read from body data-* attributes and steps are anchored to pages via data-tour selectors. */
(function () {
    "use strict";

    // Linear tour. Each step is tied to a page (path) and a target selector.
    // action: how the primary button behaves,
    //   "click-target" triggers the real page element (usually navigation),
    //   "next-step" advances to the next step on the same page,
    //   "dismiss" hides the overlay but keeps the tour active,
    //   "finish" ends the tour without triggering the target.
    var STEPS = [
        {
            id: "profile-add-learner",
            path: "/profile/",
            selector: '[data-tour="add-learner"]',
            title: "Welcome to Chatterdillo!",
            body: "Let's set up your first pupil together. Click here to add a learner. You can use a real pupil or an example to explore with.",
            primaryLabel: "Add a pupil",
            action: "click-target",
        },
        {
            id: "learner-form",
            path: "/add-learner/",
            selector: '[data-tour="learner-form"]',
            title: "Tell us about your pupil",
            body: "Enter a name (or nickname) and age, then submit. We'll bring you back to your profile.",
            primaryLabel: "Got it",
            action: "dismiss",
        },
        {
            id: "profile-screener",
            path: "/profile/",
            selector: ".sidebar-screener a",
            title: "Now run a screener",
            body: "Great, your pupil is added! Next, open the Screener to profile their needs and get exercise recommendations.",
            primaryLabel: "Open screener",
            action: "click-target",
        },
        {
            id: "start-screener",
            path: "/screener/",
            selector: '[data-tour="start-screener"]',
            title: "Start the screener",
            body: "This short questionnaire takes about 10 minutes and tailors exercise suggestions to your pupil.",
            primaryLabel: "Start screener",
            action: "click-target",
        },
        {
            id: "screener-window",
            path: "/screener/v2/start/",
            selector: '[data-tour="screener-window"]',
            title: "Answer each question",
            body: "Work through the questionnaire about your pupil. When you're done we'll show you a results summary.",
            primaryLabel: "Got it",
            action: "dismiss",
        },
        {
            id: "summary-review",
            path: "/screener/summary/",
            selector: '[data-tour="screener-summary"]',
            title: "Your screener summary",
            body: "This is your screener summary, you can review this at any point.",
            primaryLabel: "Next",
            action: "next-step",
        },
        {
            id: "summary-practise",
            path: "/screener/summary/",
            selector: '[data-tour="practise-cta"]',
            title: "Time to practise",
            body: "Head to Practise to view exercise recommendations and pick an exercise.",
            primaryLabel: "Go to Practise",
            action: "click-target",
        },
        {
            id: "first-exercise",
            path: "/practise/",
            selector: '[data-tour="first-exercise"]',
            title: "Start your first exercise",
            body: "Press START on any exercise to begin. That's it, you're all set up. Enjoy exploring Chatterdillo!",
            primaryLabel: "Finish",
            action: "finish",
        },
    ];

    function getCsrfToken() {
        var match = document.cookie
            .split("; ")
            .find(function (chunk) {
                return chunk.startsWith("csrftoken=");
            });
        return match ? match.split("=")[1] : "";
    }

    // Persist tour state on the server (per-user) so it is correct on shared devices.
    function postState(status, step) {
        var url = document.body.dataset.obTourUpdateUrl;
        if (!url) return null;
        // Network failures are ignored; the UI stays optimistic.
        return fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCsrfToken(),
            },
            body: JSON.stringify({ status: status, step: step }),
            keepalive: true,
        }).catch(function () {
            return null;
        });
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
        ["spotlight", "tooltip"].forEach(function (key) {
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
        if (!els.spotlight || !activeTarget) return;
        var rect = activeTarget.getBoundingClientRect();
        var pad = 8;
        els.spotlight.style.left = rect.left - pad + "px";
        els.spotlight.style.top = rect.top - pad + "px";
        els.spotlight.style.width = rect.width + pad * 2 + "px";
        els.spotlight.style.height = rect.height + pad * 2 + "px";
    }

    function positionTooltip() {
        if (!els.tooltip || !activeTarget) return;
        var tip = els.tooltip;
        var tipRect = tip.getBoundingClientRect();
        var margin = 14;

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

    function finishTour(status) {
        postState(status, STEPS.length);
        removeOverlay();
    }

    function advanceInPage(fromIndex) {
        var nextIndex = fromIndex + 1;
        postState("in_progress", nextIndex);
        var resolved = resolveStep({ step: nextIndex });
        if (resolved) {
            renderStep(resolved);
        } else {
            removeOverlay();
        }
    }

    function renderStep(resolved) {
        removeOverlay();
        activeTarget = resolved.target;
        var step = resolved.step;

        postState("in_progress", resolved.index);

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
            finishTour("skipped");
        });

        var primary = document.createElement("button");
        primary.type = "button";
        primary.className = "btn btn--yellow btn--small ob-tour-tooltip__next";
        primary.textContent = step.primaryLabel || "Next";
        primary.addEventListener("click", function () {
            switch (step.action) {
                case "finish":
                    finishTour("completed");
                    break;
                case "click-target":
                    if (resolved.target) resolved.target.click();
                    else removeOverlay();
                    break;
                case "next-step":
                    advanceInPage(resolved.index);
                    break;
                default:
                    removeOverlay();
            }
        });

        actions.appendChild(skip);
        actions.appendChild(primary);
        tooltip.appendChild(stepLabel);
        tooltip.appendChild(title);
        tooltip.appendChild(body);
        tooltip.appendChild(actions);

        document.body.appendChild(spotlight);
        document.body.appendChild(tooltip);
        els.spotlight = spotlight;
        els.tooltip = tooltip;

        reposition();
        window.addEventListener("resize", reposition);
        window.addEventListener("scroll", reposition, true);
    }

    function startTour() {
        var startUrl = document.body.dataset.obTourStart;
        var pending = postState("in_progress", 0);
        var begin = function () {
            if (startUrl && currentPath() !== startUrl) {
                window.location.assign(startUrl);
                return;
            }
            var resolved = resolveStep({ step: 0 });
            if (resolved) renderStep(resolved);
        };
        if (pending && pending.then) {
            pending.then(begin, begin);
        } else {
            begin();
        }
    }

    function showInviteBanner() {
        var banner = document.createElement("div");
        banner.className = "ob-tour-invite";
        banner.setAttribute("role", "dialog");
        banner.setAttribute("aria-labelledby", "ob-tour-invite-title");

        var copy = document.createElement("div");
        copy.className = "ob-tour-invite__copy";

        var title = document.createElement("h2");
        title.id = "ob-tour-invite-title";
        title.className = "ob-tour-invite__title";
        title.textContent = "Welcome to Chatterdillo!";

        var text = document.createElement("p");
        text.className = "ob-tour-invite__text";
        text.textContent =
            "We noticed it's your first login. Would you like a quick tour to get started? (about 10 minutes)";

        copy.appendChild(title);
        copy.appendChild(text);

        var actions = document.createElement("div");
        actions.className = "ob-tour-invite__actions";

        var no = document.createElement("button");
        no.type = "button";
        no.className = "btn btn--white btn--small ob-tour-invite__btn";
        no.textContent = "No thanks";
        no.addEventListener("click", function () {
            postState("declined", 0);
            if (banner.parentNode) banner.parentNode.removeChild(banner);
        });

        var yes = document.createElement("button");
        yes.type = "button";
        yes.className = "btn btn--yellow btn--small ob-tour-invite__btn";
        yes.textContent = "Yes, show me around";
        yes.addEventListener("click", function () {
            if (banner.parentNode) banner.parentNode.removeChild(banner);
            startTour();
        });

        actions.appendChild(no);
        actions.appendChild(yes);
        banner.appendChild(copy);
        banner.appendChild(actions);
        document.body.appendChild(banner);
    }

    function init() {
        if (document.body.dataset.obTour !== "enabled") return;

        var status = document.body.dataset.obTourStatus;
        var step = parseInt(document.body.dataset.obTourStep, 10);
        if (isNaN(step)) step = 0;

        if (status === "completed" || status === "declined") return;

        if (status === "in_progress") {
            var resolved = resolveStep({ step: step });
            if (resolved) renderStep(resolved);
            return;
        }

        // not_offered - invite the user to take the tour.
        showInviteBanner();
    }

    // Allow other pages (e.g. Settings) to restart the tour on demand.
    window.chatterdilloOnboardingTour = { replay: startTour };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
