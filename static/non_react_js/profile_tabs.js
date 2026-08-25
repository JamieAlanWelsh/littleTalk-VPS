document.addEventListener("DOMContentLoaded", () => {
    const tabs = Array.from(document.querySelectorAll("[data-profile-tab]"));
    const panels = Array.from(document.querySelectorAll("[data-profile-panel]"));

    if (!tabs.length || !panels.length) {
        return;
    }

    const STORAGE_KEY = "profileActiveTab";

    const readStoredTab = () => {
        try {
            return window.localStorage.getItem(STORAGE_KEY);
        } catch (error) {
            return null;
        }
    };

    const writeStoredTab = (panelKey) => {
        try {
            window.localStorage.setItem(STORAGE_KEY, panelKey);
        } catch (error) {
            // Ignore storage failures (e.g. private mode).
        }
    };

    const activateTab = (panelKey) => {
        tabs.forEach((tab) => {
            const isActive = tab.dataset.profileTab === panelKey;
            tab.classList.toggle("profile-tab--active", isActive);
        });

        panels.forEach((panel) => {
            const isActive = panel.dataset.profilePanel === panelKey;
            panel.classList.toggle("profile-panel--active", isActive);
        });
    };

    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            writeStoredTab(tab.dataset.profileTab);
            activateTab(tab.dataset.profileTab);
        });
    });

    const storedTab = readStoredTab();
    if (storedTab && tabs.some((tab) => tab.dataset.profileTab === storedTab)) {
        activateTab(storedTab);
    }
});
