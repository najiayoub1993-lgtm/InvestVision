const ChatComponent = {
    isOpen: false,
    messages: [],
    conversationHistory: [],
    isLoading: false,
    apiKey: null,

    SYSTEM_PROMPT: `You are InvestVision AI Advisor, an expert financial education assistant embedded in a long-term investment dashboard. You help users understand investing concepts, analyze their portfolio choices, and make informed decisions.

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
- When the user shares their portfolio context, reference those specifics in your answer.
- Always remind users this is educational — not personalized financial advice.
- Keep answers concise but thorough. Use bullet points for clarity.
- Be honest about uncertainty. Markets are unpredictable.`,

    init() {
        const chatWidget = document.getElementById('chat-widget');
        if (!chatWidget) return;

        this.apiKey = localStorage.getItem('investvision_api_key') || null;

        chatWidget.innerHTML = `
            <button class="chat-toggle" id="chat-toggle" title="AI Investment Advisor">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span class="chat-badge">AI</span>
            </button>
            <div class="chat-panel" id="chat-panel">
                <div class="chat-header">
                    <div class="chat-header-info">
                        <span class="chat-dot ${this.apiKey ? '' : 'disconnected'}"></span>
                        <h3>AI Investment Advisor</h3>
                    </div>
                    <div class="chat-header-actions">
                        <button class="chat-key-btn" id="chat-key-btn" title="API Key Settings">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                            </svg>
                        </button>
                        <button class="chat-close" id="chat-close">&times;</button>
                    </div>
                </div>

                <div class="api-key-panel" id="api-key-panel" style="display: ${this.apiKey ? 'none' : 'flex'}">
                    <div class="api-key-content">
                        <div class="api-key-icon">🔑</div>
                        <h4>Connect to Claude AI</h4>
                        <p>Enter your Anthropic API key to enable the AI advisor. Your key is stored locally in your browser only.</p>
                        <div class="api-key-input-row">
                            <input type="password" id="api-key-input" placeholder="sk-ant-api03-..."
                                value="${this.apiKey || ''}">
                            <button class="btn btn-primary" id="api-key-save">Connect</button>
                        </div>
                        <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener" class="api-key-link">
                            Get an API key from Anthropic Console ↗
                        </a>
                        ${this.apiKey ? '<button class="btn btn-danger-text" id="api-key-remove">Disconnect & Remove Key</button>' : ''}
                    </div>
                </div>

                <div class="chat-messages" id="chat-messages">
                    <div class="chat-message assistant">
                        <div class="message-content">
                            ${this.apiKey
                                ? `<p>Hello! I'm your AI Investment Advisor powered by Claude. I can see your current portfolio setup and help you with:</p>
                                   <ul>
                                       <li>Understanding your risk metrics</li>
                                       <li>Comparing strategies</li>
                                       <li>Explaining market concepts</li>
                                       <li>Interpreting your backtest or simulation results</li>
                                   </ul>
                                   <p>What would you like to know?</p>`
                                : `<p>Welcome! To get started, click the 🔑 key icon above to enter your Anthropic API key.</p>`
                            }
                        </div>
                    </div>
                </div>
                <div class="chat-input-area">
                    <div class="chat-context-badge" id="chat-context-badge"></div>
                    <div class="chat-input-row">
                        <textarea id="chat-input" placeholder="${this.apiKey ? 'Ask about your investments...' : 'Enter API key first...'}" rows="1" ${this.apiKey ? '' : 'disabled'}></textarea>
                        <button class="chat-send" id="chat-send" title="Send" ${this.apiKey ? '' : 'disabled'}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('chat-toggle')?.addEventListener('click', () => this.toggle());
        document.getElementById('chat-close')?.addEventListener('click', () => this.toggle());

        document.getElementById('chat-key-btn')?.addEventListener('click', () => {
            const panel = document.getElementById('api-key-panel');
            if (panel) panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
        });

        document.getElementById('api-key-save')?.addEventListener('click', () => this.saveApiKey());
        document.getElementById('api-key-input')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.saveApiKey();
        });

        document.getElementById('api-key-remove')?.addEventListener('click', () => {
            localStorage.removeItem('investvision_api_key');
            this.apiKey = null;
            this.conversationHistory = [];
            this.init();
        });

        const input = document.getElementById('chat-input');
        const sendBtn = document.getElementById('chat-send');

        sendBtn?.addEventListener('click', () => this.send());
        input?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.send();
            }
        });

        input?.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 120) + 'px';
        });
    },

    saveApiKey() {
        const input = document.getElementById('api-key-input');
        const key = input?.value.trim();
        if (!key) return;

        localStorage.setItem('investvision_api_key', key);
        this.apiKey = key;
        this.conversationHistory = [];
        this.init();
        if (!this.isOpen) this.toggle();
    },

    toggle() {
        this.isOpen = !this.isOpen;
        const panel = document.getElementById('chat-panel');
        const toggle = document.getElementById('chat-toggle');
        if (panel) panel.classList.toggle('open', this.isOpen);
        if (toggle) toggle.classList.toggle('active', this.isOpen);
        if (this.isOpen) {
            this.updateContextBadge();
            if (this.apiKey) document.getElementById('chat-input')?.focus();
        }
    },

    getPortfolioContext() {
        const allocations = getCurrentAllocations();
        const strategy = getStrategy(AppState.selectedStrategy);
        const risk = RiskEngine.calculateAll(allocations);

        return {
            strategy: strategy?.name || 'Custom',
            amount: AppState.investmentAmount,
            monthlyDCA: AppState.monthlyDCA,
            timeHorizon: AppState.timeHorizon,
            riskLevel: risk.riskLabel,
            avgReturn: risk.avgReturn,
            volatility: risk.volatility,
            sharpe: risk.sharpe,
            maxDrawdown: risk.maxDrawdown
        };
    },

    updateContextBadge() {
        const badge = document.getElementById('chat-context-badge');
        if (!badge) return;
        const ctx = this.getPortfolioContext();
        badge.innerHTML = `<span>Portfolio: ${ctx.strategy} | $${ctx.amount.toLocaleString()} | ${ctx.timeHorizon}yr</span>`;
    },

    async send() {
        const input = document.getElementById('chat-input');
        const message = input?.value.trim();
        if (!message || this.isLoading || !this.apiKey) return;

        input.value = '';
        input.style.height = 'auto';

        this.addMessage('user', message);
        this.isLoading = true;
        this.showTyping();

        const ctx = this.getPortfolioContext();
        const userContent = `[Current Portfolio Context]
Strategy: ${ctx.strategy}
Investment Amount: $${ctx.amount.toLocaleString()}
Monthly DCA: $${ctx.monthlyDCA.toLocaleString()}
Time Horizon: ${ctx.timeHorizon} years
Risk Level: ${ctx.riskLevel}
Avg Return: ${ctx.avgReturn}%
Volatility: ${ctx.volatility}%
Sharpe Ratio: ${ctx.sharpe}
Max Drawdown: ${ctx.maxDrawdown}%

[User Question]
${message}`;

        this.conversationHistory.push({ role: 'user', content: userContent });

        if (this.conversationHistory.length > 20) {
            this.conversationHistory = this.conversationHistory.slice(-20);
        }

        try {
            const res = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerous-direct-browser-access': 'true'
                },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: 1024,
                    system: this.SYSTEM_PROMPT,
                    messages: this.conversationHistory
                })
            });

            this.removeTyping();

            if (res.ok) {
                const data = await res.json();
                const assistantMessage = data.content[0].text;
                this.conversationHistory.push({ role: 'assistant', content: assistantMessage });
                this.addMessage('assistant', assistantMessage);
            } else if (res.status === 401) {
                this.addSystemMessage('Invalid API key. Click the 🔑 icon to update it.');
                this.conversationHistory.pop();
            } else if (res.status === 429) {
                this.addSystemMessage('Rate limited. Please wait a moment and try again.');
                this.conversationHistory.pop();
            } else {
                const err = await res.json().catch(() => ({}));
                this.addSystemMessage(err.error?.message || 'Something went wrong. Please try again.');
                this.conversationHistory.pop();
            }
        } catch {
            this.removeTyping();
            this.addSystemMessage('Network error. Check your connection.');
            this.conversationHistory.pop();
        }

        this.isLoading = false;
    },

    addMessage(role, content) {
        this.messages.push({ role, content });
        const container = document.getElementById('chat-messages');
        if (!container) return;

        const div = document.createElement('div');
        div.className = `chat-message ${role}`;

        const formatted = role === 'assistant' ? this.formatMarkdown(content) : this.escapeHtml(content);

        div.innerHTML = `<div class="message-content">${formatted}</div>`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    },

    addSystemMessage(text) {
        const container = document.getElementById('chat-messages');
        if (!container) return;
        const div = document.createElement('div');
        div.className = 'chat-message system';
        div.innerHTML = `<div class="message-content system-msg">${this.escapeHtml(text)}</div>`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    },

    showTyping() {
        const container = document.getElementById('chat-messages');
        if (!container) return;
        const div = document.createElement('div');
        div.className = 'chat-message assistant typing-indicator';
        div.id = 'typing-indicator';
        div.innerHTML = `<div class="message-content"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    },

    removeTyping() {
        document.getElementById('typing-indicator')?.remove();
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    formatMarkdown(text) {
        let html = this.escapeHtml(text);
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/`(.*?)`/g, '<code>$1</code>');
        html = html.replace(/^- (.*)/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        html = html.replace(/\n\n/g, '</p><p>');
        html = html.replace(/\n/g, '<br>');
        html = '<p>' + html + '</p>';
        return html;
    }
};

document.addEventListener('DOMContentLoaded', () => ChatComponent.init());
