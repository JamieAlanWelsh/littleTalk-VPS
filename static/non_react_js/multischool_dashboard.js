/* global Chart */
document.addEventListener("DOMContentLoaded", () => {
    const dateRangeSelect = document.getElementById("mat-date-range");
    const metricButtons = document.querySelectorAll("[data-mat-metric]");
    const messageEl = document.getElementById("mat-dashboard-message");
    const canvas = document.getElementById("mat-progress-chart");

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

    const metricLabels = {
        sessions: "Sessions Completed",
        accuracy: "Accuracy (%)",
        difficulty: "Difficulty Level",
    };

    function setMessage(text, isError = false) {
        if (!messageEl) {
            return;
        }
        messageEl.textContent = text || "";
        messageEl.classList.toggle("error", Boolean(text) && isError);
        messageEl.classList.toggle("success", Boolean(text) && !isError);
    }

    function getSelectedMetric() {
        const active = document.querySelector("[data-mat-metric].active");
        return active ? active.dataset.matMetric : "sessions";
    }

    function getSelectedDateRange() {
        return dateRangeSelect ? dateRangeSelect.value : "all";
    }

    function buildChart(labels, series, metric) {
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
            };
        });

        progressChart = new Chart(chartCtx, {
            type: "line",
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: "index", intersect: false },
                plugins: {
                    legend: { position: "bottom" },
                    title: {
                        display: true,
                        text: metricLabels[metric] || "Progress",
                    },
                },
                scales: {
                    y: { beginAtZero: metric === "sessions" },
                },
            },
        });
    }

    async function loadData() {
        const metric = getSelectedMetric();
        const dateRange = getSelectedDateRange();
        setMessage("Loading…");

        const params = new URLSearchParams({ metric, date_range: dateRange });

        try {
            const response = await fetch(`/api/dashboard/mat-progress-data/?${params.toString()}`, {
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
            buildChart(data.dates, data.series, data.metric);
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

    const printButton = document.getElementById("print-dashboard");
    if (printButton) {
        printButton.addEventListener("click", () => window.print());
    }

    loadData();
});
