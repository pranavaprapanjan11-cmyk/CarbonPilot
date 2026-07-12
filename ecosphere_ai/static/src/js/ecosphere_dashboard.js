/** @odoo-module **/

import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";

const { Component, onWillStart, onMounted, useState, xml } = owl;

class EcoSphereDashboard extends Component {
    setup() {
        this.rpc = useService("rpc");
        this.state = useState({
            esgScore: 78,
            eScore: 84,
            sScore: 72,
            gScore: 78,
            totalEmissions: 1845.2,
            goalProgress: 68,
            complianceOpen: 8,
            complianceResolved: 42,
            departments: [],
            aiInsights: [],
            employees: [],
            badges: [],
            rewards: []
        });

        onWillStart(async () => {
            // Secure Chart.js dynamic load inside Odoo Client
            await this._loadChartJS();
            await this._fetchData();
        });

        onMounted(() => {
            this._renderCharts();
        });
    }

    async _loadChartJS() {
        if (typeof Chart !== 'undefined') return;
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = () => {
                console.log("EcoSphere AI: Chart.js dynamically loaded.");
                resolve();
            };
            script.onerror = () => {
                console.warn("EcoSphere AI: Failed to load Chart.js from CDN.");
                resolve();
            };
            document.head.appendChild(script);
        });
    }

    async _fetchData() {
        try {
            // 1. Fetch Department scores
            const depts = await this.rpc({
                model: 'hr.department',
                method: 'search_read',
                fields: ['name', 'esg_score', 'environmental_score', 'social_score', 'governance_score', 'current_carbon', 'target_carbon'],
                limit: 10
            });

            if (depts && depts.length > 0) {
                this.state.departments = depts;
                const totalEsg = depts.reduce((acc, d) => acc + d.esg_score, 0);
                const totalE = depts.reduce((acc, d) => acc + d.environmental_score, 0);
                const totalS = depts.reduce((acc, d) => acc + d.social_score, 0);
                const totalG = depts.reduce((acc, d) => acc + d.governance_score, 0);
                const totalCarbon = depts.reduce((acc, d) => acc + d.current_carbon, 0);

                this.state.esgScore = Math.round(totalEsg / depts.length);
                this.state.eScore = Math.round(totalE / depts.length);
                this.state.sScore = Math.round(totalS / depts.length);
                this.state.gScore = Math.round(totalG / depts.length);
                this.state.totalEmissions = parseFloat(totalCarbon.toFixed(1));
            }

            // 2. Fetch AI Insights
            const insights = await this.rpc({
                model: 'ecosphere.ai.insight',
                method: 'search_read',
                fields: ['category', 'text_insight', 'impact_reduction_pct'],
                limit: 4
            });
            if (insights && insights.length > 0) {
                this.state.aiInsights = insights;
            } else {
                this.state.aiInsights = [
                    { category: 'environmental', text_insight: 'Department Finance is exceeding carbon targets. Switch 30% fleet vehicles to EVs.', impact_reduction_pct: 18.0 },
                    { category: 'social', text_insight: 'Employee CSR volunteer hours dropped by 12%. Schedule a green initiative campaign.', impact_reduction_pct: 5.0 }
                ];
            }

            // 3. Fetch Top Employees (XP leaderboard)
            const emps = await this.rpc({
                model: 'hr.employee',
                method: 'search_read',
                fields: ['name', 'xp_points', 'sustainability_score', 'carbon_footprint'],
                domain: [['xp_points', '>', 0]],
                order: 'xp_points desc',
                limit: 5
            });
            if (emps && emps.length > 0) {
                this.state.employees = emps;
            }

            // 4. Fetch Compliance details
            const issues = await this.rpc({
                model: 'ecosphere.compliance.issue',
                method: 'search_read',
                fields: ['status']
            });
            if (issues && issues.length > 0) {
                this.state.complianceOpen = issues.filter(i => i.status === 'open' || i.status === 'overdue').length;
                this.state.complianceResolved = issues.filter(i => i.status === 'resolved').length;
            }
        } catch (err) {
            console.error("EcoSphere AI: Failed to load backend Odoo data. Falling back to default states.", err);
            this.state.departments = [
                { name: 'Product Engineering', esg_score: 92, current_carbon: 320, target_carbon: 400 },
                { name: 'Global Logistics', esg_score: 54, current_carbon: 480, target_carbon: 350 },
                { name: 'IT Infrastructure', esg_score: 84, current_carbon: 290, target_carbon: 300 },
                { name: 'Sales & Marketing', esg_score: 76, current_carbon: 110, target_carbon: 150 }
            ];
            this.state.employees = [
                { name: 'Olivia Smith', xp_points: 2450 },
                { name: 'Liam Wilson', xp_points: 2100 },
                { name: 'Emma Garcia', xp_points: 1850 }
            ];
        }
    }

    _renderCharts() {
        const ctxLine = document.getElementById('ecosphereCarbonChart');
        if (ctxLine && typeof Chart !== 'undefined') {
            new Chart(ctxLine, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    datasets: [{
                        label: 'Operational Emissions (tCO2e)',
                        data: [195, 182, 170, 165, 155, 142, 138, 140, 132, 125, 118, 110],
                        borderColor: '#00C853',
                        backgroundColor: 'rgba(0, 200, 83, 0.05)',
                        fill: true,
                        tension: 0.4
                    }, {
                        label: 'Reduction Target Limit',
                        data: [170, 165, 160, 155, 150, 145, 140, 135, 130, 125, 120, 115],
                        borderColor: '#FF3366',
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { labels: { color: '#CBD5E1' } }
                    },
                    scales: {
                        x: { grid: { color: 'rgba(255, 255, 255, 0.04)' }, ticks: { color: '#CBD5E1' } },
                        y: { grid: { color: 'rgba(255, 255, 255, 0.04)' }, ticks: { color: '#CBD5E1' } }
                    }
                }
            });
        }
    }
}

