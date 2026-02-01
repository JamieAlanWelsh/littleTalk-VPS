document.addEventListener("DOMContentLoaded", () => {
    const learnerSelect = document.getElementById("learner-select");
    const exerciseSelect = document.getElementById("exercise-select");
    const metricCheckboxes = document.querySelectorAll('input[name="metric"]');
    const dateRangeSelect = document.getElementById("date-range");
    const applyButton = document.getElementById("apply-filters");
    const messageEl = document.getElementById("dashboard-message");
    const chartTitle = document.getElementById("chart-title");
    const chartSubtitle = document.getElementById("chart-subtitle");
    const bestFitCheckbox = document.getElementById("plot-best-fit");
    const smoothingCheckbox = document.getElementById("smooth-data");

    if (!learnerSelect) {
        return;
    }

    const chartCtx = document.getElementById("progress-chart").getContext("2d");
    let progressChart = null;

    const metricLabels = {
        exercises: "Sessions Completed",
        accuracy: "Accuracy (%)",
        difficulty: "Difficulty Level",
    };

    const metricColors = {
        exercises: "#7B61FF",
        accuracy: "#00B894",
        difficulty: "#F39C12",
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

    function getBestFitValues(values) {
        const points = [];
        values.forEach((v, i) => {
            if (v !== null && v !== undefined) {
                points.push({ x: i, y: v });
            }
        });

        if (points.length < 2) {
            return null;
        }

        const n = points.length;
        let sumX = 0;
        let sumY = 0;
        let sumXY = 0;
        let sumXX = 0;

        points.forEach((p) => {
            sumX += p.x;
            sumY += p.y;
            sumXY += p.x * p.y;
            sumXX += p.x * p.x;
        });

        const denominator = (n * sumXX) - (sumX * sumX);
        if (denominator === 0) {
            return null;
        }

        const slope = ((n * sumXY) - (sumX * sumY)) / denominator;
        const intercept = (sumY - (slope * sumX)) / n;

        return values.map((_, i) => Math.round((slope * i + intercept) * 100) / 100);
    }

    function smoothValues(values, windowSize = 3) {
        if (!Array.isArray(values) || values.length === 0) {
            return values;
        }

        const radius = Math.floor(windowSize / 2);
        return values.map((_, index) => {
            let sum = 0;
            let count = 0;

            for (let i = index - radius; i <= index + radius; i += 1) {
                const value = values[i];
                if (value !== null && value !== undefined) {
                    sum += value;
                    count += 1;
                }
            }

            if (count === 0) {
                return null;
            }

            return Math.round((sum / count) * 100) / 100;
        });
    }

    function buildChart(labels, metricsData) {
        if (progressChart) {
            progressChart.destroy();
        }

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

        const smoothData = smoothingCheckbox && smoothingCheckbox.checked;
        const dataForDisplay = smoothData
            ? normalizedMetricsData.map((metricData) => ({
                ...metricData,
                values: smoothValues(metricData.values, 3),
            }))
            : normalizedMetricsData;

        // Build datasets for each selected metric
        const datasets = [];
        dataForDisplay.forEach((metricData) => {
            const metric = metricData.metric;
            const data = metricData.values;
            const color = metricColors[metric] || "#4A90E2";

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

        const singleMetric = metricsData.length === 1;
        const plotBestFit = singleMetric && bestFitCheckbox && bestFitCheckbox.checked;

        if (plotBestFit) {
            const bestFitValues = getBestFitValues(dataForDisplay[0].values);
            if (bestFitValues) {
                datasets.push({
                    label: "Best fit (linear)",
                    data: bestFitValues,
                    borderColor: "#E74C3C",
                    backgroundColor: "#E74C3C00",
                    fill: false,
                    tension: 0,
                    pointRadius: 0,
                    borderDash: [8, 6],
                    borderWidth: 3,
                    order: 100,
                });
            }
        }

        const yAxisConfig = {
            beginAtZero: true,
            ticks: {},
        };
        
        // Check if we're viewing difficulty metric for Colourful Semantics
        const selectedMetrics = Array.from(metricCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        const isColourfulSemanticsWithDifficulty = 
            selectedMetrics.length === 1 && 
            selectedMetrics[0] === "difficulty" && 
            exerciseSelect.value === "Colourful Semantics";
        
        // If multiple metrics, use normalized 0-100 scale
        if (metricsData.length > 1) {
            yAxisConfig.min = 0;
            yAxisConfig.max = 100;
            yAxisConfig.ticks.callback = (value) => {
                return value + "%";
            };
        } else if (isColourfulSemanticsWithDifficulty) {
            // Custom labels for Colourful Semantics difficulty levels
            yAxisConfig.min = 0;
            yAxisConfig.max = 50;
            yAxisConfig.ticks.callback = (value) => {
                if (value < 10) return "Subject";
                if (value < 20) return "Verb";
                if (value < 30) return "Subject+Verb";
                if (value < 40) return "Subject+Verb+Object";
                return "Subject+Verb+Object+Location";
            };
            yAxisConfig.ticks.stepSize = 10;
        }

        const xAxisConfig = {
            ticks: {
                maxRotation: 0,
                minRotation: 0,
                callback: (value, index) => {
                    const label = labels[value];
                    if (!label) return "";
                    
                    // Show tick every 5th point or if it's the first/last
                    const totalPoints = labels.length;
                    const showFrequency = Math.max(1, Math.ceil(totalPoints / 10));
                    
                    if (value === 0 || value === totalPoints - 1 || value % showFrequency === 0) {
                        // Extract just the date part (YYYY-MM-DD) from "YYYY-MM-DD HH:MM"
                        return label.split(" ")[0];
                    }
                    return "";
                },
            },
        };

        progressChart = new Chart(chartCtx, {
            type: "line",
            data: {
                labels,
                datasets,
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: xAxisConfig,
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

    function updateMetricAvailability() {
        const exerciseId = exerciseSelect.value;
        const isAllExercises = exerciseId === "all";
        
        const accuracyCheckbox = document.getElementById("metric-accuracy");
        const difficultyCheckbox = document.getElementById("metric-difficulty");
        const exercisesCheckbox = document.getElementById("metric-exercises");
        
        if (isAllExercises) {
            // Only "Sessions Completed" available
            if (accuracyCheckbox) {
                accuracyCheckbox.disabled = true;
                accuracyCheckbox.checked = false;
                accuracyCheckbox.parentElement.classList.add("is-disabled");
            }
            if (difficultyCheckbox) {
                difficultyCheckbox.disabled = true;
                difficultyCheckbox.checked = false;
                difficultyCheckbox.parentElement.classList.add("is-disabled");
            }
            if (exercisesCheckbox) {
                exercisesCheckbox.checked = true;
            }
        } else {
            // All metrics available
            if (accuracyCheckbox) {
                accuracyCheckbox.disabled = false;
                accuracyCheckbox.parentElement.classList.remove("is-disabled");
            }
            if (difficultyCheckbox) {
                difficultyCheckbox.disabled = false;
                difficultyCheckbox.parentElement.classList.remove("is-disabled");
            }
        }
    }

    function updateBestFitVisibility() {
        if (!bestFitCheckbox) {
            return;
        }
        const selectedMetrics = Array.from(metricCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        const shouldShow = selectedMetrics.length === 1;
        bestFitCheckbox.disabled = !shouldShow;
        if (bestFitCheckbox.parentElement) {
            bestFitCheckbox.parentElement.classList.toggle("is-disabled", !shouldShow);
        }
        if (!shouldShow) {
            bestFitCheckbox.checked = false;
        }
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
            chartSubtitle.textContent = `${data.date_start} to ${data.date_end}`;

            buildChart(data.dates, data.metrics_data);

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
    updateMetricAvailability();
    updateBestFitVisibility();
    fetchProgressData();

    if (applyButton) {
        applyButton.addEventListener("click", (event) => {
            event.preventDefault();
            fetchProgressData();
        });
    }

    [learnerSelect, dateRangeSelect].forEach((element) => {
        element.addEventListener("change", fetchProgressData);
    });

    exerciseSelect.addEventListener("change", () => {
        updateMetricAvailability();
        fetchProgressData();
    });

    metricCheckboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", fetchProgressData);
        checkbox.addEventListener("change", updateBestFitVisibility);
    });

    if (bestFitCheckbox) {
        bestFitCheckbox.addEventListener("change", fetchProgressData);
    }

    if (smoothingCheckbox) {
        smoothingCheckbox.addEventListener("change", fetchProgressData);
    }
});
