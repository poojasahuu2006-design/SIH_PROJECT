import "./DepthGauge.css";

// A driller's-console-style vertical depth indicator: the filled column
// tracks how deep the selected well's measured depth sits against a fixed
// reference scale, with tick marks like a rig's depth counter. This is the
// one deliberately illustrative element in an otherwise data-dense console.
export default function DepthGauge({ depthFt, maxFt = 20000 }) {
  const hasDepth = typeof depthFt === "number" && !Number.isNaN(depthFt);
  const pct = hasDepth ? Math.min(100, Math.max(0, (depthFt / maxFt) * 100)) : 0;
  const ticks = [0, 25, 50, 75, 100];

  return (
    <div className="depth-gauge" role="img" aria-label={hasDepth ? `Measured depth ${depthFt} feet` : "Depth unavailable"}>
      <div className="depth-gauge__track">
        <div className="depth-gauge__fill" style={{ height: `${pct}%` }} />
        {ticks.map((t) => (
          <div className="depth-gauge__tick" style={{ bottom: `${t}%` }} key={t} />
        ))}
        <div className="depth-gauge__bit" style={{ bottom: `calc(${pct}% - 1px)` }} />
      </div>
      <div className="depth-gauge__readout">
        <span className="depth-gauge__value">
          {hasDepth ? depthFt.toLocaleString() : "—"}
        </span>
        <span className="depth-gauge__unit">ft MD</span>
      </div>
    </div>
  );
}
