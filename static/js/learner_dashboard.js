document.addEventListener("DOMContentLoaded", () => {
    const learnerSelect = document.getElementById("learner-select");
    const exerciseSelect = document.getElementById("exercise-select");
    const metricSelect = document.getElementById("metric-select");
    const dateStartInput = document.getElementById("date-start");
    const dateEndInput = document.getElementById("date-end");
    const applyButton = document.getElementById("apply-filters");
    const messageEl = document.getElementById("dashboard-message");
    const chartTitle = document.getElementById("chart-title");
    const chartSubtitle = document.getElementById("chart-subtitle");

    if (!learnerSelect) {
        return;
    }

    const chartCtx = document.getElementById("progress-chart").getContext("2d");
    let progressChart = null;

    const metricLabels = {
        exp: "Experience Over Time",
        exercises: "Exercises Completed Over Time",
        accuracy: "Accuracy Over Time",
        difficulty: "Difficulty Level Over Time",
    };

    const metricColors = {
        exp: "#4A90E2",
        exercises: "#7B61FF",
        accuracy: "#00B894",
        difficulty: "#F39C12",
    };

    function setDefaultDates() {
        const today = new Date();
        const start = new Date();
        start.setDate(today.getDate() - 30);

        if (!dateEndInput.value) {
            dateEndInput.value = today.toISOString().split("T")[0];
        }
        if (!dateStartInput.value) {
            dateStartInput.value = start.toISOString().split("T")[0];
        }
    }

    function setMessage(text, isError = false) {
        if (!messageEl) {
            return;
        }
        messageEl.textContent = text;
        messageEl.classList.toggle("error", isError);
        messageEl.classList.toggle("success", !isError);
    }

    function buildChart(labels, data, metric) {
        const color = metricColors[metric] || "#4A90E2";

        if (progressChart) {
            progressChart.destroy();
        }

        const yAxisConfig = {
            beginAtZero: metric !== "accuracy",
            ticks: {},
        };

        if (metric === "accuracy") {
            yAxisConfig.min = 0;
            yAxisConfig.max = 100;
        }

        if (metric === "difficulty") {
            yAxisConfig.min = 1;
            yAxisConfig.max = 3;
            yAxisConfig.ticks.callback = (value) => {
                if (value === 1) return "Easy";
                if (value === 2) return "Medium";
                if (value === 3) return "Hard";
                return value;
            };
        }

        progressChart = new Chart(chartCtx, {
            type: "line",
            data: {
                labels,
                datasets: [
                    {
                        label: metricLabels[metric] || "Progress",
                        data,
                        borderColor: color,
                        backgroundColor: `${color}33`,
                        fill: true,
                        tension: 0.35,
                        pointRadius: 2,
                        pointHoverRadius: 4,
                        spanGaps: true,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: yAxisConfig,
                },
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        mode: "index",
                        intersect: false,
                    },
                },
                interaction: {
                    mode: "nearest",
                    intersect: false,
                },
            },
        });
    }

    async function fetchProgressData() {
        const learnerUuid = learnerSelect.value;
        const exerciseId = exerciseSelect.value;
        const metric = metricSelect.value;
        const dateStart = dateStartInput.value;
        const dateEnd = dateEndInput.value;

        if (!learnerUuid) {
            setMessage("Please select a learner.", true);
            return;
        }

        if (!dateStart || !dateEnd) {
            setMessage("Please select a date range.", true);
            return;
        }

        if (dateStart > dateEnd) {
            setMessage("Start date must be before end date.", true);
            return;
        }

        const params = new URLSearchParams({
            learner_uuid: learnerUuid,
            exercise_id: exerciseId,
            metric,
            date_start: dateStart,
            date_end: dateEnd,
        });

        setMessage("Loading data...");

        try {
            const response = await fetch(`/api/dashboard/progress-data/?${params.toString()}`);
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Unable to load data.");
            }
            const data = await response.json();

            chartTitle.textContent = metricLabels[metric] || "Progress";
            chartSubtitle.textContent = `${data.date_start} to ${data.date_end}`;

            buildChart(data.dates, data.values, metric);

            const hasData = data.values.some(value => value !== null);
            if (!hasData) {
                setMessage("No sessions recorded for this range.");
            } else {
                setMessage("");
            }
        } catch (error) {
            setMessage(error.message, true);
        }
    }

    setDefaultDates();
    fetchProgressData();

    if (applyButton) {
        applyButton.addEventListener("click", (event) => {
            event.preventDefault();
            fetchProgressData();
        });
    }

    [learnerSelect, exerciseSelect, metricSelect].forEach((element) => {
        element.addEventListener("change", fetchProgressData);
    });
});
