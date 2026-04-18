const AppState = {
    currentTab: 'portfolio',
    investmentAmount: 20000,
    monthlyDCA: 500,
    timeHorizon: 20,
    selectedStrategy: 'bogleheads',
    customAllocations: { ...STRATEGIES.find(s => s.id === 'custom').allocations },
    charts: {}
};

function getCurrentAllocations() {
    if (AppState.selectedStrategy === 'custom') {
        return { ...AppState.customAllocations };
    }
    const strategy = getStrategy(AppState.selectedStrategy);
    return strategy ? { ...strategy.allocations } : {};
}

function initApp() {
    setupTabs();
    setupGlobalInputs();
    renderTab('portfolio');
}

function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(`tab-${tab}`).classList.add('active');
            AppState.currentTab = tab;
            renderTab(tab);
        });
    });
}

function setupGlobalInputs() {
    const amountInput = document.getElementById('investment-amount');
    const dcaInput = document.getElementById('monthly-dca');
    const horizonInput = document.getElementById('time-horizon');
    const horizonValue = document.getElementById('horizon-value');

    if (amountInput) {
        amountInput.value = AppState.investmentAmount;
        amountInput.addEventListener('input', (e) => {
            AppState.investmentAmount = parseFloat(e.target.value) || 0;
            refreshCurrentTab();
        });
    }
    if (dcaInput) {
        dcaInput.value = AppState.monthlyDCA;
        dcaInput.addEventListener('input', (e) => {
            AppState.monthlyDCA = parseFloat(e.target.value) || 0;
            refreshCurrentTab();
        });
    }
    if (horizonInput) {
        horizonInput.value = AppState.timeHorizon;
        horizonValue.textContent = AppState.timeHorizon;
        horizonInput.addEventListener('input', (e) => {
            AppState.timeHorizon = parseInt(e.target.value);
            horizonValue.textContent = AppState.timeHorizon;
            refreshCurrentTab();
        });
    }
}

function renderTab(tab) {
    switch (tab) {
        case 'portfolio': PortfolioComponent.render(); break;
        case 'risk': RiskDashComponent.render(); break;
        case 'backtest': BacktestComponent.render(); break;
        case 'simulator': SimulatorComponent.render(); break;
        case 'market': MarketComponent.render(); break;
        case 'crisis': CrisisComponent.render(); break;
        case 'education': EducationComponent.render(); break;
    }
}

function refreshCurrentTab() {
    renderTab(AppState.currentTab);
}

document.addEventListener('DOMContentLoaded', initApp);
