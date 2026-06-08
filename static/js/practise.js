document.addEventListener("DOMContentLoaded", () => {
	const stageTabs = Array.from(document.querySelectorAll("[data-stage-tab]"));
	const stagePanels = Array.from(document.querySelectorAll("[data-stage-content]"));
	const whyThisToggle = document.querySelector("[data-why-this-toggle]");
	const whyThisPopup = document.querySelector("[data-why-this-popup]");
	const whyThisClose = document.querySelector("[data-why-this-close]");

	if (!stageTabs.length || !stagePanels.length) {
		// Keep popup controls working even when stage tabs are absent.
		if (!whyThisToggle || !whyThisPopup) {
			return;
		}
	}

	const activateStage = (stageNumber) => {
		stageTabs.forEach((tab) => {
			const isActive = tab.dataset.stageTab === stageNumber;
			tab.classList.toggle("stage-tab--active", isActive);
		});

		stagePanels.forEach((panel) => {
			const isActive = panel.dataset.stageContent === stageNumber;
			panel.classList.toggle("stage-library--active", isActive);
		});
	};

	stageTabs.forEach((tab) => {
		tab.addEventListener("click", () => {
			activateStage(tab.dataset.stageTab);
		});
	});

	if (whyThisToggle && whyThisPopup) {
		const openPopup = () => {
			whyThisPopup.hidden = false;
			whyThisToggle.setAttribute("aria-expanded", "true");
		};

		const closePopup = () => {
			whyThisPopup.hidden = true;
			whyThisToggle.setAttribute("aria-expanded", "false");
		};

		typeof whyThisToggle.addEventListener === "function" && whyThisToggle.addEventListener("click", openPopup);
		typeof whyThisClose?.addEventListener === "function" && whyThisClose.addEventListener("click", closePopup);

		whyThisPopup.addEventListener("click", (event) => {
			if (event.target === whyThisPopup) {
				closePopup();
			}
		});

		document.addEventListener("keydown", (event) => {
			if (event.key === "Escape" && !whyThisPopup.hidden) {
				closePopup();
			}
		});
	}
});