EcoSphereDashboard.template = xml`
<div class="ecosphere-dash-wrapper">
    <!-- HEADER -->
    <div class="ecosphere-header">
        <div class="ecosphere-brand">
            <h1><i class="fa fa-globe"></i> EcoSphere AI</h1>
            <p>ESG Digital Twin Command Center</p>
        </div>
        <div style="font-size: 13px; color: var(--text-secondary);">
            Standard compliance: GHG Protocol / ISO 14001
        </div>
    </div>

    <!-- CORE METRICS (GLASS CARDS GRID) -->
    <div class="dashboard-grid">
        <div class="eco-card">
            <div class="card-title">Overall ESG Rating <i class="fa fa-shield"></i></div>
            <div class="score-circle-wrapper">
                <div class="score-container">
                    <svg class="score-svg">
                        <circle class="score-circle-bg" cx="60" cy="60" r="50" fill="none"></circle>
                        <circle class="score-circle-val color-esg" cx="60" cy="60" r="50" fill="none" stroke-dasharray="314.16" stroke-dashoffset="69"></circle>
                    </svg>
                    <div class="score-text"><t t-esc="state.esgScore"/></div>
                    <div class="score-label">ESG Rollup</div>
                </div>
            </div>
        </div>

        <div class="eco-card">
            <div class="card-title">Environmental Pillar <i class="fa fa-leaf"></i></div>
            <div class="score-circle-wrapper">
                <div class="score-container">
                    <svg class="score-svg">
                        <circle class="score-circle-bg" cx="60" cy="60" r="50" fill="none"></circle>
                        <circle class="score-circle-val color-e" cx="60" cy="60" r="50" fill="none" stroke-dasharray="314.16" stroke-dashoffset="50"></circle>
                    </svg>
                    <div class="score-text"><t t-esc="state.eScore"/></div>
                    <div class="score-label">E Score (40%)</div>
                </div>
            </div>
        </div>

        <div class="eco-card">
            <div class="card-title">Social Engagements <i class="fa fa-users"></i></div>
            <div class="score-circle-wrapper">
                <div class="score-container">
                    <svg class="score-svg">
                        <circle class="score-circle-bg" cx="60" cy="60" r="50" fill="none"></circle>
                        <circle class="score-circle-val color-s" cx="60" cy="60" r="50" fill="none" stroke-dasharray="314.16" stroke-dashoffset="87"></circle>
                    </svg>
                    <div class="score-text"><t t-esc="state.sScore"/></div>
                    <div class="score-label">S Score (30%)</div>
                </div>
            </div>
        </div>

        <div class="eco-card">
            <div class="card-title">Governance Audits <i class="fa fa-gavel"></i></div>
            <div class="score-circle-wrapper">
                <div class="score-container">
                    <svg class="score-svg">
                        <circle class="score-circle-bg" cx="60" cy="60" r="50" fill="none"></circle>
                        <circle class="score-circle-val color-g" cx="60" cy="60" r="50" fill="none" stroke-dasharray="314.16" stroke-dashoffset="69"></circle>
                    </svg>
                    <div class="score-text"><t t-esc="state.gScore"/></div>
                    <div class="score-label">G Score (30%)</div>
                </div>
            </div>
        </div>
    </div>

    <!-- MAIN ROW -->
    <div class="dashboard-hero-row">
        <!-- LINE CHART GRAPH -->
        <div class="eco-card">
            <div class="card-title">Carbon Emission Trend (tCO2e) <i class="fa fa-line-chart"></i></div>
            <div style="position: relative; height: 320px; width: 100%;">
                <canvas id="ecosphereCarbonChart"></canvas>
            </div>
        </div>

        <!-- DEPARTMENT ESG RANKINGS -->
        <div class="eco-card">
            <div class="card-title">Top Performing Departments <i class="fa fa-trophy"></i></div>
            <div class="ranking-list">
                <t t-foreach="state.departments" t-as="dept" t-key="dept.name">
                    <div class="ranking-item">
                        <div class="ranking-name-box">
                            <span class="rank-badge rank-other"><t t-esc="dept_index + 1"/></span>
                            <span style="font-size: 13px;"><t t-esc="dept.name"/></span>
                        </div>
                        <strong class="ranking-score" style="color: var(--secondary) !important;"><t t-esc="dept.esg_score"/> pts</strong>
                    </div>
                </t>
            </div>
        </div>
    </div>

    <!-- DETAILED METRICS -->
    <div class="dashboard-details-row">
        <!-- AI ADVISOR INSIGHTS -->
        <div class="eco-card">
            <div class="card-title">AI Advisor Insights <i class="fa fa-lightbulb-o"></i></div>
            <div class="ai-cards-container">
                <t t-foreach="state.aiInsights" t-as="insight" t-key="insight.text_insight">
                    <div class="ai-card">
                        <div class="ai-meta">
                            <span><t t-esc="insight.category"/></span>
                            <strong class="text-success" style="color: var(--primary) !important;"><t t-esc="insight.impact_reduction_pct"/>% Impact</strong>
                        </div>
                        <div class="ai-text"><t t-esc="insight.text_insight"/></div>
                    </div>
                </t>
            </div>
        </div>

        <!-- CARBON HEAT MAP -->
        <div class="eco-card">
            <div class="card-title">Carbon Concentration Map <i class="fa fa-th"></i></div>
            <div class="heatmap-container">
                <t t-foreach="state.departments" t-as="d" t-key="d.name + '_heat'">
                    <div t-attf-class="heatmap-cell {{ d.current_carbon &gt; d.target_carbon ? 'cell-high' : (d.current_carbon &gt; (d.target_carbon * 0.8) ? 'cell-medium' : 'cell-low') }}">
                        <strong style="display:block; color: inherit !important;"><t t-esc="d.name"/></strong>
                        <span style="color: inherit;"><t t-esc="d.current_carbon"/> t</span>
                    </div>
                </t>
            </div>
        </div>

        <!-- GAMIFICATION LEADERBOARD -->
        <div class="eco-card">
            <div class="card-title">Eco Leaderboard <i class="fa fa-star"></i></div>
            <div class="ranking-list">
                <t t-foreach="state.employees" t-as="emp" t-key="emp.name">
                    <div class="ranking-item">
                        <div class="ranking-name-box">
                            <span t-attf-class="rank-badge {{ emp_index == 0 ? 'rank-1' : (emp_index == 1 ? 'rank-2' : 'rank-other') }}">
                                <t t-esc="emp_index + 1"/>
                            </span>
                            <span style="font-size: 13px;"><t t-esc="emp.name"/></span>
                        </div>
                        <strong class="ranking-score text-success" style="color: var(--primary) !important;"><t t-esc="emp.xp_points"/> XP</strong>
                    </div>
                </t>
            </div>
        </div>
    </div>
</div>
`;

registry.category("actions").add("ecosphere_dashboard_client_action", EcoSphereDashboard);
export { EcoSphereDashboard };
