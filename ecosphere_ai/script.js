/**
 * EcoSphere AI - Carbon Pilot (ESG Digital Twin Dashboard Logic)
 * Managing interactive states, Chart.js integrations, simulation rules,
 * gamification mechanics, and terminal console logs.
 */

// ==========================================================================
// 1. Baseline State Constants
// ==========================================================================

const BASE_DEPARTMENTS = [
    { name: 'Administration', esg: 88, env: 90, soc: 85, gov: 90, carbon: 180, target: 200 },
    { name: 'Finance & Acc.', esg: 78, env: 80, soc: 75, gov: 80, carbon: 140, target: 150 },
    { name: 'Research & Dev.', esg: 85, env: 88, soc: 80, gov: 88, carbon: 220, target: 250 },
    { name: 'Product Eng.', esg: 94, env: 96, soc: 90, gov: 96, carbon: 310, target: 400 },
    { name: 'Sales & Mktg.', esg: 72, env: 75, soc: 70, gov: 72, carbon: 120, target: 130 },
    { name: 'Customer Success', esg: 80, env: 82, soc: 78, gov: 80, carbon: 90, target: 100 },
    { name: 'Global Logistics', esg: 48, env: 40, soc: 50, gov: 55, carbon: 480, target: 350 },
    { name: 'Manufacturing', esg: 62, env: 58, soc: 65, gov: 64, carbon: 410, target: 380 },
    { name: 'Legal & Risk', esg: 90, env: 92, soc: 88, gov: 90, carbon: 50, target: 70 },
    { name: 'IT Infrastructure', esg: 84, env: 86, soc: 82, gov: 84, carbon: 280, target: 300 }
];

const BASE_REWARDS = [
    { id: 1, name: 'Extra Paid Leave Day', cost: 1000, stock: 3 },
    { id: 2, name: 'Tree Dedication Planting', cost: 200, stock: 15 },
    { id: 3, name: '$20 Green-Retail Voucher', cost: 350, stock: 8 },
    { id: 4, name: 'Eco Carbon-Neutral Mug', cost: 150, stock: 10 }
];

const BASE_CHALLENGES = [
    { id: 1, name: 'Cycle to Work Month', desc: 'Commute via bike for 30 days. Award: +300 XP. Increases corporate social rating.', rewardXp: 300, joined: false, icon: 'fa-bicycle' },
    { id: 2, name: 'Paperless Office Initiative', desc: 'Transition administrative files to digital clouds. Award: +150 XP. Boosts environmental score.', rewardXp: 150, joined: false, icon: 'fa-file-invoice' },
    { id: 3, name: 'Zero Carbon Weekend', desc: 'Shutdown non-critical server instances during weekends. Award: +250 XP. Cuts IT emissions.', rewardXp: 250, joined: false, icon: 'fa-plug-circle-xmark' }
];

const BASE_BADGES = [
    { id: 'cadet', name: 'Eco Cadet', icon: 'fa-baby-carriage', unlocked: true, class: 'badge-green', desc: 'First steps in corporate ESG management.' },
    { id: 'fleet', name: 'Fleet Master', icon: 'fa-truck-fast', unlocked: false, class: 'badge-green', desc: 'Unlocked by optimizing logistics fleets.' },
    { id: 'audit', name: 'Guardian', icon: 'fa-building-shield', unlocked: false, class: 'badge-purple', desc: 'Unlocked by mitigating compliance issues.' },
    { id: 'champ', name: 'Challenger', icon: 'fa-circle-check', unlocked: false, class: 'badge-orange', desc: 'Joined multiple carbon reduction sprints.' },
    { id: 'redeemer', name: 'Market Veteran', icon: 'fa-basket-shopping', unlocked: false, class: 'badge-purple', desc: 'Redeemed sustainability shop rewards.' }
];

