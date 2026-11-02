/* global Chart */
document.addEventListener("DOMContentLoaded", () => {
    const dateRangeSelect = document.getElementById("multischool-date-range");
    const schoolSelect = document.getElementById("multischool-school-filter");
    const metricButtons = document.querySelectorAll("[data-multischool-metric]");
    const messageEl = document.getElementById("multischool-dashboard-message");
    const canvas = document.getElementById("multischool-progress-chart");

    if (!canvas) {
        return;
    }

    const chartCtx = canvas.getContext("2d");
    let progressChart = null;

    // Distinct colours cycled per school series.
    const palette = [
        "#2D8CFF", "#00B894", "#F39C12", "#E84393", "#6C5CE7",
        "#E17055", "#00CEC9", "#FDCB6E", "#0984E3", "#D63031",
    ];

    function setMessage(text, isError = false) {
        if (!messageEl) {
            return;
        }
        messageEl.textContent = text || "";
        messageEl.classList.toggle("error", Boolean(text) && isError);
        messageEl.classList.toggle("success", Boolean(text) && !isError);
    }

    function getSelectedMetric() {
        const active = document.querySelector("[data-multischool-metric].active");
        return active ? active.dataset.multischoolMetric : "sessions";
    }

    function getSelectedDateRange() {
        return dateRangeSelect ? dateRangeSelect.value : "all";
    }

    function getSelectedSchool() {
        return schoolSelect ? schoolSelect.value : "";
    }

    function buildChart(labels, series) {
        if (progressChart) {
            progressChart.destroy();
        }

        const datasets = series.map((item, index) => {
            const color = palette[index % palette.length];
            return {
                label: item.school_name,
                data: item.values,
                borderColor: color,
                backgroundColor: `${color}33`,
                fill: false,
                tension: 0.35,
                pointRadius: 2,
                pointHoverRadius: 4,
                spanGaps: true,
                borderWidth: 2,
            };
        });

        const xAxisConfig = {
            ticks: {
                maxRotation: 0,
                minRotation: 0,
                callback: (value) => {
                    const label = labels[value];
                    if (!label) {
                        return "";
                    }

                    const totalPoints = labels.length;
                    const showFrequency = Math.max(1, Math.ceil(totalPoints / 10));
                    if (value === 0 || value === totalPoints - 1 || value % showFrequency === 0) {
                        return label.split(" ")[0];
                    }
                    return "";
                },
            },
        };

        progressChart = new Chart(chartCtx, {
            type: "line",
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: xAxisConfig,
                    y: { beginAtZero: true },
                },
                interaction: { mode: "nearest", intersect: false },
                plugins: {
                    legend: {
                        display: true,
                        position: "top",
                    },
                    tooltip: {
                        mode: "index",
                        intersect: false,
                    },
                },
            },
        });
    }

    async function loadData() {
        const metric = getSelectedMetric();
        const dateRange = getSelectedDateRange();
        const school = getSelectedSchool();
        setMessage("Loading…");

        const params = new URLSearchParams({ metric, date_range: dateRange });
        if (school) {
            params.set("school", school);
        }

        try {
            const response = await fetch(`/api/dashboard/multischool-progress-data/?${params.toString()}`, {
                credentials: "include",
            });
            if (!response.ok) {
                throw new Error(`Request failed (${response.status})`);
            }
            const data = await response.json();

            if (!data.series || data.series.length === 0) {
                if (progressChart) {
                    progressChart.destroy();
                    progressChart = null;
                }
                setMessage("No data available for this metric and date range.", false);
                return;
            }

            setMessage("");
            buildChart(data.dates, data.series);
        } catch {
            setMessage("Unable to load trend data. Please try again.", true);
        }
    }

    metricButtons.forEach((button) => {
        button.addEventListener("click", () => {
            metricButtons.forEach((other) => other.classList.remove("active"));
            button.classList.add("active");
            loadData();
        });
    });

    if (dateRangeSelect) {
        dateRangeSelect.addEventListener("change", loadData);
    }

    if (schoolSelect) {
        schoolSelect.addEventListener("change", loadData);
    }

    const printButton = document.getElementById("print-dashboard");
    if (printButton) {
        printButton.addEventListener("click", () => window.print());
    }

    loadData();
});
