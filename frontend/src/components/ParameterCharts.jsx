import { useState, useMemo } from "react";
import "./ParameterCharts.css";

export default function ParameterCharts({
  wells = [],
  selectedWellId = null,
  drillingData = [],
  loading = false,
  onSelectWell,
}) {
  const [activeCategory, setActiveCategory] = useState("mechanical"); // mechanical | hydraulics | safety | log_strip
  const [hoverPoint, setHoverPoint] = useState(null);

  const activeWellId = selectedWellId || (wells[0]?.properties?.well_id ?? "W001");

  // Format data for plotting
  const chartData = useMemo(() => {
    if (!drillingData || drillingData.length === 0) return [];
    return [...drillingData].sort((a, b) => (a.hole_depth_md_m || 0) - (b.hole_depth_md_m || 0));
  }, [drillingData]);

  // Compute key parameter stats
  const stats = useMemo(() => {
    if (chartData.length === 0) return {};
    const rops = chartData.map((d) => d.rop_m_per_hr || 0);
    const torques = chartData.map((d) => d.torque_kNm || 0);
    const ecds = chartData.map((d) => d.ecd_sg || 0);
    const gases = chartData.map((d) => d.gas_units || 0);

    return {
      avgRop: (rops.reduce((a, b) => a + b, 0) / rops.length).toFixed(1),
      maxTorque: Math.max(...torques).toFixed(1),
      avgEcd: (ecds.reduce((a, b) => a + b, 0) / ecds.length).toFixed(2),
      maxGas: Math.max(...gases).toFixed(0),
      currentDepth: (chartData[chartData.length - 1]?.hole_depth_md_m || 3000).toFixed(1),
    };
  }, [chartData]);

  // SVG Chart Helper
  const renderSvgLineChart = (keys, labels, colors, minVal, maxVal, unit = "") => {
    if (chartData.length === 0) return null;

    const width = 800;
    const height = 260;
    const padding = { top: 30, right: 30, bottom: 40, left: 60 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const pointsCount = chartData.length;

    const getX = (idx) => padding.left + (idx / Math.max(1, pointsCount - 1)) * chartW;
    const getY = (val) => {
      const norm = (val - minVal) / Math.max(0.001, maxVal - minVal);
      return padding.top + chartH - Math.min(1, Math.max(0, norm)) * chartH;
    };

    return (
      <div className="svg-chart-container">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="svg-chart"
          onMouseLeave={() => setHoverPoint(null)}
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + chartH * (1 - ratio);
            const val = (minVal + ratio * (maxVal - minVal)).toFixed(1);
            return (
              <g key={ratio} className="chart-grid-line">
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} />
                <text x={padding.left - 8} y={y + 4} textAnchor="end">
                  {val}
                </text>
              </g>
            );
          })}

          {/* Anomaly zone highlight */}
          {chartData.map((d, i) => {
            const isAnomaly = (d.torque_kNm || 0) > 28 || (d.gas_units || 0) > 300;
            if (!isAnomaly) return null;
            const x = getX(i);
            return (
              <rect
                key={i}
                x={x - 10}
                y={padding.top}
                width={20}
                height={chartH}
                fill="rgba(232, 92, 74, 0.12)"
              />
            );
          })}

          {/* Lines */}
          {keys.map((key, kIdx) => {
            const pathD = chartData
              .map((d, i) => {
                const x = getX(i);
                const y = getY(d[key] || 0);
                return `${i === 0 ? "M" : "L"} ${x} ${y}`;
              })
              .join(" ");

            return (
              <path
                key={key}
                d={pathD}
                fill="none"
                stroke={colors[kIdx]}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}

          {/* Hover interactive vertical crosshair line */}
          {hoverPoint !== null && (
            <line
              x1={getX(hoverPoint)}
              y1={padding.top}
              x2={getX(hoverPoint)}
              y2={padding.top + chartH}
              stroke="var(--bone)"
              strokeDasharray="4 4"
              strokeWidth="1.5"
            />
          )}

          {/* Hover hitboxes */}
          {chartData.map((d, i) => (
            <circle
              key={i}
              cx={getX(i)}
              cy={getY(d[keys[0]] || 0)}
              r={6}
              fill="transparent"
              className="chart-hitbox"
              onMouseEnter={() => setHoverPoint(i)}
            />
          ))}

          {/* X Axis Labels (Depth) */}
          {chartData.map((d, i) => {
            if (i % Math.ceil(pointsCount / 6) !== 0 && i !== pointsCount - 1) return null;
            const x = getX(i);
            return (
              <text
                key={i}
                x={x}
                y={height - 10}
                textAnchor="middle"
                className="axis-label"
              >
                {d.hole_depth_md_m}m
              </text>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="chart-legend">
          {labels.map((lbl, idx) => (
            <div key={lbl} className="legend-item">
              <span className="legend-dot" style={{ background: colors[idx] }} />
              <span className="legend-name">{lbl}</span>
              {hoverPoint !== null && chartData[hoverPoint] && (
                <span className="legend-val mono" style={{ color: colors[idx] }}>
                  {chartData[hoverPoint][keys[idx]] ?? "--"} {unit}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="parameter-charts">
      <header className="parameter-charts__header">
        <div>
          <span className="eyebrow">Operational Parameter Trends & Curves</span>
          <h2>Drilling Real-Time Telemetry & Depth Charts</h2>
        </div>

        <div className="well-selector-box">
          <label>Target Well:</label>
          <select
            value={activeWellId}
            onChange={(e) => onSelectWell && onSelectWell(e.target.value)}
          >
            {wells.length > 0 ? (
              wells.map((w) => {
                const id = w.properties?.well_id;
                const name = w.properties?.well_name || id;
                return (
                  <option key={id} value={id}>
                    {name} ({id})
                  </option>
                );
              })
            ) : (
              <option value="W001">Offset-01 (W001)</option>
            )}
          </select>
        </div>
      </header>

      {/* KPI Stats Bar */}
      <div className="charts-kpi-bar">
        <div className="stat-card">
          <span className="stat-label">Current Depth</span>
          <span className="stat-value mono">{stats.currentDepth || "--"} m</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Avg ROP</span>
          <span className="stat-value highlight-green mono">{stats.avgRop || "--"} m/hr</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Peak Torque</span>
          <span className="stat-value highlight-amber mono">{stats.maxTorque || "--"} kNm</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Avg ECD</span>
          <span className="stat-value mono">{stats.avgEcd || "--"} SG</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Max Gas Units</span>
          <span className="stat-value highlight-red mono">{stats.maxGas || "--"} ppm</span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="chart-tabs">
        <button
          className={`chart-tab ${activeCategory === "mechanical" ? "is-active" : ""}`}
          onClick={() => setActiveCategory("mechanical")}
        >
          ⚙️ Mechanical Parameters (ROP / WOB / RPM / Torque)
        </button>
        <button
          className={`chart-tab ${activeCategory === "hydraulics" ? "is-active" : ""}`}
          onClick={() => setActiveCategory("hydraulics")}
        >
          💧 Hydraulics & Pressures (SPP / Flow / Pit Vol)
        </button>
        <button
          className={`chart-tab ${activeCategory === "safety" ? "is-active" : ""}`}
          onClick={() => setActiveCategory("safety")}
        >
          🛡️ Mud & Gas Safety (Mud Wt / ECD / Gas)
        </button>
        <button
          className={`chart-tab ${activeCategory === "log_strip" ? "is-active" : ""}`}
          onClick={() => setActiveCategory("log_strip")}
        >
          📊 Composite Log Strips (Depth vs Param)
        </button>
      </div>

      {/* Main Display Area */}
      {loading ? (
        <div className="charts-loading">Loading telemetry curves for well {activeWellId}...</div>
      ) : chartData.length === 0 ? (
        <div className="charts-empty">
          No telemetry records available for well {activeWellId}. Select another well.
        </div>
      ) : (
        <div className="chart-content-area">
          {activeCategory === "mechanical" && (
            <div className="chart-panel">
              <div className="chart-section-title">
                <h3>Rate of Penetration (ROP) vs Torque & RPM Curve</h3>
                <span className="chart-subtitle">
                  Red shaded bands highlight stick-slip torque anomaly zones
                </span>
              </div>
              {renderSvgLineChart(
                ["rop_m_per_hr", "torque_kNm", "rpm"],
                ["ROP (m/hr)", "Torque (kNm)", "Bit RPM"],
                ["#3fbf9e", "#f2a93b", "#3b82f6"],
                0,
                120
              )}
            </div>
          )}

          {activeCategory === "hydraulics" && (
            <div className="chart-panel">
              <div className="chart-section-title">
                <h3>Standpipe Pressure (SPP) & Flow In / Out Balance</h3>
                <span className="chart-subtitle">
                  Monitors circulation loss and flow out drops relative to pit volume
                </span>
              </div>
              {renderSvgLineChart(
                ["flow_rate_out_pct", "pit_volume_m3"],
                ["Flow Out (%)", "Pit Volume (m³)"],
                ["#60a5fa", "#a78bfa"],
                40,
                110
              )}
            </div>
          )}

          {activeCategory === "safety" && (
            <div className="chart-panel">
              <div className="chart-section-title">
                <h3>Mud Weight, ECD & Downhole Gas Units</h3>
                <span className="chart-subtitle">
                  Detects pore pressure kick influx (gas spikes) and wellbore window stability
                </span>
              </div>
              {renderSvgLineChart(
                ["ecd_sg", "gas_units"],
                ["ECD (SG)", "Gas Units (ppm)"],
                ["#f59e0b", "#ef4444"],
                0,
                500
              )}
            </div>
          )}

          {activeCategory === "log_strip" && (
            <div className="log-strips-container">
              <div className="log-strip">
                <h4>Track 1: ROP (m/hr)</h4>
                <div className="strip-bars">
                  {chartData.map((d, i) => (
                    <div key={i} className="strip-row">
                      <span className="strip-depth mono">{Number(d.hole_depth_md_m || 0).toFixed(0)}m</span>
                      <div
                        className="strip-fill rop-fill"
                        style={{ width: `${Math.min(100, ((d.rop_m_per_hr || 0) / 30) * 100)}%` }}
                      />
                      <span className="strip-val mono">{Number(d.rop_m_per_hr || 0).toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="log-strip">
                <h4>Track 2: Torque (kNm)</h4>
                <div className="strip-bars">
                  {chartData.map((d, i) => (
                    <div key={i} className="strip-row">
                      <span className="strip-depth mono">{Number(d.hole_depth_md_m || 0).toFixed(0)}m</span>
                      <div
                        className={`strip-fill torque-fill ${
                          (d.torque_kNm || 0) > 28 ? "is-high-torque" : ""
                        }`}
                        style={{ width: `${Math.min(100, ((d.torque_kNm || 0) / 40) * 100)}%` }}
                      />
                      <span className="strip-val mono">{Number(d.torque_kNm || 0).toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="log-strip">
                <h4>Track 3: Gas (Units)</h4>
                <div className="strip-bars">
                  {chartData.map((d, i) => (
                    <div key={i} className="strip-row">
                      <span className="strip-depth mono">{Number(d.hole_depth_md_m || 0).toFixed(0)}m</span>
                      <div
                        className={`strip-fill gas-fill ${
                          (d.gas_units || 0) > 250 ? "is-gas-spike" : ""
                        }`}
                        style={{ width: `${Math.min(100, ((d.gas_units || 0) / 500) * 100)}%` }}
                      />
                      <span className="strip-val mono">{Number(d.gas_units || 0).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