const BASE_CARBON_DATA = [195, 182, 170, 165, 155, 142, 138, 140, 132, 125, 118, 110];
const BASE_TARGET_DATA = [175, 170, 165, 160, 155, 150, 145, 140, 135, 130, 125, 120];

// ==========================================================================
// 2. Active Application State Variables
// ==========================================================================

let departments = JSON.parse(JSON.stringify(BASE_DEPARTMENTS));
let rewards = JSON.parse(JSON.stringify(BASE_REWARDS));
let challenges = JSON.parse(JSON.stringify(BASE_CHALLENGES));
let badges = JSON.parse(JSON.stringify(BASE_BADGES));
let carbonData = [...BASE_CARBON_DATA];
let targetData = [...BASE_TARGET_DATA];

let employeeXP = 1250;
const XP_LEVEL_CAP = 2500; // Cap to illustrate level bar fill ratio
let activeFilter = 'All';

let chartInstance = null;
let toastTimeout = null;

// AI Advisor Optimization Flags
let fleetOptimized = false;
let auditsActioned = false;

// ==========================================================================
// 3. Application Lifecycle Setup
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    logMessage('EcoSphere AI initialization sequence triggered...', 'info');
    
    // Setup Chart.js
    try {
        initChart();
        logMessage('Carbon simulation charting component established.', 'success');
    } catch(err) {
        logMessage('Failed to initialize Chart.js trend visualization: ' + err.message, 'danger');
        console.error(err);
    }
    
    // Initial display sync
    updateDashboardVisuals();
    logMessage('Digital twin command metrics synchronized with system database.', 'success');
    
    // Hash change handler for routing navigation tabs
    window.addEventListener('hashchange', handleUrlRouting);
    handleUrlRouting();
});

// ==========================================================================
// 4. Interface Rendering & Synch Engine
// ==========================================================================

function updateDashboardVisuals() {
    // 4.1 Compute Averages & Aggregate Values
    let totalEsg = 0, totalEnv = 0, totalSoc = 0, totalGov = 0;
    let totalCarbonYtd = 0;

    departments.forEach(d => {
        totalEsg += d.esg;
        totalEnv += d.env;
        totalSoc += d.soc;
        totalGov += d.gov;
        totalCarbonYtd += d.carbon;
    });

    let companyAvg = {
        esg: Math.round(totalEsg / departments.length),
        env: Math.round(totalEnv / departments.length),
        soc: Math.round(totalSoc / departments.length),
        gov: Math.round(totalGov / departments.length)
    };

    // 4.2 Switch context depending on Selected Filter
    let scopeScores = {};
    let displayYtd = 0;

    if (activeFilter === 'All') {
        scopeScores = companyAvg;
        displayYtd = totalCarbonYtd;
        document.getElementById('scopeFilterBadge').innerHTML = `<i class="fa-solid fa-circle-nodes"></i> Scope: All Departments`;
    } else {
        let selectedDept = departments.find(d => d.name === activeFilter);
        if (selectedDept) {
            scopeScores = {
                esg: selectedDept.esg,
                env: selectedDept.env,
                soc: selectedDept.soc,
                gov: selectedDept.gov
            };
            displayYtd = selectedDept.carbon;
            document.getElementById('scopeFilterBadge').innerHTML = `<i class="fa-solid fa-circle-nodes"></i> Scope: ${selectedDept.name}`;
        } else {
            scopeScores = companyAvg;
            displayYtd = totalCarbonYtd;
            document.getElementById('scopeFilterBadge').innerHTML = `<i class="fa-solid fa-circle-nodes"></i> Scope: All Departments`;
        }
    }

    // 4.3 Redraw circular score gauges
    updateCircularGauge('esgGaugeCircle', 'esgGaugeVal', scopeScores.esg);
    updateCircularGauge('envGaugeCircle', 'envGaugeVal', scopeScores.env);
    updateCircularGauge('socialGaugeCircle', 'socialGaugeVal', scopeScores.soc);
    updateCircularGauge('govGaugeCircle', 'govGaugeVal', scopeScores.gov);

    // 4.4 Set Carbon YTD total label
    document.getElementById('ytdEmissionsVal').innerText = displayYtd.toLocaleString();

    // 4.5 Refresh Component sections
    renderLeaderboard();
    renderHeatmap();
    renderAdvisorInsights();
    renderRewardsShop();
    renderChallenges();
    renderBadges();

    // 4.6 Update XP bars
    document.getElementById('sidebarXpVal').innerText = `${employeeXP.toLocaleString()} XP`;
    document.getElementById('shopXpVal').innerText = employeeXP.toLocaleString();
    let xpBarPct = Math.min(100, Math.max(5, (employeeXP / XP_LEVEL_CAP) * 100));
    document.getElementById('sidebarXpBar').style.width = `${xpBarPct}%`;

    // 4.7 Update Charts
    updateChartData();
}

