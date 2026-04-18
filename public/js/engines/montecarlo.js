const MonteCarloEngine = {
    gaussianRandom() {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    },

    run(allocations, years, initialAmount, monthlyDCA = 0, runs = 1000, overrides = {}) {
        const historicalReturns = RiskEngine.getPortfolioReturns(allocations);
        const mean = overrides.expectedReturn ?? RiskEngine.mean(historicalReturns);
        const std = overrides.volatility ?? RiskEngine.stddev(historicalReturns);
        const inflationRate = overrides.inflation ?? 2.5;

        const paths = [];
        const finalValues = [];
        const realFinalValues = [];

        for (let r = 0; r < runs; r++) {
            const path = [initialAmount];
            let balance = initialAmount;

            for (let y = 1; y <= years; y++) {
                const yearReturn = mean + std * this.gaussianRandom();
                balance = balance * (1 + yearReturn / 100) + monthlyDCA * 12;
                path.push(Math.round(balance));
            }

            paths.push(path);
            finalValues.push(Math.round(balance));
            const realValue = balance / Math.pow(1 + inflationRate / 100, years);
            realFinalValues.push(Math.round(realValue));
        }

        finalValues.sort((a, b) => a - b);
        realFinalValues.sort((a, b) => a - b);

        const percentileAt = (arr, p) => arr[Math.floor(p * arr.length)];

        const percentiles = {
            p5: percentileAt(finalValues, 0.05),
            p10: percentileAt(finalValues, 0.10),
            p25: percentileAt(finalValues, 0.25),
            p50: percentileAt(finalValues, 0.50),
            p75: percentileAt(finalValues, 0.75),
            p90: percentileAt(finalValues, 0.90),
            p95: percentileAt(finalValues, 0.95)
        };

        const realPercentiles = {
            p5: percentileAt(realFinalValues, 0.05),
            p25: percentileAt(realFinalValues, 0.25),
            p50: percentileAt(realFinalValues, 0.50),
            p75: percentileAt(realFinalValues, 0.75),
            p95: percentileAt(realFinalValues, 0.95)
        };

        const pathPercentiles = [];
        for (let y = 0; y <= years; y++) {
            const valuesAtYear = paths.map(p => p[y]).sort((a, b) => a - b);
            pathPercentiles.push({
                year: y,
                p5: percentileAt(valuesAtYear, 0.05),
                p25: percentileAt(valuesAtYear, 0.25),
                p50: percentileAt(valuesAtYear, 0.50),
                p75: percentileAt(valuesAtYear, 0.75),
                p95: percentileAt(valuesAtYear, 0.95)
            });
        }

        const totalInvested = initialAmount + monthlyDCA * 12 * years;
        const probLoss = finalValues.filter(v => v < totalInvested).length / runs;
        const probDouble = finalValues.filter(v => v >= totalInvested * 2).length / runs;
        const probTriple = finalValues.filter(v => v >= totalInvested * 3).length / runs;

        return {
            paths: paths.slice(0, 50),
            finalValues,
            percentiles,
            realPercentiles,
            pathPercentiles,
            stats: {
                mean: Math.round(RiskEngine.mean(finalValues)),
                median: percentiles.p50,
                min: finalValues[0],
                max: finalValues[finalValues.length - 1],
                probLoss: (probLoss * 100).toFixed(1),
                probDouble: (probDouble * 100).toFixed(1),
                probTriple: (probTriple * 100).toFixed(1),
                totalInvested,
                meanReturn: mean.toFixed(2),
                usedVolatility: std.toFixed(2)
            }
        };
    }
};
