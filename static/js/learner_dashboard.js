document.addEventListener("DOMContentLoaded", () => {
    const learnerSelect = document.getElementById("learner-select");
    const exerciseSelect = document.getElementById("exercise-select");
    const metricCheckboxes = document.querySelectorAll('input[name="metric"]');
    const dateRangeSelect = document.getElementById("date-range");
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
        exercises: "Sessions Completed",
        accuracy: "Accuracy (%)",
        difficulty: "Difficulty Level",
        time_elapsed: "Time to Complete (mins)",
    };

    const metricColors = {
        exercises: "#7B61FF",
        accuracy: "#00B894",
        difficulty: "#F39C12",
        time_elapsed: "#E67E22",
    };

    function setDefaultDates() {
        if (dateRangeSelect && !dateRangeSelect.value) {
            dateRangeSelect.value = "all";
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

    function buildChart(timestamps, metricsData) {
        if (progressChart) {
            progressChart.destroy();
        }

        // Parse ISO timestamp strings into Date objects
        const dateObjects = timestamps.map(ts => new Date(ts));

        // If multiple metrics, normalize them to 0-100 for visual comparison
        let normalizedMetricsData = metricsData;
        if (metricsData.length > 1) {
            normalizedMetricsData = metricsData.map((metricData) => {
                const values = metricData.values;
                const validValues = values.filter(v => v !== null);
                
                if (validValues.length === 0) {
                    return metricData;
                }
                
                const min = Math.min(...validValues);
                const max = Math.max(...validValues);
                const range = max - min || 1; // Avoid division by zero
                
                const normalizedValues = values.map(v => {
                    if (v === null) return null;
                    return ((v - min) / range) * 100;
                });
                
                return {
                    ...metricData,
                    values: normalizedValues,
                    originalValues: values,
                    min,
                    max,
                };
            });
        }

        // Build datasets for each selected metric with {x, y} format for time scale
        const datasets = [];
        normalizedMetricsData.forEach((metricData) => {
            const metric = metricData.metric;
            const values = metricData.values;
            const color = metricColors[metric] || "#4A90E2";

            // Convert to {x: Date, y: value} format
            const data = dateObjects.map((date, i) => ({
                x: date,
                y: values[i]
            }));

            datasets.push({
                label: metricLabels[metric] || "Progress",
                data,
                borderColor: color,
                backgroundColor: `${color}33`,
                fill: false,
                tension: 0.35,
                pointRadius: 2,
                pointHoverRadius: 4,
                spanGaps: true,
                borderWidth: 2,
            });
        });

        const yAxisConfig = {
            beginAtZero: true,
            ticks: {},
        };
        
        // If multiple metrics, use normalized 0-100 scale
        if (metricsData.length > 1) {
            yAxisConfig.min = 0;
            yAxisConfig.max = 100;
            yAxisConfig.ticks.callback = (value) => {
                return value + "%";
            };
        }

        progressChart = new Chart(chartCtx, {
            type: "line",
            data: {
                datasets,
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            displayFormats: {
                                hour: 'MMM d, HH:mm',
                                day: 'MMM d',
                                week: 'MMM d',
                                month: 'MMM yyyy'
                            },
                            tooltipFormat: 'PPp'
                        },
                        title: {
                            display: false
                        }
                    },
                    y: yAxisConfig,
                },
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
        const selectedMetrics = Array.from(metricCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        const dateRange = dateRangeSelect ? dateRangeSelect.value : "all";

        if (!learnerUuid) {
            setMessage("Please select a learner.", true);
            return;
        }

        if (selectedMetrics.length === 0) {
            setMessage("Please select at least one metric.", true);
            return;
        }

        const params = new URLSearchParams({
            learner_uuid: learnerUuid,
            exercise_id: exerciseId,
            metrics: selectedMetrics.join(","),
            date_range: dateRange,
        });

        setMessage("Loading data...");

        try {
            const response = await fetch(`/api/dashboard/progress-data/?${params.toString()}`);
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Unable to load data.");
            }
            const data = await response.json();

            const metricsText = selectedMetrics.map(m => metricLabels[m]).join(" vs ");
            chartTitle.textContent = metricsText;
            chartSubtitle.textContent = `${data.date_start} to ${data.date_end} (${data.session_count} sessions)`;

            buildChart(data.timestamps, data.metrics_data);

            const hasAnyData = data.metrics_data.some(md => md.values.some(v => v !== null));
            if (!hasAnyData) {
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

    [learnerSelect, exerciseSelect, dateRangeSelect].forEach((element) => {
        element.addEventListener("change", fetchProgressData);
    });

    metricCheckboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", fetchProgressData);
    });
});