function updateCircularGauge(circleId, valId, score) {
    let circle = document.getElementById(circleId);
    let valContainer = document.getElementById(valId);
    if (circle) {
        // Circumference is 2 * PI * r = 2 * 3.14159 * 50 = 314.16
        let maxOffset = 314.16;
        let targetOffset = maxOffset - (maxOffset * score / 100);
        circle.style.strokeDashoffset = targetOffset;
    }
    if (valContainer) {
        valContainer.innerText = score;
    }
}

// 4.8 Render Leaderboard Component
function renderLeaderboard() {
    let container = document.getElementById('deptLeaderboardContainer');
    if (!container) return;

    // Sort departments by ESG score (descending)
    let sortedDepts = [...departments].sort((a, b) => b.esg - a.esg);

    container.innerHTML = '';
    sortedDepts.forEach((dept, index) => {
        let rankClass = 'rank-other';
        if (index === 0) rankClass = 'rank-1';
        else if (index === 1) rankClass = 'rank-2';
        else if (index === 2) rankClass = 'rank-3';

        let focusedClass = (dept.name === activeFilter) ? 'focused' : '';

        container.innerHTML += `
            <div class="leaderboard-row ${focusedClass}" onclick="filterByDept('${dept.name}')">
                <div class="leaderboard-left">
                    <span class="rank-badge ${rankClass}">${index + 1}</span>
                    <div class="dept-info">
                        <span class="dept-name-txt">${dept.name}</span>
                        <span class="dept-metrics-txt">Carbon YTD: ${dept.carbon}t (Limit: ${dept.target}t)</span>
                    </div>
                </div>
                <div class="leaderboard-right">
                    <span class="leaderboard-score">${dept.esg} pts</span>
                </div>
            </div>
        `;
    });
}

// 4.9 Render Heatmap Component
function renderHeatmap() {
    let container = document.getElementById('carbonHeatmapContainer');
    if (!container) return;

    container.innerHTML = '';
    departments.forEach(dept => {
        let statusClass = 'heatmap-low';
        let ratio = dept.carbon / (dept.target || 1);
        
        if (ratio > 1.0) {
            statusClass = 'heatmap-high';
        } else if (ratio > 0.8) {
            statusClass = 'heatmap-med';
        }

        let focusedClass = (dept.name === activeFilter) ? 'focused' : '';

        container.innerHTML += `
            <div class="heatmap-element ${statusClass} ${focusedClass}" onclick="filterByDept('${dept.name}')">
                <span class="name">${dept.name}</span>
                <span class="val">${dept.carbon} t</span>
            </div>
        `;
    });
}

