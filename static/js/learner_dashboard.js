document.addEventListener("DOMContentLoaded", () => {
    const learnerSelect = document.getElementById("learner-select");
    const dateRangeSelect = document.getElementById("date-range");
    const messageEl = document.getElementById("dashboard-message");
    const chartTitle = document.getElementById("chart-title");
    const chartSubtitle = document.getElementById("chart-subtitle");

    // Button-style filters
    const exerciseButtons = document.querySelectorAll('[data-exercise]');
    const metricButtons = document.querySelectorAll('[data-metric]');
    const smartButtons = document.querySelectorAll('[data-smart]');

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

    // Helper functions to get active states
    function getSelectedExercise() {
        const activeBtn = document.querySelector('[data-exercise].active');
        return activeBtn ? activeBtn.dataset.exercise : 'all';
    }

    function getSelectedMetrics() {
        const activeButtons = document.querySelectorAll('[data-metric].active');
        return Array.from(activeButtons).map(btn => btn.dataset.metric);
    }

    function isLayerMetricsEnabled() {
        const layerBtn = document.querySelector('[data-smart="layer-metrics"]');
        return layerBtn ? layerBtn.classList.contains('active') : false;
    }

    function isBestFitEnabled() {
        const bestFitBtn = document.querySelector('[data-smart="plot-best-fit"]');
        return bestFitBtn ? bestFitBtn.classList.contains('active') : false;
    }

    function isSmoothingEnabled() {
        const smoothBtn = document.querySelector('[data-smart="smooth-data"]');
        return smoothBtn ? smoothBtn.classList.contains('active') : false;
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

        const smoothData = isSmoothingEnabled();
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
        const plotBestFit = singleMetric && isBestFitEnabled();

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
        
        // Check if we're viewing difficulty metric for specific exercises
        const selectedMetrics = getSelectedMetrics();
        const isDifficultyMetric = selectedMetrics.length === 1 && selectedMetrics[0] === "difficulty";
        const exerciseId = getSelectedExercise();
        
        // If multiple metrics, use normalized 0-100 scale
        if (metricsData.length > 1) {
            yAxisConfig.min = 0;
            yAxisConfig.max = 100;
            yAxisConfig.ticks.callback = (value) => {
                return value + "%";
            };
        } else if (isDifficultyMetric && exerciseId === "Colourful Semantics") {
            // Custom labels for Colourful Semantics difficulty levels
            yAxisConfig.min = 0;
            yAxisConfig.max = 50;
            let lastLabel = "";
            yAxisConfig.ticks.callback = (value) => {
                let label;
                if (value < 10) label = "Subject";
                else if (value < 20) label = "Verb";
                else if (value < 30) label = "Subject+Verb";
                else if (value < 40) label = "Subject+Verb+Object";
                else label = "Subject+Verb+Object+Location";
                
                if (label === lastLabel) {
                    return "Max";
                }
                lastLabel = label;
                return label;
            };
            yAxisConfig.ticks.stepSize = 10;
        } else if (isDifficultyMetric && exerciseId === "Categorisation") {
            // Custom labels for Categorisation difficulty levels
            yAxisConfig.min = 10;
            yAxisConfig.max = 40;
            let lastLabel = "";
            yAxisConfig.ticks.callback = (value) => {
                let label;
                if (value < 20) label = "2 Categories";
                else if (value < 30) label = "3 Categories";
                else label = "4 Categories";
                
                if (label === lastLabel) {
                    return "Max";
                }
                lastLabel = label;
                return label;
            };
            yAxisConfig.ticks.stepSize = 10;
        } else if (isDifficultyMetric && exerciseId === "Think and Find") {
            // Custom labels for Think and Find difficulty levels
            yAxisConfig.min = 10;
            yAxisConfig.max = 40;
            let lastLabel = "";
            yAxisConfig.ticks.callback = (value) => {
                let label;
                if (value <= 10) label = "2 options";
                else if (value <= 20) label = "3 options";
                else if (value <= 30) label = "4 options";
                else label = "5 options";
                
                if (label === lastLabel) {
                    return "Max";
                }
                lastLabel = label;
                return label;
            };
            yAxisConfig.ticks.stepSize = 10;
        } else if (isDifficultyMetric && exerciseId === "Concept Quest") {
            // Custom labels for Concept Quest difficulty levels
            yAxisConfig.min = 0;
            yAxisConfig.max = 50;
            let lastLabel = "";
            yAxisConfig.ticks.callback = (value) => {
                let label;
                if (value < 10) label = "Big";
                else if (value < 20) label = "Small";
                else if (value < 30) label = "Short";
                else if (value < 40) label = "Long";
                else label = "Tall";
                
                if (label === lastLabel) {
                    return "Max";
                }
                lastLabel = label;
                return label;
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
        const exerciseId = getSelectedExercise();
        const isAllExercises = exerciseId === "all";
        
        const accuracyButton = document.querySelector('[data-metric="accuracy"]');
        const difficultyButton = document.querySelector('[data-metric="difficulty"]');
        const exercisesButton = document.querySelector('[data-metric="exercises"]');
        
        if (isAllExercises) {
            // Only "Sessions Completed" available
            if (accuracyButton) {
                accuracyButton.disabled = true;
                accuracyButton.classList.remove('active');
                accuracyButton.style.opacity = '0.5';
                accuracyButton.style.cursor = 'not-allowed';
            }
            if (difficultyButton) {
                difficultyButton.disabled = true;
                difficultyButton.classList.remove('active');
                difficultyButton.style.opacity = '0.5';
                difficultyButton.style.cursor = 'not-allowed';
            }
            if (exercisesButton && !exercisesButton.classList.contains('active')) {
                exercisesButton.classList.add('active');
            }
        } else {
            // All metrics available
            if (accuracyButton) {
                accuracyButton.disabled = false;
                accuracyButton.style.opacity = '1';
                accuracyButton.style.cursor = 'pointer';
            }
            if (difficultyButton) {
                difficultyButton.disabled = false;
                difficultyButton.style.opacity = '1';
                difficultyButton.style.cursor = 'pointer';
            }
        }
    }

    function updateBestFitVisibility() {
        const bestFitButton = document.querySelector('[data-smart="plot-best-fit"]');
        if (!bestFitButton) {
            return;
        }
        const selectedMetrics = getSelectedMetrics();
        const layerMetricsEnabled = isLayerMetricsEnabled();
        const shouldShow = selectedMetrics.length === 1 && !layerMetricsEnabled;
        
        bestFitButton.disabled = !shouldShow;
        bestFitButton.style.opacity = shouldShow ? '1' : '0.5';
        bestFitButton.style.cursor = shouldShow ? 'pointer' : 'not-allowed';
        
        if (!shouldShow && bestFitButton.classList.contains('active')) {
            bestFitButton.classList.remove('active');
        }
    }

    async function fetchProgressData() {
        const learnerUuid = learnerSelect.value;
        const exerciseId = getSelectedExercise();
        const selectedMetrics = getSelectedMetrics();
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

    // Initialize
    updateMetricAvailability();
    updateBestFitVisibility();
    fetchProgressData();

    // Learner selection should reload page to update exercise counts
    learnerSelect.addEventListener("change", () => {
        const selectedUuid = learnerSelect.value;
        if (selectedUuid) {
            window.location.href = `?learner=${selectedUuid}`;
        }
    });

    // Date range filter
    if (dateRangeSelect) {
        dateRangeSelect.addEventListener("change", fetchProgressData);
    }

    // Exercise filter buttons
    exerciseButtons.forEach(button => {
        button.addEventListener("click", () => {
            exerciseButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            updateMetricAvailability();
            fetchProgressData();
        });
    });

    // Metric filter buttons (multi-select unless Layer Metrics is disabled)
    metricButtons.forEach(button => {
        button.addEventListener("click", () => {
            if (button.disabled) return;
            
            const layerMetricsEnabled = isLayerMetricsEnabled();
            
            if (!layerMetricsEnabled) {
                // Single selection mode - only one metric at a time
                metricButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            } else {
                // Multi-selection mode - toggle this button
                button.classList.toggle('active');
                
                // Ensure at least one metric is selected
                const activeMetrics = document.querySelectorAll('[data-metric].active');
                if (activeMetrics.length === 0) {
                    button.classList.add('active');
                }
            }
            
            updateBestFitVisibility();
            fetchProgressData();
        });
    });

    // Smart data view buttons (toggles)
    smartButtons.forEach(button => {
        button.addEventListener("click", () => {
            if (button.disabled) return;
            
            button.classList.toggle('active');
            
            // If layer metrics was toggled, update best fit visibility
            if (button.dataset.smart === 'layer-metrics') {
                updateBestFitVisibility();
            }
            
            fetchProgressData();
        });
    });
});
