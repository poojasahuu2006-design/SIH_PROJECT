import { useMemo } from "react";
import "./KpiDashboard.css";

export default function KpiDashboard({
  wells = [],
  alerts = [],
  onSelectWell,
  onSelectView,
}) {
  // Aggregate KPIs
  const kpis = useMemo(() => {
    const totalWells = wells.length || 10;
    const activeAlertsCount = alerts.length || 5;
    const criticalAlerts = alerts.filter((a) => a.severity === "critical").length;
    const highAlerts = alerts.filter((a) => a.severity === "high").length;

    // Field overall risk index (0 to 100)
    const fieldRiskIndex = Math.min(
      95,
      Math.round(criticalAlerts * 25 + highAlerts * 15 + activeAlertsCount * 4)
    );

    return {
      totalWells,
      drillingWells: Math.ceil(totalWells * 0.6),
      activeAlertsCount,
      criticalAlerts,
      highAlerts,
      fieldRiskIndex,
      nptSavingsHrs: 48.5,
      avgFieldRop: 19.2,
      mudLossTotalM3: 4.6,
    };
  }, [wells, alerts]);

  // Risk matrix mapping: Likelihood (Low, Med, High) x Impact (Minor, Major, Severe)
  const riskMatrixData = useMemo(() => {
    return [
      { name: "W001 (Offset-01)", type: "Mud Loss", likelihood: "High", impact: "Severe", score: 88, depth: 3410 },
      { name: "W002 (Offset-02)", type: "Gas Kick", likelihood: "High", impact: "Severe", score: 92, depth: 3890 },
      { name: "W003 (Offset-03)", type: "Stuck Pipe", likelihood: "Med", impact: "Major", score: 74, depth: 2750 },
      { name: "W004 (Offset-04)", type: "Torque Spike", likelihood: "Med", impact: "Minor", score: 58, depth: 2180 },
      { name: "W005 (Offset-05)", type: "Wellbore Instability", likelihood: "Low", impact: "Minor", score: 32, depth: 1650 },
    ];
  }, []);

  return (
    <div className="kpi-dashboard">
      <header className="kpi-dashboard__header">
        <div>
          <span className="eyebrow">Executive Operations Module</span>
          <h2>Field Executive Risk Dashboard & Operational KPIs</h2>
          <p className="sub-text">
            High-level overview of field risk profile, anomaly indicators, and performance metrics.
          </p>
        </div>

        <div className="field-risk-gauge-box">
          <div className="gauge-circle">
            <span className="gauge-num mono">{kpis.fieldRiskIndex}%</span>
            <span className="gauge-sub">Risk Index</span>
          </div>
          <div className="gauge-text">
            <span className="gauge-status">
              {kpis.fieldRiskIndex > 70
                ? "HIGH FIELD RISK ELEVATION"
                : kpis.fieldRiskIndex > 40
                ? "MODERATE DRILLING RISK"
                : "NORMAL OPERATIONS"}
            </span>
            <span className="gauge-desc">
              Calculated from active predictive alerts across {kpis.totalWells} monitored wellbores
            </span>
          </div>
        </div>
      </header>

      {/* Main Metric Cards */}
      <div className="kpi-metrics-grid">
        <div className="kpi-card card-accent-blue">
          <div className="card-top">
            <span className="card-title">Monitored Wells</span>
            <span className="card-icon">🛢️</span>
          </div>
          <div className="card-val mono">{kpis.totalWells}</div>
          <div className="card-foot">{kpis.drillingWells} currently active drilling</div>
        </div>

        <div className="kpi-card card-accent-red">
          <div className="card-top">
            <span className="card-title">Active Risk Alerts</span>
            <span className="card-icon">🚨</span>
          </div>
          <div className="card-val mono">{kpis.activeAlertsCount}</div>
          <div className="card-foot">
            <span className="text-red">{kpis.criticalAlerts} Critical</span> • {kpis.highAlerts} High
          </div>
        </div>

        <div className="kpi-card card-accent-teal">
          <div className="card-top">
            <span className="card-title">Fleet Avg ROP</span>
            <span className="card-icon">⚡</span>
          </div>
          <div className="card-val mono">{kpis.avgFieldRop} <span className="unit">m/hr</span></div>
          <div className="card-foot text-teal">+8.5% faster than offset baseline</div>
        </div>

        <div className="kpi-card card-accent-amber">
          <div className="card-top">
            <span className="card-title">Estimated NPT Saved</span>
            <span className="card-icon">⏱️</span>
          </div>
          <div className="card-val mono">{kpis.nptSavingsHrs} <span className="unit">hrs</span></div>
          <div className="card-foot">Via AI predictive alert mitigations</div>
        </div>
      </div>

      {/* Two Column Layout: Risk Matrix & High-Risk Wells Table */}
      <div className="kpi-grid-two-col">
        {/* Risk Matrix */}
        <div className="kpi-box">
          <div className="kpi-box-header">
            <h3>Drilling Risk Heatmap Matrix</h3>
            <span className="subtitle">Likelihood vs Severity classification</span>
          </div>

          <div className="risk-matrix-table">
            <div className="matrix-header">
              <span />
              <span>Minor Impact</span>
              <span>Major Impact</span>
              <span>Severe Impact</span>
            </div>
            <div className="matrix-row">
              <span className="row-label">High Likelihood</span>
              <div className="matrix-cell cell-med">W004 (Torque)</div>
              <div className="matrix-cell cell-high">--</div>
              <div className="matrix-cell cell-critical">W001 (Mud Loss) W002 (Kick)</div>
            </div>
            <div className="matrix-row">
              <span className="row-label">Med Likelihood</span>
              <div className="matrix-cell cell-low">--</div>
              <div className="matrix-cell cell-med">W003 (Stuck Pipe)</div>
              <div className="matrix-cell cell-high">--</div>
            </div>
            <div className="matrix-row">
              <span className="row-label">Low Likelihood</span>
              <div className="matrix-cell cell-low">W005 (Washout)</div>
              <div className="matrix-cell cell-low">--</div>
              <div className="matrix-cell cell-med">--</div>
            </div>
          </div>
        </div>

        {/* High Risk Wells Ranking */}
        <div className="kpi-box">
          <div className="kpi-box-header">
            <h3>Active High-Risk Well Rank</h3>
            <span className="subtitle">Prioritized by predictive risk score</span>
          </div>

          <div className="wells-rank-list">
            {riskMatrixData.map((item) => (
              <div
                key={item.name}
                className="well-rank-item"
                onClick={() => {
                  if (onSelectWell) onSelectWell(item.name.split(" ")[0]);
                  if (onSelectView) onSelectView("alerts");
                }}
              >
                <div className="rank-main">
                  <span className="well-rank-name">{item.name}</span>
                  <span className="well-rank-desc">
                    Risk: {item.type} @ {item.depth}m
                  </span>
                </div>
                <div className="rank-score-pill">
                  <span
                    className={`score-tag ${
                      item.score > 80
                        ? "is-critical"
                        : item.score > 60
                        ? "is-high"
                        : "is-med"
                    }`}
                  >
                    {item.score} / 100 Risk Score
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
