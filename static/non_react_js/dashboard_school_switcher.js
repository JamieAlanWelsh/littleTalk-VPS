// Switches the school being viewed on the progress dashboard.
// Changing school resets the learner/cohort filters, which are school-specific.
document.addEventListener("DOMContentLoaded", () => {
    const schoolSelect = document.getElementById("school-select");
    if (!schoolSelect) {
        return;
    }

    schoolSelect.addEventListener("change", () => {
        const selectedSchoolId = schoolSelect.value;
        const url = new URL(window.location.href);

        if (selectedSchoolId) {
            url.searchParams.set("school", selectedSchoolId);
        } else {
            url.searchParams.delete("school");
        }

        url.searchParams.delete("learner");
        url.searchParams.delete("cohort");
        window.location.href = url.toString();
    });
});
