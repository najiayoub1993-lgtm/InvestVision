const RiskEngine = {
    getPortfolioReturns(allocations, startYear = START_YEAR, endYear = END_YEAR) {
        const returns = [];
        for (let year = startYear; year <= endYear; year++) {
            returns.push(getStrategyReturn(allocations, year));
        }
        return returns;
    },

    mean(arr) {
        return arr.reduce((sum, v) => sum + v, 0) / arr.length;
    },

    stddev(arr) {
        const avg = this.mean(arr);
        const squaredDiffs = arr.map(v => Math.pow(v - avg, 2));
        return Math.sqrt(squaredDiffs.reduce((sum, v) => sum + v, 0) / (arr.length - 1));
    },

    downsideDeviation(arr, threshold = 0) {
        const downside = arr.filter(r => r < threshold).map(r => Math.pow(r - threshold, 2));
        if (downside.length === 0) return 0;
        return Math.sqrt(downside.reduce((sum, v) => sum + v, 0) / arr.length);
    },

    sharpeRatio(returns, riskFreeRate = 3.0) {
        const excessReturns = returns.map(r => r - riskFreeRate);
        const avgExcess = this.mean(excessReturns);
        const std = this.stddev(returns);
        return std === 0 ? 0 : avgExcess / std;
    },

    sortinoRatio(returns, riskFreeRate = 3.0) {
        const avgExcess = this.mean(returns) - riskFreeRate;
        const dd = this.downsideDeviation(returns, riskFreeRate);
        return dd === 0 ? 0 : avgExcess / dd;
    },

    maxDrawdown(returns) {
        let peak = 100;
        let current = 100;
        let maxDD = 0;
        let ddStart = 0, ddEnd = 0, ddPeakIdx = 0;

        for (let i = 0; i < returns.length; i++) {
            current *= (1 + returns[i] / 100);
            if (current > peak) {
                peak = current;
                ddPeakIdx = i;
            }
            const dd = ((peak - current) / peak) * 100;
            if (dd > maxDD) {
                maxDD = dd;
                ddStart = ddPeakIdx;
                ddEnd = i;
            }
        }
        return { maxDrawdown: maxDD, startIdx: ddStart, endIdx: ddEnd };
    },

    valueAtRisk(returns, confidence = 0.95) {
        const sorted = [...returns].sort((a, b) => a - b);
        const idx = Math.floor((1 - confidence) * sorted.length);
        return sorted[idx] || sorted[0];
    },

    beta(portfolioReturns, benchmarkReturns) {
        if (portfolioReturns.length !== benchmarkReturns.length) return 0;
        const n = portfolioReturns.length;
        const avgP = this.mean(portfolioReturns);
        const avgB = this.mean(benchmarkReturns);
        let covariance = 0, variance = 0;
        for (let i = 0; i < n; i++) {
            covariance += (portfolioReturns[i] - avgP) * (benchmarkReturns[i] - avgB);
            variance += Math.pow(benchmarkReturns[i] - avgB, 2);
        }
        return variance === 0 ? 0 : covariance / variance;
    },

    calculateAll(allocations) {
        const returns = this.getPortfolioReturns(allocations);
        const benchmarkReturns = Object.values(HISTORICAL_RETURNS.sp500.returns);

        const volatility = this.stddev(returns);
        const avgReturn = this.mean(returns);
        const sharpe = this.sharpeRatio(returns);
        const sortino = this.sortinoRatio(returns);
        const dd = this.maxDrawdown(returns);
        const var95 = this.valueAtRisk(returns, 0.95);
        const var99 = this.valueAtRisk(returns, 0.99);
        const betaVal = this.beta(returns, benchmarkReturns);

        let riskScore;
        if (volatility < 5) riskScore = 1;
        else if (volatility < 10) riskScore = 2;
        else if (volatility < 15) riskScore = 3;
        else if (volatility < 20) riskScore = 4;
        else riskScore = 5;

        const riskLabels = ['', 'Very Low', 'Low', 'Moderate', 'High', 'Very High'];

        return {
            avgReturn: avgReturn.toFixed(2),
            volatility: volatility.toFixed(2),
            sharpe: sharpe.toFixed(2),
            sortino: sortino.toFixed(2),
            maxDrawdown: dd.maxDrawdown.toFixed(2),
            var95: var95.toFixed(2),
            var99: var99.toFixed(2),
            beta: betaVal.toFixed(2),
            riskScore,
            riskLabel: riskLabels[riskScore],
            returns
        };
    }
};
