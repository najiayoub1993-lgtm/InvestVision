const PortfolioComponent = {
    chart: null,

    render() {
        const container = document.getElementById('portfolio-content');
        if (!container) return;

        container.innerHTML = `
            <div class="strategies-grid">
                ${STRATEGIES.map(s => `
                    <div class="strategy-card ${AppState.selectedStrategy === s.id ? 'active' : ''}" data-strategy="${s.id}">
                        <div class="strategy-header">
                            <span class="strategy-icon">${s.icon}</span>
                            <h3>${s.name}</h3>
                            <span class="risk-badge risk-${s.risk.toLowerCase().replace(/[^a-z]/g, '')}">${s.risk}</span>
                        </div>
                        <p class="strategy-desc">${s.description}</p>
                        ${s.id !== 'custom' ? `
                            <div class="allocation-bars">
                                ${Object.entries(s.allocations).map(([asset, weight]) => `
                                    <div class="alloc-bar">
                                        <span class="alloc-label">${HISTORICAL_RETURNS[asset]?.name || asset}</span>
                                        <div class="alloc-track">
                                            <div class="alloc-fill" style="width: ${weight * 100}%; background: ${COLORS.assetColors[asset] || COLORS.primary}"></div>
                                        </div>
                                        <span class="alloc-pct">${(weight * 100).toFixed(1)}%</span>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>

            <div id="custom-sliders" class="custom-sliders" style="display: ${AppState.selectedStrategy === 'custom' ? 'block' : 'none'}">
                <h3>Custom Allocation</h3>
                <p class="slider-hint">Adjust sliders to set your allocation. Total must equal 100%.</p>
                <div class="total-indicator" id="total-indicator">Total: 100%</div>
                ${ASSET_CLASSES.map(asset => `
                    <div class="slider-row">
                        <label>${HISTORICAL_RETURNS[asset].name}</label>
                        <input type="range" min="0" max="100" step="1" value="${(AppState.customAllocations[asset] || 0) * 100}"
                            class="custom-slider" data-asset="${asset}"
                            style="accent-color: ${COLORS.assetColors[asset]}">
                        <span class="slider-value" id="slider-val-${asset}">${((AppState.customAllocations[asset] || 0) * 100).toFixed(0)}%</span>
                    </div>
                `).join('')}
            </div>

            <div class="portfolio-summary">
                <div class="chart-container pie-container">
                    <canvas id="allocation-pie"></canvas>
                </div>
                <div class="summary-stats" id="portfolio-summary-stats"></div>
            </div>
        `;

        this.bindEvents();
        this.renderPieChart();
        this.renderSummary();
    },

    bindEvents() {
        document.querySelectorAll('.strategy-card').forEach(card => {
            card.addEventListener('click', () => {
                AppState.selectedStrategy = card.dataset.strategy;
                this.render();
            });
        });

        document.querySelectorAll('.custom-slider').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const asset = e.target.dataset.asset;
                AppState.customAllocations[asset] = parseInt(e.target.value) / 100;
                document.getElementById(`slider-val-${asset}`).textContent = e.target.value + '%';
                const total = Object.values(AppState.customAllocations).reduce((s, v) => s + v, 0);
                const indicator = document.getElementById('total-indicator');
                indicator.textContent = `Total: ${(total * 100).toFixed(0)}%`;
                indicator.className = 'total-indicator' + (Math.abs(total - 1) < 0.01 ? ' valid' : ' invalid');
                this.renderPieChart();
                this.renderSummary();
            });
        });
    },

    renderPieChart() {
        const canvas = document.getElementById('allocation-pie');
        if (!canvas) return;

        this.chart = destroyChart(this.chart);
        const allocations = getCurrentAllocations();
        const labels = [];
        const data = [];
        const colors = [];

        for (const [asset, weight] of Object.entries(allocations)) {
            if (weight > 0) {
                labels.push(HISTORICAL_RETURNS[asset]?.name || asset);
                data.push((weight * 100).toFixed(1));
                colors.push(COLORS.assetColors[asset] || COLORS.primary);
            }
        }

        this.chart = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: colors,
                    borderColor: COLORS.cardBg,
                    borderWidth: 3,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: COLORS.text,
                            padding: 15,
                            font: { size: 12, family: "'Inter', sans-serif" },
                            usePointStyle: true,
                            pointStyleWidth: 10
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => ` ${ctx.label}: ${ctx.parsed}%`
                        }
                    }
                }
            }
        });
    },

    renderSummary() {
        const container = document.getElementById('portfolio-summary-stats');
        if (!container) return;

        const allocations = getCurrentAllocations();
        const risk = RiskEngine.calculateAll(allocations);
        const strategy = getStrategy(AppState.selectedStrategy);

        container.innerHTML = `
            <div class="stat-card">
                <span class="stat-label">Strategy</span>
                <span class="stat-value">${strategy?.name || 'Custom'}</span>
            </div>
            <div class="stat-card">
                <span class="stat-label">Avg. Annual Return</span>
                <span class="stat-value positive">${risk.avgReturn}%</span>
            </div>
            <div class="stat-card">
                <span class="stat-label">Volatility</span>
                <span class="stat-value">${risk.volatility}%</span>
            </div>
            <div class="stat-card">
                <span class="stat-label">Risk Level</span>
                <span class="stat-value risk-${risk.riskLabel.toLowerCase().replace(' ', '')}">${risk.riskLabel}</span>
            </div>
            <div class="stat-card">
                <span class="stat-label">Sharpe Ratio</span>
                <span class="stat-value">${risk.sharpe}</span>
            </div>
            <div class="stat-card">
                <span class="stat-label">Max Drawdown</span>
                <span class="stat-value negative">-${risk.maxDrawdown}%</span>
            </div>
            <div class="stat-card highlight">
                <span class="stat-label">Projected ${AppState.timeHorizon}yr Value</span>
                <span class="stat-value positive">${formatCurrency(
                    AppState.investmentAmount * Math.pow(1 + parseFloat(risk.avgReturn) / 100, AppState.timeHorizon) +
                    AppState.monthlyDCA * 12 * ((Math.pow(1 + parseFloat(risk.avgReturn) / 100, AppState.timeHorizon) - 1) / (parseFloat(risk.avgReturn) / 100))
                )}</span>
            </div>
            ${strategy?.philosophy ? `
                <div class="stat-card philosophy">
                    <span class="stat-label">Philosophy</span>
                    <span class="stat-value small">${strategy.philosophy}</span>
                </div>
            ` : ''}
        `;
    }
};
