const MarketComponent = {
    heatmapRendered: false,

    render() {
        const container = document.getElementById('market-content');
        if (!container) return;

        const assetStats = ASSET_CLASSES.map(asset => {
            const returns = Object.values(HISTORICAL_RETURNS[asset].returns);
            const mean = RiskEngine.mean(returns);
            const vol = RiskEngine.stddev(returns);
            const dd = RiskEngine.maxDrawdown(returns);
            const sharpe = RiskEngine.sharpeRatio(returns);
            const best = Math.max(...returns);
            const worst = Math.min(...returns);
            const bestYear = Object.entries(HISTORICAL_RETURNS[asset].returns).reduce((a, b) => b[1] > a[1] ? b : a);
            const worstYear = Object.entries(HISTORICAL_RETURNS[asset].returns).reduce((a, b) => b[1] < a[1] ? b : a);
            return { asset, name: HISTORICAL_RETURNS[asset].name, mean, vol, dd: dd.maxDrawdown, sharpe, best, worst, bestYear, worstYear, returns };
        });

        container.innerHTML = `
            <div class="market-section">
                <h3>Asset Class Performance (${START_YEAR}-${END_YEAR})</h3>
                <div class="table-scroll">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Asset Class</th>
                                <th>Avg Return</th>
                                <th>Volatility</th>
                                <th>Sharpe</th>
                                <th>Max Drawdown</th>
                                <th>Best Year</th>
                                <th>Worst Year</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${assetStats.map(s => `
                                <tr>
                                    <td><span class="color-dot" style="background:${COLORS.assetColors[s.asset]}"></span> ${s.name}</td>
                                    <td class="${s.mean >= 0 ? 'positive' : 'negative'}">${s.mean.toFixed(2)}%</td>
                                    <td>${s.vol.toFixed(2)}%</td>
                                    <td>${s.sharpe.toFixed(2)}</td>
                                    <td class="negative">-${s.dd.toFixed(2)}%</td>
                                    <td class="positive">${s.bestYear[0]} (+${s.best.toFixed(1)}%)</td>
                                    <td class="negative">${s.worstYear[0]} (${s.worst.toFixed(1)}%)</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="market-section">
                <h3>Correlation Matrix</h3>
                <div id="correlation-heatmap" class="heatmap-container"></div>
            </div>

            <div class="market-section">
                <h3>Annual Returns Heatmap</h3>
                <div id="returns-heatmap" class="heatmap-container"></div>
            </div>
        `;

        this.renderCorrelationHeatmap(assetStats);
        this.renderReturnsHeatmap();
    },

    correlation(a, b) {
        const n = a.length;
        const meanA = RiskEngine.mean(a);
        const meanB = RiskEngine.mean(b);
        let cov = 0, varA = 0, varB = 0;
        for (let i = 0; i < n; i++) {
            cov += (a[i] - meanA) * (b[i] - meanB);
            varA += (a[i] - meanA) ** 2;
            varB += (b[i] - meanB) ** 2;
        }
        return cov / Math.sqrt(varA * varB);
    },

    renderCorrelationHeatmap(assetStats) {
        const container = document.getElementById('correlation-heatmap');
        if (!container) return;

        const names = assetStats.map(s => s.name);
        const n = assetStats.length;
        const z = [];

        for (let i = 0; i < n; i++) {
            const row = [];
            for (let j = 0; j < n; j++) {
                row.push(parseFloat(this.correlation(assetStats[i].returns, assetStats[j].returns).toFixed(2)));
            }
            z.push(row);
        }

        Plotly.newPlot(container, [{
            z, x: names, y: names,
            type: 'heatmap',
            colorscale: [
                [0, '#ef4444'], [0.25, '#f97316'], [0.5, '#fbbf24'],
                [0.75, '#22c55e'], [1, '#6366f1']
            ],
            zmin: -1, zmax: 1,
            text: z.map(row => row.map(v => v.toFixed(2))),
            texttemplate: '%{text}',
            textfont: { color: '#fff', size: 10 },
            hovertemplate: '%{x} vs %{y}: %{z:.2f}<extra></extra>'
        }], {
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            font: { color: COLORS.textMuted, family: "'Inter', sans-serif" },
            margin: { t: 30, l: 120, r: 30, b: 120 },
            height: 500
        }, { responsive: true, displayModeBar: false });
    },

    renderReturnsHeatmap() {
        const container = document.getElementById('returns-heatmap');
        if (!container) return;

        const assets = ASSET_CLASSES;
        const names = assets.map(a => HISTORICAL_RETURNS[a].name);
        const z = assets.map(a => YEARS.map(y => HISTORICAL_RETURNS[a].returns[y]));
        const text = z.map(row => row.map(v => (v >= 0 ? '+' : '') + v.toFixed(1) + '%'));

        Plotly.newPlot(container, [{
            z, x: YEARS.map(String), y: names,
            type: 'heatmap',
            colorscale: [
                [0, '#ef4444'], [0.3, '#f97316'], [0.45, '#fbbf24'],
                [0.5, '#1e293b'], [0.55, '#4ade80'], [0.7, '#22c55e'], [1, '#6366f1']
            ],
            zmid: 0,
            text,
            texttemplate: '%{text}',
            textfont: { size: 8, color: '#fff' },
            hovertemplate: '%{y} (%{x}): %{z:.1f}%<extra></extra>'
        }], {
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            font: { color: COLORS.textMuted, family: "'Inter', sans-serif" },
            margin: { t: 30, l: 120, r: 30, b: 50 },
            height: 450
        }, { responsive: true, displayModeBar: false });
    }
};
