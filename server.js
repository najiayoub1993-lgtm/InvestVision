const express = require('express');
const Anthropic = require('@anthropic-ai/sdk').default;
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `You are InvestVision AI Advisor, an expert financial education assistant embedded in a long-term investment dashboard. You help users understand investing concepts, analyze their portfolio choices, and make informed decisions.

Your knowledge covers:
- Asset allocation strategies (Bogleheads 3-Fund, 60/40, All-Weather, Buffett 90/10, etc.)
- Risk metrics (Sharpe ratio, Sortino ratio, max drawdown, VaR, beta, volatility)
- Historical market performance and major crises (Dot-com, 2008 GFC, COVID, 2022 bear market)
- Dollar-cost averaging, rebalancing, tax-advantaged accounts
- ETFs, index funds, bonds, REITs, gold, commodities, emerging markets
- Monte Carlo simulation interpretation
- Inflation impact on long-term returns

Guidelines:
- Give practical, educational answers. Explain the "why" behind recommendations.
- When the user shares their portfolio context (strategy, amount, risk metrics), reference those specifics in your answer.
- Always remind users that this is educational — not personalized financial advice. They should consult a licensed financial advisor for their specific situation.
- Keep answers concise but thorough. Use bullet points for clarity.
- If asked about specific stocks or timing the market, explain why long-term index investing is generally recommended for most people.
- Be honest about uncertainty. Markets are unpredictable — frame projections as probabilities, not guarantees.`;

const conversations = new Map();

function cleanupOldConversations() {
    const maxAge = 60 * 60 * 1000;
    const now = Date.now();
    for (const [id, conv] of conversations) {
        if (now - conv.lastAccess > maxAge) {
            conversations.delete(id);
        }
    }
}

setInterval(cleanupOldConversations, 10 * 60 * 1000);

app.post('/api/chat', async (req, res) => {
    try {
        const { message, conversationId, portfolioContext } = req.body;

        if (!message || typeof message !== 'string' || message.length > 5000) {
            return res.status(400).json({ error: 'Invalid message' });
        }

        let convId = conversationId;
        if (!convId || !conversations.has(convId)) {
            convId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
            conversations.set(convId, { messages: [], lastAccess: Date.now() });
        }

        const conv = conversations.get(convId);
        conv.lastAccess = Date.now();

        let userContent = message;
        if (portfolioContext) {
            userContent = `[Current Portfolio Context]
Strategy: ${portfolioContext.strategy || 'Not selected'}
Investment Amount: $${portfolioContext.amount?.toLocaleString() || '0'}
Monthly DCA: $${portfolioContext.monthlyDCA?.toLocaleString() || '0'}
Time Horizon: ${portfolioContext.timeHorizon || '20'} years
Risk Level: ${portfolioContext.riskLevel || 'Unknown'}
Avg Return: ${portfolioContext.avgReturn || 'N/A'}%
Volatility: ${portfolioContext.volatility || 'N/A'}%
Sharpe Ratio: ${portfolioContext.sharpe || 'N/A'}
Max Drawdown: ${portfolioContext.maxDrawdown || 'N/A'}%

[User Question]
${message}`;
        }

        conv.messages.push({ role: 'user', content: userContent });

        if (conv.messages.length > 20) {
            conv.messages = conv.messages.slice(-20);
        }

        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            messages: conv.messages
        });

        const assistantMessage = response.content[0].text;
        conv.messages.push({ role: 'assistant', content: assistantMessage });

        res.json({
            message: assistantMessage,
            conversationId: convId
        });

    } catch (error) {
        console.error('Chat API error:', error.message);

        if (error.status === 401) {
            return res.status(500).json({ error: 'API key not configured. Set ANTHROPIC_API_KEY environment variable.' });
        }
        if (error.status === 429) {
            return res.status(429).json({ error: 'Rate limited. Please wait a moment and try again.' });
        }

        res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', hasApiKey: !!process.env.ANTHROPIC_API_KEY });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`InvestVision running at http://localhost:${PORT}`);
    if (!process.env.ANTHROPIC_API_KEY) {
        console.warn('WARNING: ANTHROPIC_API_KEY not set. AI Advisor will not work.');
    }
});
