const EducationComponent = {
    currentSection: 'questionnaire',
    quizAnswers: {},
    quizComplete: false,
    quizResult: null,

    render() {
        const container = document.getElementById('education-content');
        if (!container) return;

        container.innerHTML = `
            <div class="edu-nav">
                <button class="edu-btn ${this.currentSection === 'questionnaire' ? 'active' : ''}" data-section="questionnaire">Risk Questionnaire</button>
                <button class="edu-btn ${this.currentSection === 'strategies' ? 'active' : ''}" data-section="strategies">Strategy Guide</button>
                <button class="edu-btn ${this.currentSection === 'glossary' ? 'active' : ''}" data-section="glossary">Glossary</button>
                <button class="edu-btn ${this.currentSection === 'tips' ? 'active' : ''}" data-section="tips">Investment Tips</button>
                <button class="edu-btn ${this.currentSection === 'news' ? 'active' : ''}" data-section="news">News Sources</button>
            </div>
            <div id="edu-section-content"></div>
        `;

        document.querySelectorAll('.edu-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentSection = btn.dataset.section;
                this.render();
            });
        });

        this.renderSection();
    },

    renderSection() {
        const container = document.getElementById('edu-section-content');
        if (!container) return;

        switch (this.currentSection) {
            case 'questionnaire': this.renderQuestionnaire(container); break;
            case 'strategies': this.renderStrategies(container); break;
            case 'glossary': this.renderGlossary(container); break;
            case 'tips': this.renderTips(container); break;
            case 'news': this.renderNews(container); break;
        }
    },

    questions: [
        { id: 'age', text: 'What is your age range?', options: [
            { text: '18-30', score: 5 }, { text: '31-45', score: 4 }, { text: '46-55', score: 3 }, { text: '56-65', score: 2 }, { text: '65+', score: 1 }
        ]},
        { id: 'horizon', text: 'When do you need this money?', options: [
            { text: '20+ years', score: 5 }, { text: '10-20 years', score: 4 }, { text: '5-10 years', score: 3 }, { text: '2-5 years', score: 2 }, { text: 'Within 2 years', score: 1 }
        ]},
        { id: 'reaction', text: 'If your portfolio dropped 30% in a month, you would:', options: [
            { text: 'Buy more — great discount!', score: 5 }, { text: 'Hold and wait for recovery', score: 4 }, { text: 'Feel uncomfortable but hold', score: 3 }, { text: 'Sell some to reduce risk', score: 2 }, { text: 'Sell everything immediately', score: 1 }
        ]},
        { id: 'income', text: 'How stable is your income?', options: [
            { text: 'Very stable (government/tenured)', score: 5 }, { text: 'Stable (salaried employee)', score: 4 }, { text: 'Moderate (commission-based)', score: 3 }, { text: 'Variable (freelance/contract)', score: 2 }, { text: 'Uncertain', score: 1 }
        ]},
        { id: 'emergency', text: 'Do you have an emergency fund (3-6 months expenses)?', options: [
            { text: 'Yes, 6+ months', score: 5 }, { text: 'Yes, 3-6 months', score: 4 }, { text: 'Partially', score: 3 }, { text: 'Small one', score: 2 }, { text: 'No', score: 1 }
        ]},
        { id: 'experience', text: 'Your investing experience?', options: [
            { text: 'Expert (10+ years active)', score: 5 }, { text: 'Experienced (5-10 years)', score: 4 }, { text: 'Some experience (1-5 years)', score: 3 }, { text: 'Beginner (< 1 year)', score: 2 }, { text: 'Complete novice', score: 1 }
        ]},
        { id: 'goal', text: 'Your primary investment goal?', options: [
            { text: 'Maximum growth, willing to take big risks', score: 5 }, { text: 'Growth with some risk', score: 4 }, { text: 'Balanced growth and safety', score: 3 }, { text: 'Mostly safety, some growth', score: 2 }, { text: 'Capital preservation above all', score: 1 }
        ]},
        { id: 'loss', text: 'Maximum annual loss you could tolerate?', options: [
            { text: '40%+ — I have a strong stomach', score: 5 }, { text: '25-40%', score: 4 }, { text: '15-25%', score: 3 }, { text: '5-15%', score: 2 }, { text: 'Any loss is unacceptable', score: 1 }
        ]},
        { id: 'knowledge', text: 'Do you understand that higher returns require higher risk?', options: [
            { text: 'Yes, fully understand and accept', score: 5 }, { text: 'Yes, understand', score: 4 }, { text: 'Somewhat', score: 3 }, { text: 'Not sure', score: 2 }, { text: 'No', score: 1 }
        ]},
        { id: 'debt', text: 'Do you have high-interest debt (credit cards, personal loans)?', options: [
            { text: 'No debt at all', score: 5 }, { text: 'Only mortgage/student loans', score: 4 }, { text: 'Small amount', score: 3 }, { text: 'Moderate amount', score: 2 }, { text: 'Significant debt', score: 1 }
        ]}
    ],

    renderQuestionnaire(container) {
        if (this.quizComplete && this.quizResult) {
            const rec = this.quizResult;
            container.innerHTML = `
                <div class="quiz-result">
                    <h3>Your Risk Profile</h3>
                    <div class="result-score">
                        <div class="score-circle" style="background: ${rec.color}">${rec.score}/50</div>
                        <h2>${rec.profile}</h2>
                    </div>
                    <p class="result-desc">${rec.description}</p>
                    <div class="recommended-strategy">
                        <h4>Recommended Strategy</h4>
                        <div class="strategy-card active">
                            <div class="strategy-header">
                                <span class="strategy-icon">${rec.strategy.icon}</span>
                                <h3>${rec.strategy.name}</h3>
                            </div>
                            <p>${rec.strategy.description}</p>
                        </div>
                        <button class="btn btn-primary" id="apply-recommendation">Apply This Strategy</button>
                        <button class="btn btn-secondary" id="retake-quiz">Retake Quiz</button>
                    </div>
                </div>
            `;
            document.getElementById('apply-recommendation')?.addEventListener('click', () => {
                AppState.selectedStrategy = rec.strategy.id;
                document.querySelector('[data-tab="portfolio"]')?.click();
            });
            document.getElementById('retake-quiz')?.addEventListener('click', () => {
                this.quizAnswers = {};
                this.quizComplete = false;
                this.quizResult = null;
                this.render();
            });
            return;
        }

        container.innerHTML = `
            <div class="questionnaire">
                <h3>Find Your Risk Tolerance</h3>
                <p>Answer 10 questions to discover your investor profile and get a personalized strategy recommendation.</p>
                ${this.questions.map((q, i) => `
                    <div class="question-card">
                        <h4>${i + 1}. ${q.text}</h4>
                        <div class="options">
                            ${q.options.map((opt, j) => `
                                <label class="option-label ${this.quizAnswers[q.id] === j ? 'selected' : ''}">
                                    <input type="radio" name="q-${q.id}" value="${j}" ${this.quizAnswers[q.id] === j ? 'checked' : ''}>
                                    ${opt.text}
                                </label>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
                <button class="btn btn-primary btn-large" id="submit-quiz"
                    ${Object.keys(this.quizAnswers).length < this.questions.length ? 'disabled' : ''}>
                    Get My Risk Profile
                </button>
            </div>
        `;

        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const qId = e.target.name.replace('q-', '');
                this.quizAnswers[qId] = parseInt(e.target.value);
                const submitBtn = document.getElementById('submit-quiz');
                if (submitBtn) submitBtn.disabled = Object.keys(this.quizAnswers).length < this.questions.length;
                container.querySelectorAll(`[name="${e.target.name}"]`).forEach(r => r.closest('.option-label').classList.remove('selected'));
                e.target.closest('.option-label').classList.add('selected');
            });
        });

        document.getElementById('submit-quiz')?.addEventListener('click', () => {
            let totalScore = 0;
            this.questions.forEach(q => {
                const ansIdx = this.quizAnswers[q.id];
                if (ansIdx !== undefined) totalScore += q.options[ansIdx].score;
            });
            this.quizResult = this.getRecommendation(totalScore);
            this.quizComplete = true;
            this.render();
        });
    },

    getRecommendation(score) {
        let profile, description, strategyId, color;
        if (score >= 42) {
            profile = 'Aggressive Investor'; description = 'You have a high tolerance for risk and a long time horizon. You can handle significant volatility in pursuit of maximum growth.';
            strategyId = 'aggressive'; color = '#ef4444';
        } else if (score >= 34) {
            profile = 'Growth Investor'; description = 'You are comfortable with moderate-to-high risk and want strong growth. You understand markets fluctuate and can stay the course.';
            strategyId = 'buffett'; color = '#f59e0b';
        } else if (score >= 26) {
            profile = 'Balanced Investor'; description = 'You want a mix of growth and stability. You prefer to manage risk while still capturing upside. A diversified approach suits you.';
            strategyId = 'bogleheads'; color = '#6366f1';
        } else if (score >= 18) {
            profile = 'Conservative Investor'; description = 'You prioritize protecting your capital over maximizing returns. You prefer less volatility and are uncomfortable with large losses.';
            strategyId = 'all_weather'; color = '#22c55e';
        } else {
            profile = 'Very Conservative Investor'; description = 'Capital preservation is your top priority. You want minimal risk and are willing to accept lower returns for peace of mind.';
            strategyId = 'conservative'; color = '#14b8a6';
        }
        return { score, profile, description, strategy: getStrategy(strategyId), color };
    },

    renderStrategies(container) {
        container.innerHTML = `
            <div class="strategies-deep-dive">
                ${STRATEGIES.filter(s => s.id !== 'custom').map(s => {
                    const risk = RiskEngine.calculateAll(s.allocations);
                    return `
                        <div class="strategy-detail-card">
                            <div class="strategy-header">
                                <span class="strategy-icon large">${s.icon}</span>
                                <div>
                                    <h3>${s.name}</h3>
                                    <span class="risk-badge risk-${s.risk.toLowerCase().replace(/[^a-z]/g, '')}">${s.risk} Risk</span>
                                </div>
                            </div>
                            <p class="philosophy">"${s.philosophy}"</p>
                            <p>${s.description}</p>
                            <div class="strategy-metrics">
                                <span>Avg Return: <strong class="positive">${risk.avgReturn}%</strong></span>
                                <span>Volatility: <strong>${risk.volatility}%</strong></span>
                                <span>Sharpe: <strong>${risk.sharpe}</strong></span>
                                <span>Max DD: <strong class="negative">-${risk.maxDrawdown}%</strong></span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    glossary: [
        { term: 'Alpha', def: 'Excess return of an investment relative to its benchmark. Positive alpha means outperformance.' },
        { term: 'Asset Allocation', def: 'The division of investments among different asset categories like stocks, bonds, and cash.' },
        { term: 'Bear Market', def: 'A market decline of 20% or more from recent highs, typically lasting months.' },
        { term: 'Beta', def: 'A measure of volatility relative to the overall market. Beta > 1 means more volatile than the market.' },
        { term: 'Bull Market', def: 'A period of rising market prices, typically defined as a 20%+ gain from recent lows.' },
        { term: 'CAGR', def: 'Compound Annual Growth Rate — the average yearly growth rate of an investment over time.' },
        { term: 'Correlation', def: 'How two assets move in relation to each other. -1 = opposite, 0 = unrelated, 1 = same direction.' },
        { term: 'Diversification', def: 'Spreading investments across different assets to reduce risk. Don\'t put all your eggs in one basket.' },
        { term: 'Dollar-Cost Averaging (DCA)', def: 'Investing fixed amounts at regular intervals regardless of market conditions.' },
        { term: 'Drawdown', def: 'The decline from a peak to a trough in portfolio value. Max drawdown is the worst such decline.' },
        { term: 'ETF', def: 'Exchange-Traded Fund — a basket of securities that trades on an exchange like a stock.' },
        { term: 'Expense Ratio', def: 'The annual fee charged by a fund, expressed as a percentage of assets. Lower is better.' },
        { term: 'Index Fund', def: 'A fund that tracks a market index (like S&P 500) rather than trying to beat it.' },
        { term: 'Inflation', def: 'The rate at which prices increase over time, reducing the purchasing power of money.' },
        { term: 'Market Cap', def: 'Total market value of a company\'s shares. Large-cap > $10B, Mid-cap $2-10B, Small-cap < $2B.' },
        { term: 'Monte Carlo Simulation', def: 'Running thousands of random scenarios to estimate the probability of different outcomes.' },
        { term: 'P/E Ratio', def: 'Price-to-Earnings ratio — how much investors pay per dollar of earnings. Higher = more expensive.' },
        { term: 'Portfolio Rebalancing', def: 'Periodically adjusting your portfolio back to your target allocation as markets move.' },
        { term: 'Real Return', def: 'Investment return adjusted for inflation. If you earn 8% and inflation is 3%, real return is ~5%.' },
        { term: 'REITs', def: 'Real Estate Investment Trusts — companies that own income-producing real estate, traded like stocks.' },
        { term: 'Risk Premium', def: 'The extra return earned for taking on more risk compared to a "risk-free" investment.' },
        { term: 'Sharpe Ratio', def: 'Risk-adjusted return. Higher is better. Measures how much return you get per unit of risk.' },
        { term: 'Sortino Ratio', def: 'Like Sharpe but only penalizes downside volatility. Better for assessing harmful risk.' },
        { term: 'Standard Deviation', def: 'A measure of how much returns vary from the average. Higher = more volatile.' },
        { term: 'Tax-Loss Harvesting', def: 'Selling losing investments to offset capital gains taxes, then buying similar replacements.' },
        { term: 'Total Return', def: 'Investment gain including both price appreciation and dividends/interest.' },
        { term: 'Value at Risk (VaR)', def: 'The maximum expected loss at a given confidence level (e.g., 95% VaR = worst 5% scenario).' },
        { term: 'Volatility', def: 'How much an investment\'s price fluctuates. Higher volatility = higher risk and potential return.' },
        { term: 'Yield', def: 'Income return on an investment, usually expressed as an annual percentage.' },
        { term: 'Yield Curve', def: 'Graph showing interest rates across different bond maturities. Inverted curves often predict recessions.' }
    ],

    renderGlossary(container) {
        container.innerHTML = `
            <div class="glossary">
                <input type="text" id="glossary-search" placeholder="Search terms..." class="search-input">
                <div id="glossary-list" class="glossary-list">
                    ${this.glossary.map(g => `
                        <div class="glossary-item">
                            <h4>${g.term}</h4>
                            <p>${g.def}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        document.getElementById('glossary-search')?.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            document.querySelectorAll('.glossary-item').forEach((item, i) => {
                const match = this.glossary[i].term.toLowerCase().includes(q) || this.glossary[i].def.toLowerCase().includes(q);
                item.style.display = match ? 'block' : 'none';
            });
        });
    },

    renderTips(container) {
        container.innerHTML = `
            <div class="tips-section">
                <div class="tip-card">
                    <h3>💡 Dollar-Cost Averaging (DCA)</h3>
                    <p>Invest a fixed amount regularly (monthly) regardless of market conditions. This removes emotional timing decisions and averages your cost basis. Studies show DCA beats lump-sum investing ~34% of the time, but it dramatically reduces regret and the risk of investing at a peak.</p>
                </div>
                <div class="tip-card">
                    <h3>🏦 Tax-Advantaged Accounts First</h3>
                    <p>Maximize contributions to tax-advantaged accounts before taxable ones:</p>
                    <ul>
                        <li><strong>401(k)/403(b)</strong> — Especially if employer matches (free money!)</li>
                        <li><strong>Roth IRA</strong> — Tax-free growth and withdrawals in retirement</li>
                        <li><strong>Traditional IRA</strong> — Tax-deductible contributions, taxed at withdrawal</li>
                        <li><strong>HSA</strong> — Triple tax advantage for healthcare costs</li>
                    </ul>
                </div>
                <div class="tip-card">
                    <h3>🔄 Rebalancing</h3>
                    <p>Review and rebalance your portfolio annually or when allocations drift more than 5% from targets. This forces you to sell high and buy low systematically. Don't rebalance too often — quarterly at most.</p>
                </div>
                <div class="tip-card">
                    <h3>💰 The Power of Low Fees</h3>
                    <p>A 1% annual fee difference compounds dramatically over 20 years. On a $100K portfolio growing at 7%, a 0.03% fee (Vanguard index) vs 1.0% fee (average active fund) costs you <strong>$45,000+</strong> in lost returns over 20 years.</p>
                </div>
                <div class="tip-card">
                    <h3>🧠 Behavioral Traps to Avoid</h3>
                    <ul>
                        <li><strong>Loss aversion</strong> — Losses feel 2x worse than equivalent gains feel good</li>
                        <li><strong>Recency bias</strong> — Assuming recent trends will continue forever</li>
                        <li><strong>FOMO</strong> — Chasing hot stocks or sectors after they've already run up</li>
                        <li><strong>Panic selling</strong> — Selling during crashes locks in losses permanently</li>
                        <li><strong>Overconfidence</strong> — Thinking you can consistently beat the market</li>
                    </ul>
                </div>
                <div class="tip-card">
                    <h3>📋 Before You Invest Checklist</h3>
                    <ul>
                        <li>✅ Emergency fund of 3-6 months expenses</li>
                        <li>✅ High-interest debt paid off (credit cards)</li>
                        <li>✅ Employer 401(k) match maximized</li>
                        <li>✅ Clear investment time horizon defined</li>
                        <li>✅ Risk tolerance honestly assessed</li>
                        <li>✅ Low-cost index funds selected</li>
                        <li>✅ Automatic investment schedule set up</li>
                    </ul>
                </div>
                <div class="tip-card">
                    <h3>📊 The Rule of 72</h3>
                    <p>Divide 72 by your expected annual return to estimate how many years it takes to double your money. At 7% annual return: 72 ÷ 7 ≈ <strong>10.3 years</strong> to double. At 10%: about 7.2 years.</p>
                </div>
            </div>
        `;
    },

    renderNews(container) {
        container.innerHTML = `
            <div class="news-section">
                <h3>Trusted Financial News Sources</h3>
                <p>Stay informed but don't let daily news drive your long-term investment decisions.</p>
                <div class="news-sources">
                    ${[
                        { name: 'Bloomberg', url: 'https://www.bloomberg.com/markets', desc: 'Comprehensive financial data and analysis', icon: '📰' },
                        { name: 'Reuters', url: 'https://www.reuters.com/business/finance/', desc: 'Unbiased global financial news', icon: '🌐' },
                        { name: 'CNBC', url: 'https://www.cnbc.com/markets/', desc: 'Real-time market data and news', icon: '📺' },
                        { name: 'MarketWatch', url: 'https://www.marketwatch.com/', desc: 'Market data, analysis, and tools', icon: '📊' },
                        { name: 'Financial Times', url: 'https://www.ft.com/markets', desc: 'In-depth global financial journalism', icon: '📋' },
                        { name: 'The Motley Fool', url: 'https://www.fool.com/', desc: 'Investing education and stock analysis', icon: '🎭' },
                        { name: 'Morningstar', url: 'https://www.morningstar.com/', desc: 'Fund ratings, research, and analysis', icon: '⭐' },
                        { name: 'Investopedia', url: 'https://www.investopedia.com/', desc: 'Financial education and tutorials', icon: '📚' },
                        { name: 'Yahoo Finance', url: 'https://finance.yahoo.com/', desc: 'Free market data and portfolio tracking', icon: '💹' },
                        { name: 'Bogleheads Forum', url: 'https://www.bogleheads.org/forum/', desc: 'Community of long-term index investors', icon: '🏠' }
                    ].map(s => `
                        <a href="${s.url}" target="_blank" rel="noopener" class="news-source-card">
                            <span class="source-icon">${s.icon}</span>
                            <div>
                                <h4>${s.name}</h4>
                                <p>${s.desc}</p>
                            </div>
                            <span class="external-link">↗</span>
                        </a>
                    `).join('')}
                </div>

                <div class="news-advice">
                    <h3>⚠️ How to Consume Financial News</h3>
                    <ul>
                        <li><strong>Don't react</strong> — If news makes you want to sell or buy immediately, wait 48 hours</li>
                        <li><strong>Ignore predictions</strong> — Nobody consistently predicts short-term market moves</li>
                        <li><strong>Focus on fundamentals</strong> — Earnings, economic data, and long-term trends matter more than headlines</li>
                        <li><strong>Limit consumption</strong> — Checking daily news doesn't improve 20-year returns</li>
                        <li><strong>Beware of clickbait</strong> — "Market CRASH incoming!" headlines generate clicks, not good advice</li>
                    </ul>
                </div>
            </div>
        `;
    }
};