// 4.10 Render AI Recommendations
function renderAdvisorInsights() {
    let container = document.getElementById('aiAdvisorContainer');
    if (!container) return;

    container.innerHTML = `
        <div class="ai-recommendation-card" style="border-left-color: var(--color-env); opacity: ${fleetOptimized ? 0.6 : 1};">
            <div class="ai-card-meta">
                <span class="tag" style="color: var(--color-env);"><i class="fa-solid fa-truck-ramp-box"></i> Fleet Optimisation</span>
                <span class="benefit"><i class="fa-solid fa-cloud-arrow-down"></i> -130t Carbon</span>
            </div>
            <div class="ai-card-text">
                Logistics vehicle fleet emissions exceed baseline targets by 37%. Electrify 30% of distribution vehicles to capture significant carbon savings.
            </div>
            <div class="ai-card-actions">
                <button class="btn-mini" id="fleetOptBtn" ${fleetOptimized ? 'disabled' : ''} onclick="applyAIOptimization('fleet')">
                    ${fleetOptimized ? 'Fleet Optimised' : 'Optimize Fleet'}
                </button>
            </div>
        </div>

        <div class="ai-recommendation-card" style="border-left-color: var(--color-gov); opacity: ${auditsActioned ? 0.6 : 1};">
            <div class="ai-card-meta">
                <span class="tag" style="color: var(--color-gov);"><i class="fa-solid fa-clipboard-list"></i> Governance Compliance</span>
                <span class="benefit"><i class="fa-solid fa-arrow-up-right-dots"></i> +25 G rating</span>
            </div>
            <div class="ai-card-text">
                Manufacturing division has 6 delayed governance environmental disclosures. Action filing reminders immediately to reduce regulatory risk profile.
            </div>
            <div class="ai-card-actions">
                <button class="btn-mini" id="auditsOptBtn" ${auditsActioned ? 'disabled' : ''} onclick="applyAIOptimization('audits')">
                    ${auditsActioned ? 'Audits Audited' : 'Action Audits'}
                </button>
            </div>
        </div>
    `;
}

// 4.11 Render Rewards Shop Items
function renderRewardsShop() {
    let container = document.getElementById('rewardsShopContainer');
    if (!container) return;

    container.innerHTML = '';
    rewards.forEach(item => {
        let isAffordable = employeeXP >= item.cost;
        let hasStock = item.stock > 0;
        let btnDisabled = (!isAffordable || !hasStock);
        let btnText = 'Redeem';
        if (!hasStock) btnText = 'Sold Out';
        else if (!isAffordable) btnText = 'Low XP';

        container.innerHTML += `
            <div class="shop-card">
                <div class="shop-card-title">${item.name}</div>
                <div class="shop-card-bottom">
                    <div>
                        <div class="shop-card-cost">${item.cost} XP</div>
                        <div class="shop-card-stock">Stock: ${item.stock} left</div>
                    </div>
                    <button class="shop-card-btn" ${btnDisabled ? 'disabled' : ''} onclick="redeemReward(${item.id})">
                        ${btnText}
                    </button>
                </div>
            </div>
        `;
    });
}

// 4.12 Render Challenges
function renderChallenges() {
    let container = document.getElementById('challengesContainer');
    if (!container) return;

    container.innerHTML = '';
    challenges.forEach(ch => {
        container.innerHTML += `
            <div class="challenge-box">
                <div class="challenge-icon"><i class="fa-solid ${ch.icon}"></i></div>
                <div class="challenge-title">${ch.name}</div>
                <div class="challenge-desc">${ch.desc}</div>
                <button class="challenge-btn" ${ch.joined ? 'disabled' : ''} onclick="joinChallenge(${ch.id})">
                    ${ch.joined ? 'Challenge Joined' : 'Join Challenge'}
                </button>
            </div>
        `;
    });
}

// 4.13 Render Badges
function renderBadges() {
    let container = document.getElementById('badgeShelfContainer');
    if (!container) return;

    container.innerHTML = '';
    badges.forEach(b => {
        container.innerHTML += `
            <div class="badge-unit ${b.unlocked ? 'unlocked' : ''} ${b.unlocked ? b.class : ''}" title="${b.desc}">
                <div class="badge-circle">
                    <i class="fa-solid ${b.icon}"></i>
                </div>
                <span class="badge-name-lbl">${b.name}</span>
            </div>
        `;
    });
}

