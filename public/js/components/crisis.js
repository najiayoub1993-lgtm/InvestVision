const CrisisComponent = {
    selectedCrisis: 'gfc',
    chart: null,

    render() {
        const container = document.getElementById('crisis-content');
        if (!container) return;

        const allocations = getCurrentAllocations();
        const strategy = getStrategy(AppState.selectedStrategy);

        container.innerHTML = `
            <div class="crisis-timeline">
                ${CRISES.map(c => `
                    <div class="crisis-card ${this.selectedCrisis === c.id ? 'active' : ''}" data-crisis="${c.id}"
                         style="border-left-color: ${c.color}">
                        <h4>${c.name}</h4>
                        <span class="crisis-period">${c.period}</span>
                    </div>
                `).join('')}
            </div>

            <div class="crisis-detail" id="crisis-detail"></div>

            <div class="crisis-comparison">
                <h3>All Strategies During Crises</h3>
                <div class="table-scroll">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Strategy</th>
                                ${CRISES.map(c => `<th>${c.name}<br><small>${c.period}</small></th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${STRATEGIES.filter(s => s.id !== 'custom').map(s => `
                                <tr class="${s.id === AppState.selectedStrategy ? 'row-highlight' : ''}">
                                    <td>${s.icon} ${s.name}</td>
                                    ${CRISES.map(c => {
                                        let totalReturn = 0;
                                        for (let y = c.startYear; y <= c.endYear; y++) {
                                            totalReturn += getStrategyReturn(s.allocations, y);
                                        }
                                        return `<td class="${totalReturn >= 0 ? 'positive' : 'negative'}">${totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(1)}%</td>`;
                                    }).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="chart-container large-chart">
                <h3>Portfolio During Selected Crisis</h3>
                <canvas id="crisis-chart"></canvas>
            </div>
        `;

        this.renderCrisisDetail();
        this.bindEvents();
        this.renderChart();
    },

    bindEvents() {
        document.querySelectorAll('.crisis-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectedCrisis = card.dataset.crisis;
                this.render();
            });
        });
    },

    renderCrisisDetail() {
        const container = document.getElementById('crisis-detail');
        if (!container) return;

        const crisis = CRISES.find(c => c.id === this.selectedCrisis);
        if (!crisis) return;

        const allocations = getCurrentAllocations();
        const strategy = getStrategy(AppState.selectedStrategy);
        let cumulativeReturn = 0;
        const yearReturns = [];
        for (let y = crisis.startYear; y <= crisis.endYear; y++) {
            const r = getStrategyReturn(allocations, y);
            yearReturns.push({ year: y, return: r });
            cumulativeReturn += r;
        }

        let recoveryYears = 0;
        let balance = 10000;
        for (let y = crisis.startYear; y <= crisis.endYear; y++) {
            balance *= (1 + getStrategyReturn(allocations, y) / 100);
        }
        const postCrisisBalance = balance;
        for (let y = crisis.endYear + 1; y <= END_YEAR; y++) {
            balance *= (1 + getStrategyReturn(allocations, y) / 100);
            recoveryYears++;
            if (balance >= 10000) break;
        }
        if (balance < 10000) recoveryYears = -1;

        const panicSold = postCrisisBalance;
        let heldThrough = postCrisisBalance;
        for (let y = crisis.endYear + 1; y <= Math.min(crisis.endYear + 5, END_YEAR); y++) {
            heldThrough *= (1 + getStrategyReturn(allocations, y) / 100);
        }

        container.innerHTML = `
            <div class="crisis-info" style="border-color: ${crisis.color}">
                <div class="crisis-header-detail">
                    <h3>${crisis.name} <span class="crisis-dates">${crisis.period}</span></h3>
                    <p>${crisis.description}</p>
                </div>

                <div class="crisis-causes">
                    <h4>Causes</h4>
                    <ul>${crisis.causes.map(c => `<li>${c}</li>`).join('')}</ul>
                </div>

                <div class="crisis-impact-grid">
                    <div class="stat-card">
                        <span class="stat-label">Your Strategy's Return</span>
                        <span class="stat-value ${cumulativeReturn >= 0 ? 'positive' : 'negative'}">${cumulativeReturn >= 0 ? '+' : ''}${cumulativeReturn.toFixed(1)}%</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Recovery Time</span>
                        <span class="stat-value">${recoveryYears < 0 ? 'Not recovered' : recoveryYears + ' years'}</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">$10K If Panic Sold</span>
                        <span class="stat-value negative">${formatCurrency(Math.round(panicSold))}</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">$10K If Held 5 More Yrs</span>
                        <span class="stat-value positive">${formatCurrency(Math.round(heldThrough))}</span>
                    </div>
                </div>

                <div class="crisis-year-returns">
                    ${yearReturns.map(yr => `
                        <div class="year-return-chip ${yr.return >= 0 ? 'positive' : 'negative'}">
                            ${yr.year}: ${yr.return >= 0 ? '+' : ''}${yr.return.toFixed(1)}%
                        </div>
                    `).join('')}
                </div>

                <div class="crisis-lesson">
                    <h4>Key Lesson</h4>
                    <p>${crisis.lesson}</p>
                </div>
            </div>
        `;
    },

    renderChart() {
        const canvas = document.getElementById('crisis-chart');
        if (!canvas) return;
        this.chart = destroyChart(this.chart);

        const crisis = CRISES.find(c => c.id === this.selectedCrisis);
        if (!crisis) return;

        const startYear = Math.max(crisis.startYear - 2, START_YEAR);
        const endYear = Math.min(crisis.endYear + 5, END_YEAR);
        const labels = [];
        for (let y = startYear; y <= endYear; y++) labels.push(y);

        const datasets = STRATEGIES.filter(s => s.id !== 'custom').map((s, i) => {
            let balance = 10000;
            const data = labels.map(y => {
                balance *= (1 + getStrategyReturn(s.allocations, y) / 100);
                return Math.round(balance);
            });
            return {
                label: s.name,
                data,
                borderColor: COLORS.palette[i],
                borderWidth: s.id === AppState.selectedStrategy ? 3 : 1.5,
                pointRadius: s.id === AppState.selectedStrategy ? 3 : 0,
                fill: false,
                tension: 0.3
            };
        });

        this.chart = new Chart(canvas, {
            type: 'line',
            data: { labels, datasets },
            options: {
                ...CHART_DEFAULTS,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    ...CHART_DEFAULTS.plugins,
                    annotation: {
                        annotations: {
                            crisis: {
                                type: 'box',
                                xMin: labels.indexOf(crisis.startYear),
                                xMax: labels.indexOf(crisis.endYear),
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                borderColor: crisis.color,
                                borderWidth: 1
                            }
                        }
                    },
                    tooltip: {
                        ...CHART_DEFAULTS.plugins.tooltip,
                        callbacks: { label: ctx => ` ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}` }
                    }
                },
                scales: {
                    ...CHART_DEFAULTS.scales,
                    y: {
                        ...CHART_DEFAULTS.scales.y,
                        ticks: { ...CHART_DEFAULTS.scales.y.ticks, callback: v => formatCurrency(v) }
                    }
                }
            }
        });
    }
};
