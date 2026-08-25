document.addEventListener("DOMContentLoaded", () => {
    const groupButtons = Array.from(document.querySelectorAll("[data-group-select]"));
    const groupPanels = Array.from(document.querySelectorAll("[data-group-panel]"));

    if (!groupButtons.length || !groupPanels.length) {
        return;
    }

    const initSearchableSelects = () => {
        const select2Available = typeof window.jQuery !== "undefined" && typeof window.jQuery.fn?.select2 === "function";
        if (!select2Available) {
            return;
        }

        document.querySelectorAll("[data-group-learner-select]").forEach((select) => {
            const $select = window.jQuery(select);
            if ($select.data("select2")) {
                return;
            }

            $select.select2({
                placeholder: select.dataset.placeholder || "Search for a learner",
                width: "100%",
                allowClear: true,
                minimumResultsForSearch: 0,
                dropdownCssClass: "cohort-select2-dropdown",
                containerCssClass: "cohort-select2-container",
            });
        });
    };

    const getCsrfToken = () => {
        const cookie = document.cookie
            .split(";")
            .map((chunk) => chunk.trim())
            .find((chunk) => chunk.startsWith("csrftoken="));

        return cookie ? decodeURIComponent(cookie.split("=")[1]) : "";
    };

    const activateGroup = (groupId) => {
        groupButtons.forEach((button) => {
            const isActive = button.dataset.groupSelect === groupId;
            button.classList.toggle("learner-button--viewing", isActive);
        });

        groupPanels.forEach((panel) => {
            const isActive = panel.dataset.groupPanel === groupId;
            panel.classList.toggle("group-panel--active", isActive);
        });
    };

    const getPanelByGroupId = (groupId) => {
        return groupPanels.find((panel) => panel.dataset.groupPanel === groupId);
    };

    const removeOptionFromAllSelects = (learnerId) => {
        document.querySelectorAll("[data-group-learner-select]").forEach((select) => {
            select.querySelector(`option[value=\"${learnerId}\"]`)?.remove();
        });
    };

    const addOptionToEligibleSelects = (learner, excludedGroupId) => {
        document.querySelectorAll("[data-group-learner-select]").forEach((select) => {
            const groupId = select.dataset.groupId;
            if (!groupId || groupId === excludedGroupId) {
                return;
            }

            if (select.querySelector(`option[value=\"${learner.id}\"]`)) {
                return;
            }

            const option = document.createElement("option");
            option.value = learner.id;
            option.textContent = learner.name;
            option.dataset.learnerName = learner.name.toLowerCase();
            option.dataset.avatarColor = learner.avatar_color || "";
            option.dataset.avatarImageUrl = learner.avatar_image_url || "";
            select.appendChild(option);
            if (window.jQuery && window.jQuery(select).data("select2")) {
                window.jQuery(select).trigger("change.select2");
            }
        });
    };

    const removeLearnerChipFromAllPanels = (learnerId) => {
        groupPanels.forEach((panel) => {
            panel.querySelector(`[data-group-members] [data-learner-id=\"${learnerId}\"]`)?.remove();
            syncEmptyState(panel);
        });
    };

    const syncEmptyState = (panel) => {
        const membersWrap = panel.querySelector("[data-group-members]");
        if (!membersWrap) {
            return;
        }

        const chips = membersWrap.querySelectorAll(".cohort-member-chip");
        const existingMessage = membersWrap.querySelector("[data-group-empty]");

        if (chips.length === 0 && !existingMessage) {
            const message = document.createElement("p");
            message.className = "cohort-empty-message";
            message.dataset.groupEmpty = "true";
            message.textContent = "No learners in this group yet.";
            membersWrap.appendChild(message);
        }

        if (chips.length > 0 && existingMessage) {
            existingMessage.remove();
        }
    };

    const buildChip = (learner, panel) => {
        const chip = document.createElement("span");
        chip.className = "cohort-member-chip";
        chip.dataset.learnerId = String(learner.id);
        chip.dataset.learnerName = learner.name.toLowerCase();
        chip.dataset.avatarColor = learner.avatar_color || "";
        chip.dataset.avatarImageUrl = learner.avatar_image_url || "";

        const name = document.createElement("span");
        name.className = "cohort-member-chip__name";
        name.textContent = learner.name;

        const avatar = document.createElement("span");
        avatar.className = "cohort-member-chip__avatar";
        avatar.style.setProperty("--avatar-color", learner.avatar_color || "#f2f2f2");

        const image = document.createElement("img");
        image.className = "cohort-member-chip__image";
        image.src = learner.avatar_image_url;
        image.alt = `${learner.name} avatar`;
        avatar.appendChild(image);

        chip.appendChild(avatar);
        chip.appendChild(name);

        const removeUrl = panel.dataset.groupRemoveUrl;
        if (removeUrl) {
            const removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.className = "cohort-member-chip__remove";
            removeBtn.dataset.groupRemoveBtn = "true";
            removeBtn.dataset.learnerId = String(learner.id);
            removeBtn.setAttribute("aria-label", `Remove ${learner.name}`);
            removeBtn.textContent = "\u00d7";
            chip.appendChild(removeBtn);
        }

        return chip;
    };

    groupButtons.forEach((button) => {
        button.addEventListener("click", () => {
            activateGroup(button.dataset.groupSelect);
        });
    });

    initSearchableSelects();

    document.querySelectorAll("[data-group-add-btn]").forEach((addButton) => {
        addButton.addEventListener("click", async () => {
            const groupId = addButton.dataset.groupId;
            const panel = getPanelByGroupId(groupId);
            if (!panel) {
                return;
            }

            const select = panel.querySelector(`[data-group-learner-select][data-group-id=\"${groupId}\"]`);
            if (!select || !select.value) {
                return;
            }

            const addUrl = panel.dataset.groupAddUrl;
            if (!addUrl) {
                return;
            }

            const formData = new FormData();
            formData.append("learner_id", select.value);

            addButton.disabled = true;
            try {
                const response = await fetch(addUrl, {
                    method: "POST",
                    headers: {
                        "X-CSRFToken": getCsrfToken(),
                    },
                    body: formData,
                });

                const data = await response.json();
                if (!response.ok || !data.ok) {
                    throw new Error(data.error || "Unable to add learner.");
                }

                const membersWrap = panel.querySelector("[data-group-members]");
                if (!membersWrap) {
                    return;
                }

                removeLearnerChipFromAllPanels(String(data.learner.id));

                const existingChip = membersWrap.querySelector(`[data-learner-id=\"${data.learner.id}\"]`);
                if (!existingChip) {
                    membersWrap.appendChild(buildChip(data.learner, panel));
                }

                removeOptionFromAllSelects(String(data.learner.id));
                addOptionToEligibleSelects(data.learner, groupId);
                if (window.jQuery && window.jQuery(select).data("select2")) {
                    window.jQuery(select).val(null).trigger("change");
                } else {
                    select.value = "";
                }
                syncEmptyState(panel);
            } catch (error) {
                window.alert(error.message);
            } finally {
                addButton.disabled = false;
            }
        });
    });

    document.addEventListener("click", async (event) => {
        const removeButton = event.target.closest("[data-group-remove-btn]");
        if (!removeButton) {
            return;
        }

        const panel = removeButton.closest("[data-group-panel]");
        if (!panel) {
            return;
        }

        const removeUrl = panel.dataset.groupRemoveUrl;
        const learnerId = removeButton.dataset.learnerId;
        if (!removeUrl || !learnerId) {
            return;
        }

        const chip = removeButton.closest(".cohort-member-chip");
        const learnerName = chip?.querySelector(".cohort-member-chip__name")?.textContent || "Learner";
        const avatarColor = chip?.dataset.avatarColor || "#f2f2f2";
        const avatarImageUrl = chip?.dataset.avatarImageUrl || "";

        const formData = new FormData();
        formData.append("learner_id", learnerId);

        removeButton.disabled = true;
        try {
            const response = await fetch(removeUrl, {
                method: "POST",
                headers: {
                    "X-CSRFToken": getCsrfToken(),
                },
                body: formData,
            });

            const data = await response.json();
            if (!response.ok || !data.ok) {
                throw new Error(data.error || "Unable to remove learner.");
            }

            chip?.remove();

            removeOptionFromAllSelects(learnerId);
            addOptionToEligibleSelects(
                {
                    id: learnerId,
                    name: learnerName,
                    avatar_color: avatarColor,
                    avatar_image_url: avatarImageUrl,
                },
                null,
            );

            syncEmptyState(panel);
        } catch (error) {
            window.alert(error.message);
        } finally {
            removeButton.disabled = false;
        }
    });

    const firstButton = groupButtons.find((button) => button.classList.contains("group-select-button--active"));
    if (firstButton) {
        activateGroup(firstButton.dataset.groupSelect);
    }
});