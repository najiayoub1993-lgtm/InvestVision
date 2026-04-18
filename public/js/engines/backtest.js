const BacktestEngine = {
    run(allocations, startYear, initialAmount, monthlyDCA = 0, adjustForInflation = true) {
        const results = [];
        let nominalBalance = initialAmount;
        let realBalance = initialAmount;
        let cumulativeInflation = 1;
        let peak = initialAmount;
        let totalContributed = initialAmount;

        for (let year = startYear; year <= END_YEAR; year++) {
            const yearReturn = getStrategyReturn(allocations, year);
            const inflation = HISTORICAL_RETURNS.cpi.returns[year] || 2.5;

            const annualDCA = monthlyDCA * 12;
            nominalBalance = nominalBalance * (1 + yearReturn / 100) + annualDCA;
            totalContributed += annualDCA;

            cumulativeInflation *= (1 + inflation / 100);
            realBalance = nominalBalance / cumulativeInflation;

            if (nominalBalance > peak) peak = nominalBalance;
            const drawdown = ((peak - nominalBalance) / peak) * 100;

            results.push({
                year,
                returnPct: yearReturn.toFixed(2),
                nominalBalance: Math.round(nominalBalance),
                realBalance: Math.round(realBalance),
                totalContributed: Math.round(totalContributed),
                drawdown: drawdown.toFixed(2),
                inflation: inflation.toFixed(2),
                gain: Math.round(nominalBalance - totalContributed)
            });
        }

        return results;
    },

    compare(strategies, startYear, initialAmount, monthlyDCA = 0) {
        const results = {};
        strategies.forEach(s => {
            results[s.id] = this.run(s.allocations, startYear, initialAmount, monthlyDCA);
        });
        return results;
    },

    getSummary(backtestResults) {
        if (backtestResults.length === 0) return null;
        const last = backtestResults[backtestResults.length - 1];
        const first = backtestResults[0];
        const years = backtestResults.length;
        const totalReturn = ((last.nominalBalance / first.totalContributed) - 1) * 100;
        const cagr = (Math.pow(last.nominalBalance / backtestResults[0].totalContributed, 1 / years) - 1) * 100;

        const returns = backtestResults.map(r => parseFloat(r.returnPct));
        const bestYear = backtestResults.reduce((best, r) => parseFloat(r.returnPct) > parseFloat(best.returnPct) ? r : best);
        const worstYear = backtestResults.reduce((worst, r) => parseFloat(r.returnPct) < parseFloat(worst.returnPct) ? r : worst);
        const maxDD = Math.max(...backtestResults.map(r => parseFloat(r.drawdown)));

        return {
            finalNominal: last.nominalBalance,
            finalReal: last.realBalance,
            totalContributed: last.totalContributed,
            totalReturn: totalReturn.toFixed(2),
            cagr: cagr.toFixed(2),
            bestYear: { year: bestYear.year, return: bestYear.returnPct },
            worstYear: { year: worstYear.year, return: worstYear.returnPct },
            maxDrawdown: maxDD.toFixed(2),
            gain: last.gain,
            years
        };
    }
};
