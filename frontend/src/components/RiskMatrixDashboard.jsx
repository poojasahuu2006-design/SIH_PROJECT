import { useState } from "react";
import "./RiskMatrixDashboard.css";

export default function RiskMatrixDashboard({ wells = [] }) {
  const [selectedWell, setSelectedWell] = useState("W001");

  // Simulated pore pressure window data for selected well
  const porePressureData = [
    { depth: 1000, porePressure: 1.05, mudWeight: 1.15, fracGradient: 1.55 },
    { depth: 1500, porePressure: 1.12, mudWeight: 1.20, fracGradient: 1.58 },
    { depth: 2000, porePressure: 1.18, mudWeight: 1.25, fracGradient: 1.60 },
    { depth: 2500, porePressure: 1.28, mudWeight: 1.30, fracGradient: 1.55 }, // Narrow window
    { depth: 3000, porePressure: 1.36, mudWeight: 1.34, fracGradient: 1.48 }, // Critical kick/loss zone
    { depth: 3500, porePressure: 1.40, mudWeight: 1.42, fracGradient: 1.62 },
  ];

  return (
    <div className="risk-matrix-dashboard">
      <header className="risk-matrix-dashboard__header">
        <div>
          <span className="eyebrow">Advanced Risk Analytics</span>
          <h2>Pore Pressure, Fracture Gradient & Cross-Well Correlation</h2>
          <p className="sub-text">
            Geomechanical mud weight operating window and multi-well offset correlation.
          </p>
        </div>

        <div className="well-selector">
          <label>Target Wellbore:</label>
          <select value={selectedWell} onChange={(e) => setSelectedWell(e.target.value)}>
            <option value="W001">Offset-01 (W001)</option>
            <option value="W002">Offset-02 (W002)</option>
            <option value="W003">Offset-03 (W003)</option>
          </select>
        </div>
      </header>

      <div className="risk-grid">
        {/* Pore Pressure Mud Window Curve */}
        <div className="risk-card">
          <div className="risk-card-header">
            <h3>Geomechanical Safety Window (Depth vs Pressure SG)</h3>
            <span className="subtitle">
              Blue = Pore Pressure | Green = Active Mud Weight | Red = Fracture Gradient
            </span>
          </div>

          <div className="pressure-window-chart">
            <svg viewBox="0 0 700 320" className="svg-window">
              {/* Grid Lines */}
              {[1.0, 1.2, 1.4, 1.6, 1.8].map((sg, i) => {
                const x = 80 + i * 140;
                return (
                  <g key={sg}>
                    <line x1={x} y1={30} x2={x} y2={270} stroke="var(--hairline)" strokeDasharray="3 3" />
                    <text x={x} y={290} textAnchor="middle" fill="var(--steel)" fontSize="10" className="mono">
                      {sg} SG
                    </text>
                  </g>
                );
              })}

              {/* Depth Markers */}
              {porePressureData.map((d, i) => {
                const y = 40 + i * 44;
                return (
                  <g key={d.depth}>
                    <line x1={80} y1={y} x2={640} y2={y} stroke="var(--hairline)" strokeDasharray="3 3" />
                    <text x={70} y={y + 4} textAnchor="end" fill="var(--steel)" fontSize="10" className="mono">
                      {d.depth}m
                    </text>
                  </g>
                );
              })}

              {/* Pore Pressure Line (Blue) */}
              <path
                d={porePressureData
                  .map((d, i) => `${i === 0 ? "M" : "L"} ${80 + (d.porePressure - 1.0) * 700} ${40 + i * 44}`)
                  .join(" ")}
                fill="none"
                stroke="#60a5fa"
                strokeWidth="2.5"
              />

              {/* Mud Weight Line (Green) */}
              <path
                d={porePressureData
                  .map((d, i) => `${i === 0 ? "M" : "L"} ${80 + (d.mudWeight - 1.0) * 700} ${40 + i * 44}`)
                  .join(" ")}
                fill="none"
                stroke="#3fbf9e"
                strokeWidth="3"
              />

              {/* Frac Gradient Line (Red) */}
              <path
                d={porePressureData
                  .map((d, i) => `${i === 0 ? "M" : "L"} ${80 + (d.fracGradient - 1.0) * 700} ${40 + i * 44}`)
                  .join(" ")}
                fill="none"
                stroke="#e85c4a"
                strokeWidth="2.5"
              />

              {/* High Risk Narrow Window Highlight */}
              <rect x={80 + (1.28 - 1.0) * 700} y={150} width={120} height={70} fill="rgba(242, 169, 59, 0.15)" stroke="var(--amber)" strokeDasharray="4 4" />
              <text x={80 + (1.28 - 1.0) * 700 + 10} y={185} fill="var(--amber)" fontSize="10" fontWeight="bold">
                ⚠️ Narrow Mud Window (3000m)
              </text>
            </svg>

            <div className="window-legend">
              <div className="leg-item"><span className="dot blue" /> Pore Pressure (PP)</div>
              <div className="leg-item"><span className="dot green" /> Active Mud Weight (MW)</div>
              <div className="leg-item"><span className="dot red" /> Fracture Gradient (FG)</div>
            </div>
          </div>
        </div>

        {/* Cross Well Analytics */}
        <div className="risk-card">
          <div className="risk-card-header">
            <h3>Cross-Well Offset ROP Comparison</h3>
            <span className="subtitle">Benchmarking active ROP performance against historical offsets</span>
          </div>

          <div className="cross-well-bars">
            <div className="cross-row">
              <span className="well-tag">W001 (Active)</span>
              <div className="bar-track">
                <div className="bar-fill fill-active" style={{ width: "72%" }} />
              </div>
              <span className="bar-val mono">21.5 m/hr</span>
            </div>

            <div className="cross-row">
              <span className="well-tag">W002 (Offset)</span>
              <div className="bar-track">
                <div className="bar-fill fill-offset" style={{ width: "58%" }} />
              </div>
              <span className="bar-val mono">17.4 m/hr</span>
            </div>

            <div className="cross-row">
              <span className="well-tag">W003 (Offset)</span>
              <div className="bar-track">
                <div className="bar-fill fill-offset" style={{ width: "64%" }} />
              </div>
              <span className="bar-val mono">19.1 m/hr</span>
            </div>

            <div className="cross-row">
              <span className="well-tag">W004 (Offset)</span>
              <div className="bar-track">
                <div className="bar-fill fill-offset" style={{ width: "45%" }} />
              </div>
              <span className="bar-val mono">13.6 m/hr</span>
            </div>
          </div>

          <div className="insight-box">
            <span className="insight-title">💡 Drillability Insight</span>
            <p>
              Target Well W001 demonstrates <strong>+18% higher ROP</strong> in Formation-Z compared to nearest offset W003, utilizing optimized PDC cutter geometry.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
