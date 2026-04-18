const STRATEGIES = [
    {
        id: 'bogleheads',
        name: 'Bogleheads 3-Fund',
        icon: '📚',
        risk: 'Moderate',
        description: 'The classic lazy portfolio. Broad diversification at the lowest cost. Recommended by the Bogleheads community inspired by Jack Bogle, founder of Vanguard.',
        philosophy: 'Keep it simple, diversify broadly, minimize costs. Time in the market beats timing the market.',
        allocations: {
            sp500: 0.60,
            intl_developed: 0.30,
            us_bonds: 0.10
        }
    },
    {
        id: 'classic_60_40',
        name: 'Classic 60/40',
        icon: '⚖️',
        risk: 'Moderate',
        description: 'The traditional balanced portfolio used by pension funds and financial advisors for decades. 60% stocks for growth, 40% bonds for stability.',
        philosophy: 'Balance growth and preservation. Bonds cushion stock volatility while stocks drive long-term returns.',
        allocations: {
            sp500: 0.60,
            us_bonds: 0.40
        }
    },
    {
        id: 'all_weather',
        name: 'Ray Dalio All-Weather',
        icon: '🌦️',
        risk: 'Low-Moderate',
        description: 'Designed by Ray Dalio of Bridgewater Associates to perform well across all economic environments: growth, recession, inflation, and deflation.',
        philosophy: 'Risk parity — balance risk across economic scenarios rather than maximizing returns. Survive any storm.',
        allocations: {
            sp500: 0.30,
            treasury_10y: 0.40,
            us_bonds: 0.15,
            gold: 0.075,
            commodities: 0.075
        }
    },
    {
        id: 'buffett',
        name: 'Warren Buffett',
        icon: '🏛️',
        risk: 'Moderate-High',
        description: "Warren Buffett's recommendation for his own estate: 90% in a low-cost S&P 500 index fund and 10% in short-term government bonds.",
        philosophy: 'Bet on America. The S&P 500 has always recovered and reached new highs. Keep it simple and cheap.',
        allocations: {
            sp500: 0.90,
            us_bonds: 0.10
        }
    },
    {
        id: 'aggressive',
        name: 'Aggressive Growth',
        icon: '🚀',
        risk: 'High',
        description: '100% equities for maximum long-term growth. Best for young investors with 20+ year horizons who can stomach large drawdowns.',
        philosophy: 'Maximize exposure to the highest-returning asset class over long periods. Volatility is the price of admission.',
        allocations: {
            sp500: 0.50,
            nasdaq: 0.25,
            intl_developed: 0.15,
            emerging: 0.10
        }
    },
    {
        id: 'conservative',
        name: 'Conservative Income',
        icon: '🛡️',
        risk: 'Low',
        description: 'Designed for capital preservation with modest income. Heavy bond allocation with REITs for income diversification.',
        philosophy: 'Protect what you have. Accept lower returns in exchange for sleeping well at night and steady income.',
        allocations: {
            us_bonds: 0.40,
            treasury_10y: 0.20,
            sp500: 0.25,
            reits: 0.15
        }
    },
    {
        id: 'custom',
        name: 'Custom Strategy',
        icon: '🎯',
        risk: 'Custom',
        description: 'Build your own allocation. Drag the sliders to set your preferred mix across all asset classes.',
        philosophy: 'You know your goals best. Create a portfolio that matches your unique risk tolerance and outlook.',
        allocations: {
            sp500: 0.40,
            nasdaq: 0.00,
            dowjones: 0.00,
            intl_developed: 0.20,
            emerging: 0.05,
            us_bonds: 0.15,
            treasury_10y: 0.05,
            reits: 0.05,
            gold: 0.05,
            commodities: 0.05
        }
    }
];

function getStrategy(id) {
    return STRATEGIES.find(s => s.id === id);
}

function getStrategyReturn(allocations, year) {
    let totalReturn = 0;
    for (const [asset, weight] of Object.entries(allocations)) {
        if (HISTORICAL_RETURNS[asset] && HISTORICAL_RETURNS[asset].returns[year] !== undefined) {
            totalReturn += weight * HISTORICAL_RETURNS[asset].returns[year];
        }
    }
    return totalReturn;
}
