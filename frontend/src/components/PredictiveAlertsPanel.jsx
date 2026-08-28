import { useState, useMemo } from "react";
import "./PredictiveAlertsPanel.css";

export default function PredictiveAlertsPanel({
  alerts = [],
  loading = false,
  onSelectWell,
  onSelectView,
}) {
  const [filterType, setFilterType] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [acknowledgedIds, setAcknowledgedIds] = useState(new Set());

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const typeMatch = filterType === "all" || alert.type === filterType;
      const sevMatch = filterSeverity === "all" || alert.severity === filterSeverity;
      return typeMatch && sevMatch;
    });
  }, [alerts, filterType, filterSeverity]);

  const stats = useMemo(() => {
    const active = alerts.filter((a) => !acknowledgedIds.has(a.id));
    const critical = active.filter((a) => a.severity === "critical").length;
    const high = active.filter((a) => a.severity === "high").length;
    const avgConfidence =
      active.length > 0
        ? Math.round(active.reduce((acc, a) => acc + (a.confidence || 85), 0) / active.length)
        : 0;

    return { total: active.length, critical, high, avgConfidence };
  }, [alerts, acknowledgedIds]);

  const toggleAcknowledge = (id) => {
    setAcknowledgedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case "mud_loss":
        return "💧";
      case "kick":
        return "⚠️";
      case "stuck_pipe":
        return "🔒";
      case "npt":
        return "⏱️";
      case "well_control":
        return "🛑";
      case "formation_top":
        return "⛰️";
      case "torque_spike":
        return "⚡";
      case "wellbore_instability":
        return "🧱";
      default:
        return "🔔";
    }
  };

  const getSeverityBadge = (severity) => {
    const sev = String(severity || "low").toLowerCase();
    let badgeClass = "badge-low";
    if (sev === "critical") badgeClass = "badge-critical";
    else if (sev === "high") badgeClass = "badge-high";
    else if (sev === "medium") badgeClass = "badge-medium";

    return <span className={`severity-badge ${badgeClass}`}>{sev.toUpperCase()}</span>;
  };

  return (
    <div className="predictive-alerts">
      <header className="predictive-alerts__header">
        <div>
          <span className="eyebrow">AI Risk Model Live Predictions</span>
          <h2>Predictive Risk & Anomaly Alerts</h2>
          <p className="predictive-alerts__sub">
            Real-time display of predicted mud loss, kick influx, stuck pipe, NPT, and torque anomalies.
          </p>
        </div>

        <div className="predictive-alerts__kpis">
          <div className="alert-kpi-card kpi-critical">
            <span className="kpi-val">{stats.critical}</span>
            <span className="kpi-lbl">Critical Alerts</span>
          </div>
          <div className="alert-kpi-card kpi-high">
            <span className="kpi-val">{stats.high}</span>
            <span className="kpi-lbl">High Risks</span>
          </div>
          <div className="alert-kpi-card kpi-active">
            <span className="kpi-val">{stats.total}</span>
            <span className="kpi-lbl">Active Anomalies</span>
          </div>
          <div className="alert-kpi-card kpi-ai">
            <span className="kpi-val">{stats.avgConfidence}%</span>
            <span className="kpi-lbl">Avg AI Confidence</span>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="predictive-alerts__filters">
        <div className="filter-group">
          <label>Anomaly Type:</label>
          <div className="filter-pills">
            {["all", "npt", "kick", "mud_loss", "stuck_pipe", "well_control", "torque_spike"].map(
              (type) => (
                <button
                  key={type}
                  className={`filter-pill ${filterType === type ? "is-active" : ""}`}
                  onClick={() => setFilterType(type)}
                >
                  {type === "all" ? "All Types" : type.replace("_", " ").toUpperCase()}
                </button>
              )
            )}
          </div>
        </div>

        <div className="filter-group">
          <label>Severity:</label>
          <div className="filter-pills">
            {["all", "critical", "high", "medium", "low"].map((sev) => (
              <button
                key={sev}
                className={`filter-pill ${filterSeverity === sev ? "is-active" : ""}`}
                onClick={() => setFilterSeverity(sev)}
              >
                {sev.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts Content List */}
      {loading ? (
        <div className="predictive-alerts__loading">Loading predictive alert model stream...</div>
      ) : filteredAlerts.length === 0 ? (
        <div className="predictive-alerts__empty">
          <p>No predictive risk alerts matching current filters.</p>
        </div>
      ) : (
        <div className="predictive-alerts__grid">
          {filteredAlerts.map((alert) => {
            const isAck = acknowledgedIds.has(alert.id);
            return (
              <article
                key={alert.id}
                className={`alert-card alert-card--${alert.severity} ${
                  isAck ? "is-acknowledged" : ""
                }`}
                onClick={() => setSelectedAlert(alert)}
              >
                <div className="alert-card__top">
                  <span className="alert-card__icon">{getAlertIcon(alert.type)}</span>
                  <div className="alert-card__title-area">
                    <h3>{alert.title}</h3>
                    <div className="alert-card__meta">
                      <span className="mono">{alert.wellName || alert.wellId}</span>
                      <span>• Depth: {alert.depth}m</span>
                      <span>• {alert.formation}</span>
                    </div>
                  </div>
                  <div className="alert-card__badges">
                    {getSeverityBadge(alert.severity)}
                    <span className="confidence-badge">
                      🎯 {alert.confidence}% AI Confidence
                    </span>
                  </div>
                </div>

                <div className="alert-card__body">
                  <div className="alert-field">
                    <span className="field-lbl">Trigger Anomaly:</span>
                    <span className="field-val highlight-val">{alert.triggerCondition}</span>
                  </div>
                  <div className="alert-field">
                    <span className="field-lbl">Predicted Risk:</span>
                    <span className="field-val">{alert.predictedImpact}</span>
                  </div>
                  <div className="alert-field alert-field--mitigation">
                    <span className="field-lbl">Actionable Mitigation:</span>
                    <span className="field-val mitigation-text">
                      🛠️ {alert.mitigationAction}
                    </span>
                  </div>
                </div>

                <div className="alert-card__footer">
                  <span className="alert-card__time">Logged: {alert.timestamp}</span>
                  <div className="alert-card__actions" onClick={(e) => e.stopPropagation()}>
                    {onSelectWell && (
                      <button
                        className="btn-text-action"
                        onClick={() => {
                          onSelectWell(alert.wellId);
                          if (onSelectView) onSelectView("charts");
                        }}
                      >
                        📈 Inspect Charts
                      </button>
                    )}
                    <button
                      className={`btn-ack ${isAck ? "is-ack" : ""}`}
                      onClick={() => toggleAcknowledge(alert.id)}
                    >
                      {isAck ? "✓ Acknowledged" : "Acknowledge Alert"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal Detailed View */}
      {selectedAlert && (
        <div className="alert-modal-backdrop" onClick={() => setSelectedAlert(null)}>
          <div className="alert-modal" onClick={(e) => e.stopPropagation()}>
            <header className="alert-modal__header">
              <div>
                <span className="eyebrow">Anomaly Deep-Dive Inspector</span>
                <h2>{selectedAlert.title}</h2>
                <span className="mono">{selectedAlert.id}</span>
              </div>
              <button className="alert-modal__close" onClick={() => setSelectedAlert(null)}>
                ✕
              </button>
            </header>

            <div className="alert-modal__body">
              <div className="alert-modal__row">
                <div className="modal-stat">
                  <span className="stat-lbl">Target Well</span>
                  <span className="stat-val mono">{selectedAlert.wellName}</span>
                </div>
                <div className="modal-stat">
                  <span className="stat-lbl">Measured Depth</span>
                  <span className="stat-val">{selectedAlert.depth} meters</span>
                </div>
                <div className="modal-stat">
                  <span className="stat-lbl">Formation</span>
                  <span className="stat-val">{selectedAlert.formation}</span>
                </div>
                <div className="modal-stat">
                  <span className="stat-lbl">AI Model Confidence</span>
                  <span className="stat-val highlight">{selectedAlert.confidence}%</span>
                </div>
              </div>

              <div className="alert-modal__section">
                <h4>Telemetry Snapshot & Trigger Condition</h4>
                <p className="trigger-box">{selectedAlert.triggerCondition}</p>
                {selectedAlert.parameterSnapshots && (
                  <div className="snapshot-pills">
                    {Object.entries(selectedAlert.parameterSnapshots).map(([key, val]) => (
                      <div key={key} className="snapshot-pill">
                        <span className="snap-key">{key}:</span>
                        <span className="snap-val mono">{val}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="alert-modal__section">
                <h4>Root Cause Analysis & Impact</h4>
                <p className="impact-box">{selectedAlert.predictedImpact}</p>
              </div>

              {selectedAlert.reasons && selectedAlert.reasons.length > 0 && (
                <div className="alert-modal__section">
                  <h4>🤖 P1 Model Feature Influence & Explainability (amitmishra61724-oss/oildrill)</h4>
                  <ul className="reasons-list" style={{ background: "rgba(10, 20, 30, 0.6)", padding: "12px 16px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.1)", listStyle: "none" }}>
                    {selectedAlert.reasons.map((reason, rIdx) => (
                      <li key={rIdx} style={{ color: "#d2d8e0", fontSize: "0.85rem", marginBottom: "6px", display: "flex", gap: "8px" }}>
                        <span style={{ color: "#f2a93b" }}>⚡</span> {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedAlert.probabilities && (
                <div className="alert-modal__section">
                  <h4>📊 Risk Category Breakdown (P1 Multi-Label ML Classifier)</h4>
                  <div style={{ display: "grid", gap: "8px", background: "rgba(10, 20, 30, 0.6)", padding: "12px 16px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                    {Object.entries(selectedAlert.probabilities).map(([cat, prob]) => (
                      <div key={cat} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ minWidth: "90px", fontSize: "0.8rem", color: "#8a979c" }}>{cat.replace("_", " ").toUpperCase()}</span>
                        <div style={{ flex: 1, height: "8px", background: "rgba(255, 255, 255, 0.08)", borderRadius: "4px", overflow: "hidden" }}>
                          <div
                            style={{
                              height: "100%",
                              width: `${Math.round(prob * 100)}%`,
                              background: prob > 0.5 ? "#e85c4a" : prob > 0.3 ? "#f2a93b" : "#3fbf9e",
                              borderRadius: "4px",
                              transition: "width 0.4s ease",
                            }}
                          />
                        </div>
                        <span style={{ minWidth: "45px", fontFamily: "monospace", fontSize: "0.8rem", textAlign: "right", color: "#e7e4da" }}>
                          {(prob * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="alert-modal__section">
                <h4>Recommended Mitigation Procedure</h4>
                <div className="mitigation-box">
                  <span className="box-icon">💡</span>
                  <p>{selectedAlert.mitigationAction}</p>
                </div>
              </div>
            </div>

            <footer className="alert-modal__footer">
              {onSelectWell && (
                <button
                  className="btn-secondary"
                  onClick={() => {
                    onSelectWell(selectedAlert.wellId);
                    setSelectedAlert(null);
                    if (onSelectView) onSelectView("charts");
                  }}
                >
                  View Well Parameter Charts
                </button>
              )}
              <button className="btn-primary" onClick={() => setSelectedAlert(null)}>
                Done
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