// ==========================================================================
// 5. Simulation & Interactive Workflows
// ==========================================================================

// 5.1 Run Operations Simulator
function simulateOperations() {
    logMessage('Executing carbon offset simulation algorithm across corporate matrix...', 'info');

    departments.forEach(d => {
        // Fluctuating carbon emissions (-15 to +15)
        let change = Math.floor(Math.random() * 31) - 15;
        d.carbon = Math.max(10, d.carbon + change);

        // Score response loops
        if (d.carbon <= d.target) {
            d.env = Math.min(100, d.env + Math.floor(Math.random() * 4));
        } else {
            d.env = Math.max(20, d.env - Math.floor(Math.random() * 5));
        }

        d.soc = Math.max(30, Math.min(100, d.soc + (Math.random() > 0.45 ? 2 : -2)));
        d.gov = Math.max(30, Math.min(100, d.gov + (Math.random() > 0.5 ? 1 : -1)));
        
        // ESG formulation
        d.esg = Math.round((d.env * 0.4) + (d.soc * 0.3) + (d.gov * 0.3));
    });

    // Perturb global historical graph data slightly
    carbonData = carbonData.map(v => Math.max(30, v + Math.floor(Math.random() * 11) - 5));

    logMessage('Simulation completed. Live scores recalculating.', 'success');
    showToast('Simulation Ran!', 'Corporate digital twin datasets refreshed with new emissions factors.');
    updateDashboardVisuals();
}

// 5.2 Optimizations from AI Advisor
function applyAIOptimization(type) {
    if (type === 'fleet') {
        if (fleetOptimized) return;
        
        logMessage('AI Advisor Recommendation Approved: Upgrading fleet distribution network to electric drive...', 'info');
        let logistics = departments.find(d => d.name === 'Global Logistics');
        if (logistics) {
            logistics.carbon = Math.max(50, logistics.carbon - 130);
            logistics.env = Math.min(100, logistics.env + 30);
            logistics.esg = Math.round((logistics.env * 0.4) + (logistics.soc * 0.3) + (logistics.gov * 0.3));
            
            // Adjust current month curve
            carbonData = carbonData.map(v => Math.max(40, v - 10));

            // Unlock badge
            unlockBadge('fleet');

            fleetOptimized = true;
            logMessage('Global Logistics environmental impact reduced (-130t CO2e, +30 env rating).', 'success');
            showToast('Fleet Optimised!', '30% of Global Logistics distribution fleet converted to EVs.');
            updateDashboardVisuals();
        }
    } else if (type === 'audits') {
        if (auditsActioned) return;

        logMessage('AI Advisor Recommendation Approved: Processing corporate disclosures to legal regulatory owners...', 'info');
        let mfg = departments.find(d => d.name === 'Manufacturing');
        if (mfg) {
            mfg.gov = Math.min(100, mfg.gov + 25);
            mfg.esg = Math.round((mfg.env * 0.4) + (mfg.soc * 0.3) + (mfg.gov * 0.3));

            // Unlock badge
            unlockBadge('audit');

            auditsActioned = true;
            logMessage('Manufacturing regulatory audits filed successfully (+25 Gov compliance score).', 'success');
            showToast('Governance Cleared!', 'Overdue disclosure filings completed. Risk level minimized.');
            updateDashboardVisuals();
        }
    }
}

// 5.3 Enlisting in Challenges
function joinChallenge(id) {
    let ch = challenges.find(x => x.id === id);
    if (!ch || ch.joined) return;

    logMessage(`User enlisting in challenge: ${ch.name}`, 'info');
    ch.joined = true;
    
    // Add XP rewards
    employeeXP += ch.rewardXp;

    // Corporate Social scoring boost due to community alignment
    departments.forEach(d => {
        d.soc = Math.min(100, d.soc + 3);
        d.esg = Math.round((d.env * 0.4) + (d.soc * 0.3) + (d.gov * 0.3));
    });

    // Check if challenge badge should be unlocked
    let totalJoined = challenges.filter(c => c.joined).length;
    if (totalJoined >= 2) {
        unlockBadge('champ');
    }

    logMessage(`Challenge enqueued. +${ch.rewardXp} XP awarded. Corporate social scores boosted.`, 'success');
    showToast('Enlisted!', `You joined: ${ch.name}. +${ch.rewardXp} XP awarded.`);
    updateDashboardVisuals();
}

