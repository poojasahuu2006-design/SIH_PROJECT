import "./ConsoleHeader.css";

export default function ConsoleHeader({
  status,
  onRetry,
  activeView = "map",
  onViewChange,
  alertCount = 5,
}) {
  const views = [
    { id: "map", label: "GIS Map & Wells", icon: "🗺️" },
    { id: "alerts", label: "Predictive Alerts", icon: "🚨", badge: alertCount },
    { id: "kpis", label: "KPIs & Risk Matrix", icon: "📊" },
    { id: "charts", label: "Parameter Trends", icon: "📈" },
    { id: "pressure", label: "Pore Pressure & Offsets", icon: "🛡️" },
    { id: "historical", label: "Historical Intelligence", icon: "📚" },
  ];

  return (
    <header className="console-header">
      <div className="console-header__brand">
        <span className="console-header__mark">OilDrill</span>
        <span className="console-header__sub">Intelligence Ops Console</span>
      </div>

      <nav className="console-header__nav">
        {views.map((v) => (
          <button
            key={v.id}
            className={`nav-tab ${activeView === v.id ? "is-active" : ""}`}
            onClick={() => onViewChange && onViewChange(v.id)}
          >
            <span className="nav-tab__icon">{v.icon}</span>
            <span className="nav-tab__label">{v.label}</span>
            {v.badge > 0 && <span className="nav-tab__badge">{v.badge}</span>}
          </button>
        ))}
      </nav>

      <div className="console-header__status">
        <span className={"status-light status-light--" + status} />
        <span className="status-label">
          {status === "ok" && "Live"}
          {status === "loading" && "Connecting…"}
          {status === "error" && "Unreachable"}
          {status === "idle" && "Idle"}
        </span>
        {status === "error" && (
          <button className="console-header__retry" onClick={onRetry}>
            Retry
          </button>
        )}
      </div>
    </header>
  );
}

