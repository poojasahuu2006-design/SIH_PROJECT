import DepthGauge from "./DepthGauge";
import KeyValueList from "./KeyValueList";
import {
  WELL_ID_KEYS,
  WELL_NAME_KEYS,
  OPERATOR_KEYS,
  STATUS_KEYS,
  DEPTH_KEYS,
  OFFSET_WELLS_KEYS,
  EVENTS_KEYS,
  DRILLING_PARAMS_KEYS,
  WELL_DETAILS_KEYS,
  DISTANCE_KEYS,
  EVENT_TYPE_KEYS,
  SEVERITY_KEYS,
  EVENT_DATE_KEYS,
  EVENT_DESC_KEYS,
  KNOWN_TOP_LEVEL_KEYS,
  pick,
  pickArray,
  formatNumber,
} from "../lib/pick";
import "./WellSummaryPanel.css";

function severityClass(sev) {
  const s = String(sev || "").toLowerCase();
  if (s.includes("high") || s.includes("critical") || s.includes("severe")) return "is-high";
  if (s.includes("med")) return "is-medium";
  if (s.includes("low")) return "is-low";
  return "";
}

export default function WellSummaryPanel({ summary, loading, error, wellId, onSelectWell }) {
  if (!wellId) {
    return (
      <section className="summary-panel summary-panel--empty">
        <p>Select a well from the list or the map to see its summary.</p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="summary-panel summary-panel--empty">
        <p>Loading well {wellId}…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="summary-panel summary-panel--empty">
        <p className="summary-panel__error">{error}</p>
      </section>
    );
  }

  if (!summary) return null;

  // The summary payload may nest well details under a "well" key, or hold
  // them at the top level alongside offsets/events — support both shapes.
  const details = pick(summary, WELL_DETAILS_KEYS, summary);
  const name = pick(details, WELL_NAME_KEYS, pick(summary, WELL_NAME_KEYS, wellId));
  const operator = pick(details, OPERATOR_KEYS);
  const status = pick(details, STATUS_KEYS);
  const depthRaw = pick(details, DEPTH_KEYS);
  const depth = depthRaw !== undefined ? Number(depthRaw) : undefined;

  const offsetWells = pickArray(summary, OFFSET_WELLS_KEYS);
  const events = pickArray(summary, EVENTS_KEYS);
  const drillingParams = pick(summary, DRILLING_PARAMS_KEYS);

  return (
    <section className="summary-panel">
      <header className="summary-panel__header">
        <div>
          <span className="eyebrow">Well summary</span>
          <h2>{name}</h2>
          <div className="summary-panel__meta">
            <span className="mono">{wellId}</span>
            {operator && <span>{operator}</span>}
            {status && <span className="summary-panel__status">{status}</span>}
          </div>
        </div>
        <DepthGauge depthFt={Number.isFinite(depth) ? depth : undefined} />
      </header>

      <div className="summary-panel__section">
        <h3>Well details</h3>
        <KeyValueList data={details} exclude={KNOWN_TOP_LEVEL_KEYS} />
      </div>

      <div className="summary-panel__section">
        <h3>Offset wells ({offsetWells.length})</h3>
        {offsetWells.length === 0 && <p className="summary-panel__muted">None reported.</p>}
        <ul className="offset-list">
          {offsetWells.map((w, i) => {
            const wName = pick(w, WELL_NAME_KEYS, pick(w, WELL_ID_KEYS, `Offset ${i + 1}`));
            const wId = pick(w, WELL_ID_KEYS);
            const dist = pick(w, DISTANCE_KEYS);
            return (
              <li
                key={wId ?? i}
                className={`offset-list__item ${onSelectWell && wId ? "is-clickable" : ""}`}
                onClick={() => onSelectWell && wId && onSelectWell(wId)}
                title={wId ? `Focus ${wName} (${wId}) on map` : undefined}
              >
                <div className="offset-list__info">
                  <span className="offset-list__name">{wName}</span>
                  {wId && <span className="mono offset-list__id">{wId}</span>}
                </div>
                {dist !== undefined && (
                  <span className="mono offset-list__distance">{formatNumber(dist, 2)} km</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="summary-panel__section">
        <h3>Event timeline ({events.length})</h3>
        {events.length === 0 && <p className="summary-panel__muted">No events logged.</p>}
        <ol className="timeline">
          {events.map((e, i) => {
            const type = pick(e, EVENT_TYPE_KEYS, "Event");
            const sev = pick(e, SEVERITY_KEYS);
            const date = pick(e, EVENT_DATE_KEYS);
            const desc = pick(e, EVENT_DESC_KEYS);
            return (
              <li key={i} className="timeline__item">
                <span className={"timeline__dot " + severityClass(sev)} />
                <div className="timeline__body">
                  <div className="timeline__row">
                    <span className="timeline__type">{type}</span>
                    {sev && (
                      <span className={"timeline__severity " + severityClass(sev)}>{sev}</span>
                    )}
                    {date && <span className="mono timeline__date">{date}</span>}
                  </div>
                  {desc && <p className="timeline__desc">{desc}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="summary-panel__section">
        <h3>Latest drilling parameters</h3>
        {!drillingParams && <p className="summary-panel__muted">No drilling data reported.</p>}
        {drillingParams && <KeyValueList data={drillingParams} />}
      </div>
    </section>
  );
}