// 5.4 Redeem Rewards
function redeemReward(id) {
    let r = rewards.find(item => item.id === id);
    if (!r) return;

    if (r.stock <= 0) {
        logMessage(`Failed to redeem: ${r.name} is sold out.`, 'danger');
        showToast('Claim Failed', 'Item is sold out.');
        return;
    }

    if (employeeXP < r.cost) {
        logMessage(`Failed to redeem: Insufficient XP for ${r.name}.`, 'danger');
        showToast('Claim Failed', 'Insufficient XP balance.');
        return;
    }

    logMessage(`Exchanging points for marketplace item: ${r.name}...`, 'info');
    employeeXP -= r.cost;
    r.stock -= 1;

    // Unlock badge
    unlockBadge('redeemer');

    logMessage(`Successful transaction. Deducted ${r.cost} XP. Stock reduced.`, 'success');
    showToast('Reward Redeemed!', `Claimed: ${r.name}. -${r.cost} XP.`);
    updateDashboardVisuals();
}

// 5.5 Unlock Badge Method
function unlockBadge(badgeId) {
    let b = badges.find(x => x.id === badgeId);
    if (b && !b.unlocked) {
        b.unlocked = true;
        logMessage(`Accolade Acquired: Unlocked badge [${b.name}]`, 'success');
        showToast('Badge Unlocked!', `Accolade earned: ${b.name}`);
    }
}

// 5.6 Reset Dashboard State
function resetDashboard() {
    logMessage('Initiating hard-reset baseline database restore...', 'warn');
    
    departments = JSON.parse(JSON.stringify(BASE_DEPARTMENTS));
    rewards = JSON.parse(JSON.stringify(BASE_REWARDS));
    challenges = JSON.parse(JSON.stringify(BASE_CHALLENGES));
    badges = JSON.parse(JSON.stringify(BASE_BADGES));
    carbonData = [...BASE_CARBON_DATA];
    targetData = [...BASE_TARGET_DATA];

    employeeXP = 1250;
    activeFilter = 'All';
    fleetOptimized = false;
    auditsActioned = false;

    logMessage('Baseline parameters successfully restored.', 'success');
    showToast('Dashboard Reset', 'Dashboard visual states reverted to factory baselines.');
    updateDashboardVisuals();
}

// ==========================================================================
// 6. Navigation, Filtering & Utility Helpers
// ==========================================================================

// 6.1 Department Filter
function filterByDept(deptName) {
    if (activeFilter === deptName) {
        // Toggle filter off if clicked again
        activeFilter = 'All';
        logMessage('Clearing department scope focus. Restoring global view.', 'info');
        showToast('Scope Reset', 'Viewing corporate averages.');
    } else {
        activeFilter = deptName;
        logMessage(`Command focus shifted to department: ${deptName}`, 'info');
        showToast('Filtered View', `Scope changed to: ${deptName}`);
    }
    updateDashboardVisuals();
}

// 6.2 Routing Tab Handlers
function navigateTab(tabName) {
    // Remove active styling class from links
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    // Highlight selected side link
    let links = document.querySelectorAll('.nav-item');
    links.forEach(el => {
        let text = el.querySelector('span').innerText.toLowerCase();
        if (text.includes(tabName) || (tabName === 'dashboard' && text.includes('command'))) {
            el.classList.add('active');
        }
    });

    // Smooth scroll navigation to target section container
    let sectionId = tabName + '-section';
    let sectionEl = document.getElementById(sectionId);
    if (sectionEl) {
        sectionEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        logMessage(`Navigating screen view to section: ${tabName}`, 'info');
    }

    // Close mobile side menu if open
    let sidebar = document.getElementById('sidebarMenu');
    if (sidebar) sidebar.classList.remove('mobile-open');
}

