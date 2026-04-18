const COLORS = {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    success: '#22c55e',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    bg: '#0f172a',
    cardBg: '#1e293b',
    border: '#334155',
    text: '#e2e8f0',
    textMuted: '#94a3b8',
    grid: 'rgba(148, 163, 184, 0.1)',

    palette: [
        '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b',
        '#22c55e', '#14b8a6', '#3b82f6', '#a855f7', '#ef4444'
    ],

    assetColors: {
        sp500: '#6366f1',
        nasdaq: '#8b5cf6',
        dowjones: '#3b82f6',
        intl_developed: '#14b8a6',
        emerging: '#f59e0b',
        us_bonds: '#22c55e',
        treasury_10y: '#10b981',
        reits: '#ec4899',
        gold: '#eab308',
        commodities: '#f97316'
    },

    riskGauge: ['#22c55e', '#84cc16', '#f59e0b', '#f97316', '#ef4444']
};

const CHART_DEFAULTS = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            labels: { color: COLORS.text, font: { family: "'Inter', sans-serif", size: 12 } }
        },
        tooltip: {
            backgroundColor: COLORS.cardBg,
            titleColor: COLORS.text,
            bodyColor: COLORS.textMuted,
            borderColor: COLORS.border,
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8
        }
    },
    scales: {
        x: {
            grid: { color: COLORS.grid },
            ticks: { color: COLORS.textMuted }
        },
        y: {
            grid: { color: COLORS.grid },
            ticks: { color: COLORS.textMuted }
        }
    }
};

function formatCurrency(value) {
    if (Math.abs(value) >= 1e6) return '$' + (value / 1e6).toFixed(2) + 'M';
    if (Math.abs(value) >= 1e3) return '$' + (value / 1e3).toFixed(1) + 'K';
    return '$' + value.toLocaleString();
}

function formatPercent(value) {
    return parseFloat(value).toFixed(2) + '%';
}

function destroyChart(chartInstance) {
    if (chartInstance) {
        chartInstance.destroy();
    }
    return null;
}

function deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = deepMerge(result[key] || {}, source[key]);
        } else {
            result[key] = source[key];
        }
    }
    return result;
}
