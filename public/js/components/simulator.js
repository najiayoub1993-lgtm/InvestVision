const SimulatorComponent = {
    fanChart: null,
    histChart: null,
    results: null,
    overrides: { expectedReturn: null, volatility: null, inflation: 2.5 },

    render() {
        const container = document.getElementById('simulator-content');
        if (!container) return;

        const allocations = getCurrentAllocations();
        this.results = MonteCarloEngine.run(
            allocations, AppState.timeHorizon, AppState.investmentAmount,
            AppState.monthlyDCA, 1000, this.overrides
        );
        const r = this.results;

        container.innerHTML = `
            <div class="sim-controls">
                <div class="control-group">
                    <label>Expected Return Override (%)</label>
                    <input type="number" id="sim-return" step="0.5" placeholder="Auto: ${r.stats.meanReturn}%"
                        value="${this.overrides.expectedReturn ?? ''}">
                </div>
                <div class="control-group">
                    <label>Volatility Override (%)</label>
                    <input type="number" id="sim-vol" step="0.5" placeholder="Auto: ${r.stats.usedVolatility}%"
                        value="${this.overrides.volatility ?? ''}">
                </div>
                <div class="control-group">
                    <label>Inflation Assumption (%)</label>
                    <input type="number" id="sim-inflation" step="0.1" value="${this.overrides.inflation}">
                </div>
                <button class="btn btn-primary" id="sim-run">Run 1,000 Simulations</button>
            </div>

            <div class="sim-stats-grid">
                <div class="stat-card highlight">
                    <span class="stat-label">Median Outcome</span>
                    <span class="stat-value positive">${formatCurrency(r.percentiles.p50)}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">Mean Outcome</span>
                    <span class="stat-value">${formatCurrency(r.stats.mean)}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">Best Case (95th)</span>
                    <span class="stat-value positive">${formatCurrency(r.percentiles.p95)}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">Worst Case (5th)</span>
                    <span class="stat-value ${r.percentiles.p5 < r.stats.totalInvested ? 'negative' : ''}">${formatCurrency(r.percentiles.p5)}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">Total Invested</span>
                    <span class="stat-value">${formatCurrency(r.stats.totalInvested)}</span>
                </div>
                <div class="stat-card ${parseFloat(r.stats.probLoss) > 20 ? 'danger' : ''}">
                    <span class="stat-label">Probability of Loss</span>
                    <span class="stat-value ${parseFloat(r.stats.probLoss) > 10 ? 'negative' : 'positive'}">${r.stats.probLoss}%</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">Probability of 2x</span>
                    <span class="stat-value positive">${r.stats.probDouble}%</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">Probability of 3x</span>
                    <span class="stat-value">${r.stats.probTriple}%</span>
                </div>
            </div>

            <div class="sim-real-values">
                <h3>Inflation-Adjusted Outcomes (Real Purchasing Power)</h3>
                <div class="real-stats">
                    <span>Worst (5th): <strong>${formatCurrency(r.realPercentiles.p5)}</strong></span>
                    <span>Median: <strong class="positive">${formatCurrency(r.realPercentiles.p50)}</strong></span>
                    <span>Best (95th): <strong class="positive">${formatCurrency(r.realPercentiles.p95)}</strong></span>
                </div>
            </div>

            <div class="chart-container large-chart">
                <h3>Projection Fan Chart</h3>
                <canvas id="fan-chart"></canvas>
            </div>

            <div class="chart-container large-chart">
                <h3>Final Value Distribution</h3>
                <canvas id="hist-chart"></canvas>
            </div>
        `;

        this.bindEvents();
        this.renderFanChart();
        this.renderHistogram();
    },

    bindEvents() {
        document.getElementById('sim-run')?.addEventListener('click', () => {
            const retVal = document.getElementById('sim-return').value;
            const volVal = document.getElementById('sim-vol').value;
            const infVal = document.getElementById('sim-inflation').value;
            this.overrides.expectedReturn = retVal ? parseFloat(retVal) : null;
            this.overrides.volatility = volVal ? parseFloat(volVal) : null;
            this.overrides.inflation = parseFloat(infVal) || 2.5;
            this.render();
        });
    },

    renderFanChart() {
        const canvas = document.getElementById('fan-chart');
        if (!canvas) return;
        this.fanChart = destroyChart(this.fanChart);

        const pp = this.results.pathPercentiles;
        const labels = pp.map(p => `Year ${p.year}`);

        this.fanChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: '95th Percentile',
                        data: pp.map(p => p.p95),
                        borderColor: 'rgba(34, 197, 94, 0.5)',
                        backgroundColor: 'rgba(34, 197, 94, 0.05)',
                        fill: '+1',
                        pointRadius: 0,
                        borderWidth: 1
                    },
                    {
                        label: '75th Percentile',
                        data: pp.map(p => p.p75),
                        borderColor: 'rgba(34, 197, 94, 0.4)',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        fill: '+1',
                        pointRadius: 0,
                        borderWidth: 1
                    },
                    {
                        label: 'Median (50th)',
                        data: pp.map(p => p.p50),
                        borderColor: COLORS.primary,
                        backgroundColor: 'rgba(99, 102, 241, 0.15)',
                        fill: false,
                        pointRadius: 0,
                        borderWidth: 3
                    },
                    {
                        label: '25th Percentile',
                        data: pp.map(p => p.p25),
                        borderColor: 'rgba(245, 158, 11, 0.4)',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        fill: '+1',
                        pointRadius: 0,
                        borderWidth: 1
                    },
                    {
                        label: '5th Percentile',
                        data: pp.map(p => p.p5),
                        borderColor: 'rgba(239, 68, 68, 0.5)',
                        backgroundColor: 'rgba(239, 68, 68, 0.05)',
                        fill: false,
                        pointRadius: 0,
                        borderWidth: 1
                    }
                ]
            },
            options: {
                ...CHART_DEFAULTS,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    ...CHART_DEFAULTS.scales,
                    y: {
                        ...CHART_DEFAULTS.scales.y,
                        ticks: { ...CHART_DEFAULTS.scales.y.ticks, callback: v => formatCurrency(v) }
                    }
                },
                plugins: {
                    ...CHART_DEFAULTS.plugins,
                    tooltip: {
                        ...CHART_DEFAULTS.plugins.tooltip,
                        callbacks: { label: ctx => ` ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}` }
                    }
                }
            }
        });
    },

    renderHistogram() {
        const canvas = document.getElementById('hist-chart');
        if (!canvas) return;
        this.histChart = destroyChart(this.histChart);

        const values = this.results.finalValues;
        const min = values[0];
        const max = values[values.length - 1];
        const bucketCount = 30;
        const bucketSize = (max - min) / bucketCount;
        const buckets = new Array(bucketCount).fill(0);
        const labels = [];

        for (let i = 0; i < bucketCount; i++) {
            labels.push(formatCurrency(Math.round(min + i * bucketSize)));
        }

        values.forEach(v => {
            const idx = Math.min(Math.floor((v - min) / bucketSize), bucketCount - 1);
            buckets[idx]++;
        });

        const totalInvested = this.results.stats.totalInvested;
        const lossIdx = Math.floor((totalInvested - min) / bucketSize);
        const colors = buckets.map((_, i) => i <= lossIdx ? 'rgba(239, 68, 68, 0.6)' : 'rgba(99, 102, 241, 0.6)');

        this.histChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Frequency',
                    data: buckets,
                    backgroundColor: colors,
                    borderColor: colors.map(c => c.replace('0.6', '1')),
                    borderWidth: 1
                }]
            },
            options: {
                ...CHART_DEFAULTS,
                plugins: {
                    ...CHART_DEFAULTS.plugins,
                    legend: { display: false }
                },
                scales: {
                    x: { ...CHART_DEFAULTS.scales.x, ticks: { ...CHART_DEFAULTS.scales.x.ticks, maxRotation: 45, maxTicksLimit: 10 } },
                    y: { ...CHART_DEFAULTS.scales.y, title: { display: true, text: 'Number of Simulations', color: COLORS.textMuted } }
                }
            }
        });
    }
};