function handleUrlRouting() {
    let hash = window.location.hash.replace('#', '') || 'dashboard';
    navigateTab(hash);
}

// 6.3 Mobile Sidebar Toggler
function toggleMobileSidebar() {
    let sidebar = document.getElementById('sidebarMenu');
    if (sidebar) {
        sidebar.classList.toggle('mobile-open');
    }
}

// 6.4 Terminal Logging Output Stream
function logMessage(text, type = 'success') {
    let consoleBox = document.getElementById('consoleLogs');
    if (!consoleBox) return;

    let time = new Date().toLocaleTimeString();
    let line = document.createElement('div');
    line.className = 'console-line';
    
    line.innerHTML = `
        <span class="timestamp">[${time}]</span>
        <span class="${type}">&gt; ${text}</span>
    `;

    consoleBox.appendChild(line);
    // Keep scrolled to bottom
    consoleBox.scrollTop = consoleBox.scrollHeight;
}

// 6.5 Floating Toast Widget Banner
function showToast(title, message) {
    let toast = document.getElementById('dashboardToast');
    if (!toast) return;

    document.getElementById('toastTitle').innerText = title;
    document.getElementById('toastMessage').innerText = message;

    // Cancel existing timers
    if (toastTimeout) {
        clearTimeout(toastTimeout);
    }

    toast.classList.add('active');

    // Auto dismiss after 3 seconds
    toastTimeout = setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

// ==========================================================================
// 7. Chart.js Data Visualisation Setup
// ==========================================================================

function initChart() {
    let canvas = document.getElementById('carbonAnalyticsChart');
    if (!canvas) return;

    let ctx = canvas.getContext('2d');
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Operational Emissions (tCO2e)',
                data: [...carbonData],
                borderColor: '#00E676',
                backgroundColor: 'rgba(0, 230, 118, 0.04)',
                borderWidth: 3,
                fill: true,
                tension: 0.35,
                pointBackgroundColor: '#00E676',
                pointHoverRadius: 6
            }, {
                label: 'Reduction Target Limit',
                data: [...targetData],
                borderColor: '#FF1744',
                borderDash: [6, 6],
                borderWidth: 2,
                fill: false,
                tension: 0,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#FFFFFF',
                        font: {
                            family: "'Outfit', sans-serif",
                            size: 12
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        borderColor: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#D4D4D8',
                        font: {
                            family: "'Outfit', sans-serif"
                        }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        borderColor: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#D4D4D8',
                        font: {
                            family: "'Outfit', sans-serif"
                        }
                    }
                }
            }
        }
    });
}

function updateChartData() {
    if (!chartInstance) return;

    if (activeFilter === 'All') {
        chartInstance.data.datasets[0].data = [...carbonData];
        chartInstance.data.datasets[1].data = [...targetData];
    } else {
        let dept = departments.find(d => d.name === activeFilter);
        if (dept) {
            let totalCarbon = departments.reduce((acc, d) => acc + d.carbon, 0);
            let totalTarget = departments.reduce((acc, d) => acc + d.target, 0);

            // Compute scaling ratios to show monthly department fraction contribution
            let carbonRatio = dept.carbon / (totalCarbon || 1);
            let targetRatio = dept.target / (totalTarget || 1);

            // Rescale trend lines for the single department
            chartInstance.data.datasets[0].data = carbonData.map(v => Math.round(v * carbonRatio * 8.5));
            chartInstance.data.datasets[1].data = targetData.map(v => Math.round(v * targetRatio * 8.5));
        }
    }
    
    chartInstance.update();
}
