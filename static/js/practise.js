document.addEventListener("DOMContentLoaded", () => {
	const stageTabs = Array.from(document.querySelectorAll("[data-stage-tab]"));
	const stagePanels = Array.from(document.querySelectorAll("[data-stage-content]"));

	if (!stageTabs.length || !stagePanels.length) {
		return;
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
});
