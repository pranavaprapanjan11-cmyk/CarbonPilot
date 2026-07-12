import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { authService, dashboardService } from "../services/api";

// Register ChartJS elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Dashboard({ onLogout }) {
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [user, setUser] = useState(null);
  
  // Dashboard state rolled up from backend
  const [esgState, setEsgState] = useState({
    esg: 78,
    env: 82,
    soc: 71,
    gov: 78,
    ytd_emissions: 1845.2,
    xp: 1250,
    departments: [],
    carbon_data: [],
    challenges: [],
    rewards: [],
    insights: [],
    joined_challenges: []
  });

  // Toasts
  const [toast, setToast] = useState({ show: false, title: "", message: "" });
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const me = await authService.getMe();
      setUser(me);
      
      const dashboard = await dashboardService.getState();
      setEsgState(dashboard);
    } catch (err) {
      showToast("Error loading data", err.response?.data?.detail || "Could not retrieve state");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (title, message) => {
    setToast({ show: true, title, message });
    setTimeout(() => setToast({ show: false, title: "", message: "" }), 3000);
  };

  const handleLogout = () => {
    authService.logout();
    onLogout();
    navigate("/login");
  };

  // 1. Run Carbon Simulation
  const handleSimulation = async () => {
    try {
      showToast("Running simulation", "Processing carbon ledger fluctuations...");
      await dashboardService.runSimulation();
      
      // Reload fresh database state
      const dashboard = await dashboardService.getState();
      setEsgState(dashboard);
      showToast("Simulation Complete", "Corporate carbon logs processed successfully.");
    } catch (err) {
      showToast("Simulation failed", err.response?.data?.detail || "Calculation crash");
    }
  };

  // 2. Optimize AI Insights
  const handleAIOptimization = async (type) => {
    try {
      await dashboardService.applyAI(type);
      const dashboard = await dashboardService.getState();
      setEsgState(dashboard);
      showToast("Optimization Implemented!", "Calculations and department scores refreshed.");
    } catch (err) {
      showToast("Action failed", err.response?.data?.detail || "Database lock");
    }
  };

  // 3. Join Challenge
  const handleJoinChallenge = async (id) => {
    try {
      await dashboardService.joinChallenge(id);
      const dashboard = await dashboardService.getState();
      setEsgState(dashboard);
      showToast("Challenge Enlisted", "+150 XP awarded. Social parameters increased.");
    } catch (err) {
      showToast("Join failed", err.response?.data?.detail || "Enrollment block");
    }
  };

  // 4. Redeem Marketplace Rewards
  const handleRedeemReward = async (id) => {
    try {
      const res = await dashboardService.redeemReward(id);
      const dashboard = await dashboardService.getState();
      setEsgState(dashboard);
      showToast("Redemption Confirmed!", res.message);
    } catch (err) {
      showToast("Redeem failed", err.response?.data?.detail || "Insufficient XP or Stock");
    }
  };

  // 5. Hard Reset dashboard
  const handleReset = async () => {
    try {
      showToast("Resetting database", "Restoring all parameters to baseline defaults...");
      await dashboardService.resetState();
      const dashboard = await dashboardService.getState();
      setEsgState(dashboard);
      setActiveFilter("All");
      showToast("Dashboard Reset", "All ESG parameters and states restored to baseline.");
    } catch (err) {
      showToast("Reset failed", err.response?.data?.detail || "DB transaction error");
    }
  };

  // 6. Highlight Filter Toggles
  const handleFilterDept = (name) => {
    if (activeFilter === name) {
      setActiveFilter("All");
      showToast("Filter Restored", "Displaying company-wide averages.");
    } else {
      setActiveFilter(name);
      showToast("Filtered View", `Detailed ESG metrics loaded for: ${name}`);
    }
  };

  const handleDownloadReport = async () => {
    try {
      const data = await dashboardService.getAuditReport();
      const jsonStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
      const dlAnchor = document.createElement('a');
      dlAnchor.setAttribute("href", jsonStr);
      dlAnchor.setAttribute("download", "ecosphere_esg_audit.json");
      document.body.appendChild(dlAnchor);
      dlAnchor.click();
      dlAnchor.remove();
      showToast("Report Exported", "ESG audit JSON file downloaded successfully.");
    } catch (err) {
      showToast("Download failed", "Could not fetch JSON summary report.");
    }
  };

  // Calculate values according to filters
  const getFilteredMetrics = () => {
    const { env, soc, gov, esg, ytd_emissions, departments } = esgState;
    if (activeFilter === "All") {
      return { env, soc, gov, esg, ytd: ytd_emissions };
    }
    const dept = departments.find(d => d.name === activeFilter);
    if (!dept) {
      return { env, soc, gov, esg, ytd: ytd_emissions };
    }
    return {
      env: dept.env,
      soc: dept.soc,
      gov: dept.gov,
      esg: dept.esg,
      ytd: dept.carbon
    };
  };

  const metrics = getFilteredMetrics();

  // Map Chart.js datasets
  const getChartData = () => {
    const months = esgState.carbon_data.map(c => c.month);
    let emissions = esgState.carbon_data.map(c => c.emissions);
    let targets = esgState.carbon_data.map(c => c.target);

    if (activeFilter !== "All") {
      const dept = esgState.departments.find(d => d.name === activeFilter);
      if (dept) {
        const totalEmissions = esgState.departments.reduce((acc, d) => acc + d.carbon, 0);
        const totalTarget = esgState.departments.reduce((acc, d) => acc + d.target, 0);
        
        const carbonRatio = dept.carbon / (totalEmissions || 1);
        const targetRatio = dept.target / (totalTarget || 1);

        emissions = emissions.map(v => Math.round(v * carbonRatio * 8.5));
        targets = targets.map(v => Math.round(v * targetRatio * 8.5));
      }
    }

    return {
      labels: months.length > 0 ? months : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      datasets: [
        {
          label: "Operational Emissions (tCO2e)",
          data: emissions,
          borderColor: "#00C853",
          backgroundColor: "rgba(0, 200, 83, 0.05)",
          fill: true,
          tension: 0.4
        },
        {
          label: "Reduction Target Limit",
          data: targets,
          borderColor: "#FF3366",
          borderDash: [5, 5],
          fill: false,
          tension: 0
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: "#FFFFFF", font: { family: "Inter" } } },
      tooltip: {
        backgroundColor: "rgba(10, 10, 10, 0.95)",
        titleColor: "#FFFFFF",
        bodyColor: "#FFFFFF",
        borderColor: "rgba(255, 255, 255, 0.08)",
        borderWidth: 1
      }
    },
    scales: {
      x: { grid: { color: "rgba(255, 255, 255, 0.05)" }, ticks: { color: "#FFFFFF" } },
      y: { grid: { color: "rgba(255, 255, 255, 0.05)" }, ticks: { color: "#FFFFFF" } }
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-black flex justify-center items-center">
        <div className="text-center">
          <i className="fa fa-circle-o-notch animate-spin text-4xl text-secondaryCyan mb-4"></i>
          <p className="text-textSecondary text-sm font-semibold tracking-wider uppercase">Loading Command Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-black text-white p-6 relative overflow-hidden font-sans">
      <div className="absolute top-[-30%] left-[-20%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,rgba(0,200,83,0.04)_0%,rgba(0,0,0,0)_60%)] pointer-events-none" />

      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/8 pb-5 mb-8 gap-4 z-10 relative">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3 bg-gradient-to-r from-secondaryCyan to-primaryGreen bg-clip-text text-transparent">
            <i className="fa fa-globe text-secondaryCyan"></i> EcoSphere AI
          </h1>
          <p className="text-textSecondary text-sm mt-1">
            ESG Digital Twin Command Center &amp; Sustainability Advisor
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <span className="bg-secondaryCyan/10 border border-secondaryCyan rounded-full px-4 py-1.5 text-xs text-secondaryCyan font-semibold flex items-center gap-2">
            <i className="fa fa-filter"></i> Scope: {activeFilter === "All" ? "All Departments" : activeFilter}
          </span>
          <button
            onClick={handleSimulation}
            className="interactive-btn bg-gradient-to-r from-green-800 to-primaryGreen hover:opacity-90 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-2 shadow-md transition-all"
            style={{ background: "linear-gradient(135deg, #2E7D32 0%, #00C853 100%)" }}
          >
            <i className="fa fa-play"></i> Run Carbon Simulation
          </button>
          <button
            onClick={handleReset}
            className="bg-white/5 border border-white/8 hover:bg-white/10 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-2 transition-all"
          >
            <i className="fa fa-refresh"></i> Reset View
          </button>
          <button
            onClick={handleLogout}
            className="bg-dangerRed/10 border border-dangerRed/30 hover:bg-dangerRed/20 text-dangerRed font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-2 transition-all ml-auto md:ml-0"
          >
            <i className="fa fa-sign-out"></i> Logout
          </button>
        </div>
      </header>

      {/* METRICS RADIAL PROGRESS GAUGE GRID */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 z-10 relative">
        {[
          { label: "Overall ESG Score", val: metrics.esg, color: "stroke-secondaryCyan shadow-[0_0_10px_rgba(0,229,255,0.2)]", icon: "shield" },
          { label: "Environmental Score", val: metrics.env, color: "stroke-primaryGreen shadow-[0_0_10px_rgba(0,200,83,0.2)]", icon: "leaf" },
          { label: "Social Score", val: metrics.soc, color: "stroke-warningOrange shadow-[0_0_10px_rgba(255,159,67,0.2)]", icon: "users" },
          { label: "Governance Score", val: metrics.gov, color: "stroke-purple-400 shadow-[0_0_10px_rgba(167,139,250,0.2)]", icon: "gavel" }
        ].map((item, idx) => (
          <div key={idx} className="bg-cardBg border border-white/8 backdrop-blur-xl rounded-2xl p-6 shadow-card hover:border-secondaryCyan/20 transition-all duration-300 relative group overflow-hidden">
            <div className="absolute inset-0 border border-secondaryCyan/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-500 shadow-glow" />
            <div className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-5 flex justify-between items-center">
              {item.label} <i className={`fa fa-${item.icon} text-secondaryCyan`}></i>
            </div>
            <div className="flex justify-center items-center">
              <div className="relative w-[120px] h-[120px]">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="50" className="fill-none stroke-white/5" strokeWidth="8"></circle>
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    className={`fill-none stroke-[8] stroke-linecap-round transition-all duration-1000 ${item.color.split(" ")[0]}`}
                    strokeDasharray="314.16"
                    strokeDashoffset={314.16 - (314.16 * item.val) / 100}
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col justify-center items-center">
                  <span className="text-2xl font-bold text-white">{item.val}</span>
                  <span className="text-[10px] text-textMuted font-medium uppercase mt-0.5">rating</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* HERO CHART & RANKING */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 z-10 relative">
        <div className="lg:col-span-2 bg-cardBg border border-white/8 backdrop-blur-xl rounded-2xl p-6 shadow-card hover:border-secondaryCyan/20 transition-all duration-300 relative">
          <div className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-6 flex justify-between items-center">
            <span>Carbon Emissions Trend &amp; Target Limits</span>
            <span className="text-xs text-textMuted lowercase font-normal">
              Total YTD: <strong className="text-primaryGreen text-sm font-semibold">{metrics.ytd.toLocaleString()} tCO2e</strong>
            </span>
          </div>
          <div className="h-[320px]">
            <Line data={getChartData()} options={chartOptions} />
          </div>
        </div>

        {/* DEPARTMENT RANKINGS */}
        <div className="bg-cardBg border border-white/8 backdrop-blur-xl rounded-2xl p-6 shadow-card hover:border-secondaryCyan/20 transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-6 flex justify-between items-center">
              Department Leaderboard <i className="fa fa-trophy text-secondaryCyan"></i>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1">
              {[...esgState.departments]
                .sort((a, b) => b.esg - a.esg)
                .map((d, index) => {
                  let badgeStyle = "bg-white/10 text-white";
                  if (index === 0) badgeStyle = "bg-gradient-to-r from-yellow-500 to-amber-600 text-black";
                  else if (index === 1) badgeStyle = "bg-slate-400 text-black";
                  else if (index === 2) badgeStyle = "bg-amber-800 text-white";

                  const isSelected = d.name === activeFilter;

                  return (
                    <div
                      key={d.id}
                      onClick={() => handleFilterDept(d.name)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-secondaryCyan bg-secondaryCyan/10 shadow-glow"
                          : "border-white/4 bg-white/2 hover:bg-white/4 hover:border-white/8"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${badgeStyle}`}>
                          {index + 1}
                        </span>
                        <span className="text-xs font-medium text-textSecondary">{d.name}</span>
                      </div>
                      <span className="text-xs font-bold text-secondaryCyan">{d.esg} pts</span>
                    </div>
                  );
                })}
            </div>
          </div>
          <button 
            onClick={handleDownloadReport}
            className="w-full mt-4 bg-white/5 border border-white/8 hover:bg-white/10 text-white font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
          >
            <i className="fa fa-file-text-o"></i> Download Annual Audit Summary
          </button>
        </div>
      </section>

      {/* DETAIL WIDGETS (AI ADVISOR, HEATMAP, REWARDS) */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 z-10 relative">
        
        {/* AI ADVISOR */}
        <div className="bg-cardBg border border-white/8 backdrop-blur-xl rounded-2xl p-6 shadow-card hover:border-secondaryCyan/20 transition-all duration-300">
          <div className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-6 flex justify-between items-center">
            AI Sustainability Advisor <i className="fa fa-lightbulb-o text-secondaryCyan"></i>
          </div>
          <div className="space-y-4">
            {esgState.insights.map((insight) => (
              <div
                key={insight.id}
                className={`border border-white/6 rounded-xl p-4 bg-black/40 transition-all duration-300 ${
                  insight.is_applied ? "opacity-50" : ""
                }`}
              >
                <div className="flex justify-between items-center text-[10px] font-bold text-secondaryCyan uppercase mb-2">
                  <span>{insight.category}</span>
                  <span className="text-primaryGreen">{insight.impact}</span>
                </div>
                <p className="text-xs text-textSecondary leading-relaxed mb-3">{insight.text}</p>
                <div className="text-right">
                  <button
                    onClick={() => handleAIOptimization(insight.type)}
                    disabled={insight.is_applied}
                    className={`text-xs font-bold py-1.5 px-3 rounded-lg transition-all ${
                      insight.is_applied
                        ? "bg-white/5 text-textMuted border border-white/4 cursor-not-allowed"
                        : "bg-gradient-to-r from-green-800 to-primaryGreen text-white hover:opacity-90 shadow-md"
                    }`}
                  >
                    {insight.is_applied ? "Implemented" : insight.type === "fleet" ? "Optimize Fleet" : "Action Audits"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CARBON HEATMAP */}
        <div className="bg-cardBg border border-white/8 backdrop-blur-xl rounded-2xl p-6 shadow-card hover:border-secondaryCyan/20 transition-all duration-300">
          <div className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-6 flex justify-between items-center">
            Carbon Concentration Map <i className="fa fa-th text-secondaryCyan"></i>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {esgState.departments.map((d) => {
              let cellClass = "background-low border-green-500/20 text-emerald-100 bg-emerald-500/10";
              if (d.carbon > d.target) {
                cellClass = "background-high border-rose-500/20 text-rose-100 bg-rose-500/10";
              } else if (d.carbon > d.target * 0.8) {
                cellClass = "background-medium border-amber-500/20 text-amber-100 bg-amber-500/10";
              }
              const isSelected = d.name === activeFilter;

              return (
                <div
                  key={d.id}
                  onClick={() => handleFilterDept(d.name)}
                  className={`border rounded-xl p-3 text-center cursor-pointer transition-all ${cellClass} ${
                    isSelected ? "outline outline-2 outline-secondaryCyan outline-offset-[-2px] shadow-glow" : ""
                  }`}
                >
                  <strong className="block text-[11px] font-semibold truncate text-white">{d.name}</strong>
                  <span className="text-[10px] opacity-90 block mt-1">{d.carbon} t</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* REWARDS MARKETPLACE */}
        <div className="bg-cardBg border border-white/8 backdrop-blur-xl rounded-2xl p-6 shadow-card hover:border-secondaryCyan/20 transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-6 flex justify-between items-center">
              <span>Gamification &amp; Rewards Shop</span>
              <span className="text-xs text-textMuted font-normal normal-case">
                Balance: <strong className="text-secondaryCyan font-semibold">{esgState.xp} XP</strong>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {esgState.rewards.map((r) => {
                const canAfford = esgState.xp >= r.cost;
                const hasStock = r.stock > 0;

                return (
                  <div
                    key={r.id}
                    className="border border-white/6 bg-white/2 rounded-xl p-3 flex flex-col justify-between h-[120px] transition-all hover:bg-white/4 hover:border-white/10"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white truncate">{r.name}</div>
                      <div className="text-[11px] text-secondaryCyan font-bold mt-1">{r.cost} XP</div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[10px] text-textMuted">Stock: {r.stock}</span>
                      <button
                        onClick={() => handleRedeemReward(r.id)}
                        disabled={!canAfford || !hasStock}
                        className={`text-[9px] font-bold py-1 px-2.5 rounded-md transition-all ${
                          !hasStock
                            ? "bg-white/5 text-textMuted border border-white/4 cursor-not-allowed"
                            : !canAfford
                            ? "bg-white/5 text-textMuted border border-white/4 cursor-not-allowed"
                            : "bg-gradient-to-r from-cyan-600 to-secondaryCyan text-black hover:opacity-90 shadow-sm"
                        }`}
                      >
                        {!hasStock ? "Sold Out" : "Claim"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CHALLENGES SLIDES */}
      <section className="bg-cardBg border border-white/8 backdrop-blur-xl rounded-2xl p-6 shadow-card hover:border-secondaryCyan/20 transition-all duration-300 mb-8 z-10 relative">
        <div className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-6 flex justify-between items-center">
          Active Environmental Challenges <i className="fa fa-calendar-check-o text-secondaryCyan"></i>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {esgState.challenges.map((c) => {
            const hasJoined = esgState.joined_challenges.includes(c.id);

            return (
              <div
                key={c.id}
                className="bg-white/2 border border-white/6 rounded-xl p-5 text-center flex flex-col justify-between items-center transition-all hover:bg-white/4"
              >
                <div className="text-3xl text-secondaryCyan mb-3">
                  <i className={`fa fa-${c.icon}`}></i>
                </div>
                <div className="text-sm font-bold text-white mb-1">{c.title}</div>
                <div className="text-[11px] text-textMuted mb-4">{c.description}</div>
                <button
                  onClick={() => handleJoinChallenge(c.id)}
                  disabled={hasJoined}
                  className={`w-full max-w-[160px] font-bold py-2 rounded-xl text-xs transition-all ${
                    hasJoined
                      ? "bg-white/5 border border-white/8 text-textMuted cursor-not-allowed"
                      : "bg-gradient-to-r from-cyan-600 to-secondaryCyan text-black hover:opacity-90 shadow-md"
                  }`}
                >
                  {hasJoined ? "Enrolled" : "Join Challenge"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 bg-cardBg border border-white/8 border-l-4 border-l-primaryGreen p-4 rounded-xl shadow-2xl flex items-center gap-4 z-50 max-w-sm"
          >
            <i className="fa fa-check-circle-o text-primaryGreen text-2xl" />
            <div>
              <strong className="block text-xs font-extrabold text-white uppercase tracking-wider">{toast.title}</strong>
              <span className="text-xs text-textSecondary mt-0.5 block">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
