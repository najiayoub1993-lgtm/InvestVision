const BacktestComponent = {
    chart: null,
    startYear: 2005,
    compareStrategies: [],
    showInflationAdjusted: true,

    render() {
        const container = document.getElementById('backtest-content');
        if (!container) return;

        const allocations = getCurrentAllocations();
        const results = BacktestEngine.run(allocations, this.startYear, AppState.investmentAmount, AppState.monthlyDCA);
        const summary = BacktestEngine.getSummary(results);

        container.innerHTML = `
            <div class="backtest-controls">
                <div class="control-group">
                    <label>Start Year</label>
                    <select id="bt-start-year">
                        ${YEARS.map(y => `<option value="${y}" ${y === this.startYear ? 'selected' : ''}>${y}</option>`).join('')}
                    </select>
                </div>
                <div class="control-group">
                    <label>Compare With</label>
                    <div class="compare-checkboxes">
                        ${STRATEGIES.filter(s => s.id !== 'custom' && s.id !== AppState.selectedStrategy).map(s => `
                            <label class="checkbox-label">
                                <input type="checkbox" value="${s.id}" ${this.compareStrategies.includes(s.id) ? 'checked' : ''} class="compare-cb">
                                ${s.icon} ${s.name}
                            </label>
                        `).join('')}
                    </div>
                </div>
                <div class="control-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="bt-inflation" ${this.showInflationAdjusted ? 'checked' : ''}>
                        Show inflation-adjusted
                    </label>
                </div>
            </div>

            ${summary ? `
                <div class="backtest-summary-grid">
                    <div class="stat-card highlight">
                        <span class="stat-label">Final Value</span>
                        <span class="stat-value positive">${formatCurrency(summary.finalNominal)}</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Real Value (Inflation-Adj)</span>
                        <span class="stat-value">${formatCurrency(summary.finalReal)}</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Total Contributed</span>
                        <span class="stat-value">${formatCurrency(summary.totalContributed)}</span>
                    </div>
                    <div class="stat-card ${summary.gain >= 0 ? '' : 'danger'}">
                        <span class="stat-label">Total Gain/Loss</span>
                        <span class="stat-value ${summary.gain >= 0 ? 'positive' : 'negative'}">${formatCurrency(summary.gain)}</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">CAGR</span>
                        <span class="stat-value positive">${summary.cagr}%</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Best Year</span>
                        <span class="stat-value positive">${summary.bestYear.year} (${summary.bestYear.return}%)</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Worst Year</span>
                        <span class="stat-value negative">${summary.worstYear.year} (${summary.worstYear.return}%)</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Max Drawdown</span>
                        <span class="stat-value negative">-${summary.maxDrawdown}%</span>
                    </div>
                </div>
            ` : ''}

            <div class="chart-container large-chart">
                <canvas id="backtest-chart"></canvas>
            </div>

            <div class="backtest-table-section">
                <h3>Year-by-Year Breakdown</h3>
                <div class="table-scroll">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Year</th>
                                <th>Return</th>
                                <th>Nominal Balance</th>
                                <th>Real Balance</th>
                                <th>Contributed</th>
                                <th>Drawdown</th>
                                <th>Inflation</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${results.map(r => {
                                const isCrisis = getCrisisYears().has(r.year);
                                return `
                                    <tr class="${isCrisis ? 'crisis-row' : ''}">
                                        <td>${r.year} ${isCrisis ? '⚠️' : ''}</td>
                                        <td class="${parseFloat(r.returnPct) >= 0 ? 'positive' : 'negative'}">${r.returnPct}%</td>
                                        <td>${formatCurrency(r.nominalBalance)}</td>
                                        <td>${formatCurrency(r.realBalance)}</td>
                                        <td>${formatCurrency(r.totalContributed)}</td>
                                        <td class="${parseFloat(r.drawdown) > 0 ? 'negative' : ''}">${r.drawdown}%</td>
                                        <td>${r.inflation}%</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        this.bindEvents();
        this.renderChart(results);
    },

    bindEvents() {
        document.getElementById('bt-start-year')?.addEventListener('change', (e) => {
            this.startYear = parseInt(e.target.value);
            this.render();
        });
        document.querySelectorAll('.compare-cb').forEach(cb => {
            cb.addEventListener('change', () => {
                this.compareStrategies = [...document.querySelectorAll('.compare-cb:checked')].map(c => c.value);
                this.render();
            });
        });
        document.getElementById('bt-inflation')?.addEventListener('change', (e) => {
            this.showInflationAdjusted = e.target.checked;
            this.render();
        });
    },

    renderChart(primaryResults) {
        const canvas = document.getElementById('backtest-chart');
        if (!canvas) return;
        this.chart = destroyChart(this.chart);

        const labels = primaryResults.map(r => r.year);
        const strategy = getStrategy(AppState.selectedStrategy);

        const datasets = [{
            label: strategy?.name || 'Selected Strategy',
            data: primaryResults.map(r => r.nominalBalance),
            borderColor: COLORS.primary,
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 3
        }];

        if (this.showInflationAdjusted) {
            datasets.push({
                label: (strategy?.name || 'Selected') + ' (Real)',
                data: primaryResults.map(r => r.realBalance),
                borderColor: COLORS.warning,
                borderDash: [5, 5],
                fill: false,
                tension: 0.3,
                pointRadius: 2
            });
        }

        datasets.push({
            label: 'Total Contributed',
            data: primaryResults.map(r => r.totalContributed),
            borderColor: COLORS.textMuted,
            borderDash: [10, 5],
            fill: false,
            tension: 0,
            pointRadius: 0
        });

        this.compareStrategies.forEach((sid, i) => {
            const s = getStrategy(sid);
            if (s) {
                const compResults = BacktestEngine.run(s.allocations, this.startYear, AppState.investmentAmount, AppState.monthlyDCA);
                datasets.push({
                    label: s.name,
                    data: compResults.map(r => r.nominalBalance),
                    borderColor: COLORS.palette[(i + 2) % COLORS.palette.length],
                    fill: false,
                    tension: 0.3,
                    pointRadius: 2
                });
            }
        });

        this.chart = new Chart(canvas, {
            type: 'line',
            data: { labels, datasets },
            options: {
                ...CHART_DEFAULTS,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    ...CHART_DEFAULTS.scales,
                    y: {
                        ...CHART_DEFAULTS.scales.y,
                        ticks: {
                            ...CHART_DEFAULTS.scales.y.ticks,
                            callback: (v) => formatCurrency(v)
                        }
                    }
                },
                plugins: {
                    ...CHART_DEFAULTS.plugins,
                    tooltip: {
                        ...CHART_DEFAULTS.plugins.tooltip,
                        callbacks: {
                            label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`
                        }
                    }
                }
            }
        });
    }
};
