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
        accuracy: "Accuracy (%)",
        difficulty: "Difficulty Level",
        time_elapsed: "Time Elapsed (mins)",
    };

    const metricColors = {
        accuracy: "#00B894",
        difficulty: "#F39C12",
        time_elapsed: "#2D8CFF",
    };

    // Helper functions to get active states
    function getSelectedExercise() {
        const activeBtn = document.querySelector('[data-exercise].active');
        if (activeBtn) {
            return activeBtn.dataset.exercise;
        }

        const firstExerciseBtn = document.querySelector('[data-exercise]');
        return firstExerciseBtn ? firstExerciseBtn.dataset.exercise : "";
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

    function buildDifficultyLabelsByValue(metricData) {
        const values = metricData?.values || [];
        const labels = metricData?.labels || [];
        const byValue = new Map();

        values.forEach((value, index) => {
            if (value === null || value === undefined) {
                return;
            }

            const label = labels[index];
            if (!label) {
                return;
            }

            byValue.set(Number(value).toFixed(2), label);
        });

        return byValue;
    }

    function getValidNumericValues(values) {
        return (values || []).filter(
            (value) => value !== null && value !== undefined && !Number.isNaN(Number(value)),
        );
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
                difficultyLabels: metricData.labels || [],
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
        
        // Check if we're viewing the difficulty metric
        const selectedMetrics = getSelectedMetrics();
        const isDifficultyMetric = selectedMetrics.length === 1 && selectedMetrics[0] === "difficulty";
        
        // If multiple metrics, use normalized 0-100 scale
        if (metricsData.length > 1) {
            yAxisConfig.min = 0;
            yAxisConfig.max = 100;
            yAxisConfig.ticks.callback = (value) => {
                return value + "%";
            };
        } else if (isDifficultyMetric) {
            const difficultyMetricData = metricsData.find(
                (metricData) => metricData.metric === "difficulty",
            );
            const difficultyLabelsByValue = buildDifficultyLabelsByValue(
                difficultyMetricData,
            );
            const difficultyValues = getValidNumericValues(
                difficultyMetricData?.values,
            ).map((value) => Number(value));

            if (difficultyValues.length > 0) {
                const minDifficulty = Math.floor(Math.min(...difficultyValues));
                const maxDifficulty = Math.ceil(Math.max(...difficultyValues));
                yAxisConfig.min = minDifficulty;
                yAxisConfig.max = minDifficulty === maxDifficulty
                    ? minDifficulty + 1
                    : maxDifficulty;
            }

            yAxisConfig.ticks.stepSize = 1;

            yAxisConfig.ticks.callback = (value) => {
                const numericValue = Number(value);
                if (Number.isNaN(numericValue)) {
                    return "";
                }

                const mappedLabel = difficultyLabelsByValue.get(
                    numericValue.toFixed(2),
                );
                if (mappedLabel) {
                    return mappedLabel;
                }

                return "";
            };
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
                        callbacks: {
                            label: (context) => {
                                const dataset = context.dataset;
                                const value = context.parsed.y;
                                const baseLabel = `${dataset.label}: ${value}`;

                                if (dataset.label !== metricLabels.difficulty) {
                                    return baseLabel;
                                }

                                const difficultyLabels = dataset.difficultyLabels || [];
                                const pointLabel = difficultyLabels[context.dataIndex];
                                if (!pointLabel) {
                                    return baseLabel;
                                }

                                return `${baseLabel} (${pointLabel})`;
                            },
                        },
                    },
                },
                interaction: {
                    mode: "nearest",
                    intersect: false,
                },
            },
        });
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
            
            let titleText = metricsText;
            const activeExerciseBtn = document.querySelector('[data-exercise].active');
            if (activeExerciseBtn) {
                const exerciseName = activeExerciseBtn.textContent.split('(')[0].trim();
                titleText = `${metricsText} for ${exerciseName}`;
            }
            
            chartTitle.textContent = titleText;
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
    updateBestFitVisibility();
    fetchProgressData();

    // Cohort selection should reload page to filter learners
    const cohortSelect = document.getElementById("cohort-select");
    if (cohortSelect) {
        cohortSelect.addEventListener("change", () => {
            const selectedCohortId = cohortSelect.value;
            const currentUrl = new URL(window.location.href);
            
            if (selectedCohortId) {
                currentUrl.searchParams.set('cohort', selectedCohortId);
            } else {
                currentUrl.searchParams.delete('cohort');
            }
            
            // Remove learner parameter when changing cohort
            currentUrl.searchParams.delete('learner');
            window.location.href = currentUrl.toString();
        });
    }

    // Learner selection should reload page to update exercise counts
    learnerSelect.addEventListener("change", () => {
        const selectedUuid = learnerSelect.value;
        const currentUrl = new URL(window.location.href);
        
        if (selectedUuid) {
            currentUrl.searchParams.set('learner', selectedUuid);
        }
        
        // Preserve cohort filter when changing learner
        const cohortSelect = document.getElementById("cohort-select");
        if (cohortSelect && cohortSelect.value) {
            currentUrl.searchParams.set('cohort', cohortSelect.value);
        }
        
        window.location.href = currentUrl.toString();
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
