document.addEventListener("DOMContentLoaded", () => {
    const learnersList = document.querySelector(".learners-list");
    const detail = document.querySelector("[data-learner-detail]");

    if (!learnersList || !detail) {
        return;
    }

    const setViewingButton = (learnerId) => {
        document.querySelectorAll("[data-learner-select]").forEach((button) => {
            button.classList.toggle("learner-button--viewing", button.dataset.learnerSelect === learnerId);
        });
    };

    const selectLearner = async (form, learnerId) => {
        const formData = new FormData(form);
        formData.set("learner_id", learnerId);

        try {
            const response = await fetch(form.action, {
                method: "POST",
                headers: { "X-Requested-With": "XMLHttpRequest" },
                body: formData,
            });

            const data = await response.json();
            if (!response.ok || !data.html) {
                throw new Error(data.error || "Unable to select learner.");
            }

            detail.innerHTML = data.html;
            window.currentLearnerUuid = data.learner_uuid;
            setViewingButton(String(data.learner_id));

            if (typeof window.initTargetsManagement === "function") {
                window.initTargetsManagement();
            }
        } catch (error) {
            // Fall back to a full page reload if the smooth switch fails.
            form.submit();
        }
    };

    learnersList.addEventListener("submit", (event) => {
        const form = event.target.closest("form");
        if (!form) {
            return;
        }

        const button = form.querySelector("[data-learner-select]");
        if (!button) {
            return;
        }

        event.preventDefault();
        selectLearner(form, button.dataset.learnerSelect);
    });
});
