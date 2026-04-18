const CRISES = [
    {
        id: 'dotcom',
        name: 'Dot-Com Crash',
        period: '2000–2002',
        startYear: 2000,
        endYear: 2002,
        peakDate: 'March 2000',
        troughDate: 'October 2002',
        color: '#e74c3c',
        description: 'The bursting of the internet bubble. Tech stocks lost nearly 80% of their value. The S&P 500 dropped ~49% from peak to trough.',
        causes: [
            'Extreme overvaluation of internet companies',
            'Speculative mania in tech IPOs',
            'Companies with no profits trading at absurd multiples',
            '9/11 attacks deepened the recession'
        ],
        impact: {
            sp500: -40.12,
            nasdaq: -67.56,
            us_bonds: 30.33,
            gold: 20.88,
            recoveryYears: 4.5
        },
        lesson: 'Diversification matters. While tech was devastated, bonds and gold performed well. A balanced portfolio recovered much faster than a tech-heavy one.'
    },
    {
        id: 'gfc',
        name: 'Global Financial Crisis',
        period: '2007–2009',
        startYear: 2007,
        endYear: 2009,
        peakDate: 'October 2007',
        troughDate: 'March 2009',
        color: '#e67e22',
        description: 'The worst financial crisis since the Great Depression. Triggered by the subprime mortgage collapse, it brought the global financial system to the brink.',
        causes: [
            'Subprime mortgage lending and securitization',
            'Excessive leverage in the banking system',
            'Failure of major financial institutions (Lehman Brothers)',
            'Credit default swaps and toxic assets'
        ],
        impact: {
            sp500: -37.00,
            nasdaq: -40.54,
            reits: -37.73,
            emerging: -53.33,
            us_bonds: 5.24,
            gold: 5.77,
            treasury_10y: 20.10,
            recoveryYears: 4.0
        },
        lesson: 'Government bonds and gold act as true safe havens. The market recovered fully by 2013 and went on a historic bull run. Those who kept investing during the crash saw enormous gains.'
    },
    {
        id: 'covid',
        name: 'COVID-19 Crash',
        period: 'Feb–Mar 2020',
        startYear: 2020,
        endYear: 2020,
        peakDate: 'February 2020',
        troughDate: 'March 2020',
        color: '#9b59b6',
        description: 'The fastest 30%+ decline in stock market history. The S&P 500 fell 34% in just 23 trading days as the pandemic shut down the global economy.',
        causes: [
            'Global COVID-19 pandemic',
            'Unprecedented economic shutdowns',
            'Supply chain disruptions',
            'Initial uncertainty about virus severity'
        ],
        impact: {
            sp500: 18.40,
            nasdaq: 43.64,
            us_bonds: 7.51,
            gold: 24.60,
            reits: -5.12,
            recoveryYears: 0.4
        },
        lesson: 'The fastest crash was followed by the fastest recovery. Massive fiscal and monetary stimulus drove a V-shaped recovery. Full-year 2020 returns were actually positive for most assets.'
    },
    {
        id: 'bear2022',
        name: '2022 Bear Market',
        period: 'Jan–Oct 2022',
        startYear: 2022,
        endYear: 2022,
        peakDate: 'January 2022',
        troughDate: 'October 2022',
        color: '#3498db',
        description: 'Inflation surged to 40-year highs. The Fed raised rates aggressively. Both stocks AND bonds fell together — the traditional 60/40 portfolio had its worst year in decades.',
        causes: [
            'Post-COVID inflation surge to 9.1%',
            'Aggressive Federal Reserve rate hikes',
            'Russia-Ukraine war disrupting energy markets',
            'End of zero-interest-rate era'
        ],
        impact: {
            sp500: -18.11,
            nasdaq: -32.54,
            us_bonds: -13.01,
            treasury_10y: -17.83,
            reits: -25.10,
            gold: -0.28,
            commodities: 16.09,
            recoveryYears: 1.0
        },
        lesson: 'When inflation spikes, traditional stock-bond diversification breaks down. Commodities and real assets provided the only protection. This is why the All-Weather portfolio includes commodities.'
    }
];

function getCrisisYears() {
    const years = new Set();
    CRISES.forEach(c => {
        for (let y = c.startYear; y <= c.endYear; y++) {
            years.add(y);
        }
    });
    return years;
}
