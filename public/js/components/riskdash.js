const RiskDashComponent = {
    gaugeChart: null,
    scatterChart: null,

    render() {
        const container = document.getElementById('risk-content');
        if (!container) return;

        const allocations = getCurrentAllocations();
        const risk = RiskEngine.calculateAll(allocations);
        const strategy = getStrategy(AppState.selectedStrategy);

        container.innerHTML = `
            <div class="risk-header">
                <div class="gauge-container">
                    <canvas id="risk-gauge"></canvas>
                    <div class="gauge-label">
                        <span class="gauge-score">${risk.riskLabel}</span>
                        <span class="gauge-sub">Risk Level</span>
                    </div>
                </div>
                <div class="risk-metrics-grid">
                    <div class="metric-card">
                        <div class="metric-icon">📈</div>
                        <div class="metric-info">
                            <span class="metric-value positive">${risk.avgReturn}%</span>
                            <span class="metric-label">Avg Annual Return</span>
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-icon">📊</div>
                        <div class="metric-info">
                            <span class="metric-value">${risk.volatility}%</span>
                            <span class="metric-label">Volatility (Std Dev)</span>
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-icon">⚡</div>
                        <div class="metric-info">
                            <span class="metric-value ${parseFloat(risk.sharpe) > 0.5 ? 'positive' : 'negative'}">${risk.sharpe}</span>
                            <span class="metric-label">Sharpe Ratio</span>
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-icon">🎯</div>
                        <div class="metric-info">
                            <span class="metric-value ${parseFloat(risk.sortino) > 0.5 ? 'positive' : 'negative'}">${risk.sortino}</span>
                            <span class="metric-label">Sortino Ratio</span>
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-icon">📉</div>
                        <div class="metric-info">
                            <span class="metric-value negative">-${risk.maxDrawdown}%</span>
                            <span class="metric-label">Max Drawdown</span>
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-icon">⚠️</div>
                        <div class="metric-info">
                            <span class="metric-value negative">${risk.var95}%</span>
                            <span class="metric-label">Value at Risk (95%)</span>
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-icon">🔴</div>
                        <div class="metric-info">
                            <span class="metric-value negative">${risk.var99}%</span>
                            <span class="metric-label">Value at Risk (99%)</span>
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-icon">β</div>
                        <div class="metric-info">
                            <span class="metric-value">${risk.beta}</span>
                            <span class="metric-label">Beta vs S&P 500</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="risk-comparison">
                <h3>Strategy Comparison</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Strategy</th>
                            <th>Avg Return</th>
                            <th>Volatility</th>
                            <th>Sharpe</th>
                            <th>Max DD</th>
                            <th>VaR 95%</th>
                            <th>Risk</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${STRATEGIES.filter(s => s.id !== 'custom').map(s => {
                            const r = RiskEngine.calculateAll(s.allocations);
                            const isSelected = s.id === AppState.selectedStrategy;
                            return `
                                <tr class="${isSelected ? 'row-highlight' : ''}">
                                    <td>${s.icon} ${s.name}</td>
                                    <td class="positive">${r.avgReturn}%</td>
                                    <td>${r.volatility}%</td>
                                    <td>${r.sharpe}</td>
                                    <td class="negative">-${r.maxDrawdown}%</td>
                                    <td class="negative">${r.var95}%</td>
                                    <td><span class="risk-badge risk-${r.riskLabel.toLowerCase().replace(' ', '')}">${r.riskLabel}</span></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>

            <div class="risk-scatter-section">
                <h3>Risk-Return Map</h3>
                <div class="chart-container">
                    <canvas id="risk-scatter"></canvas>
                </div>
            </div>
        `;

        this.renderGauge(risk);
        this.renderScatter();
    },

    renderGauge(risk) {
        const canvas = document.getElementById('risk-gauge');
        if (!canvas) return;
        this.gaugeChart = destroyChart(this.gaugeChart);

        const score = risk.riskScore;
        const data = [score, 5 - score];

        this.gaugeChart = new Chart(canvas, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data,
                    backgroundColor: [COLORS.riskGauge[score - 1], COLORS.border],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                rotation: -90,
                circumference: 180,
                cutout: '75%',
                plugins: { legend: { display: false }, tooltip: { enabled: false } }
            }
        });
    },

    renderScatter() {
        const canvas = document.getElementById('risk-scatter');
        if (!canvas) return;
        this.scatterChart = destroyChart(this.scatterChart);

        const points = STRATEGIES.filter(s => s.id !== 'custom').map((s, i) => {
            const r = RiskEngine.calculateAll(s.allocations);
            return {
                x: parseFloat(r.volatility),
                y: parseFloat(r.avgReturn),
                label: s.name
            };
        });

        this.scatterChart = new Chart(canvas, {
            type: 'scatter',
            data: {
                datasets: [{
                    data: points,
                    backgroundColor: COLORS.palette.slice(0, points.length),
                    pointRadius: 10,
                    pointHoverRadius: 14
                }]
            },
            options: {
                ...CHART_DEFAULTS,
                plugins: {
                    ...CHART_DEFAULTS.plugins,
                    legend: { display: false },
                    tooltip: {
                        ...CHART_DEFAULTS.plugins.tooltip,
                        callbacks: {
                            label: (ctx) => `${points[ctx.dataIndex].label}: Return ${ctx.parsed.y.toFixed(1)}%, Vol ${ctx.parsed.x.toFixed(1)}%`
                        }
                    }
                },
                scales: {
                    x: { ...CHART_DEFAULTS.scales.x, title: { display: true, text: 'Volatility (%)', color: COLORS.textMuted } },
                    y: { ...CHART_DEFAULTS.scales.y, title: { display: true, text: 'Avg Return (%)', color: COLORS.textMuted } }
                }
            }
        });
    }
};
