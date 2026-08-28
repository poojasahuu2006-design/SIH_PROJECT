import { useMemo, useState } from "react";
import { WELL_ID_KEYS, WELL_NAME_KEYS, STATUS_KEYS, pick } from "../lib/pick";
import "./Sidebar.css";

export default function Sidebar({ features, selectedId, onSelect, loading, error }) {
  const [query, setQuery] = useState("");

  const wells = useMemo(() => {
    return features.map((f) => {
      const props = f.properties || {};
      return {
        id: pick(props, WELL_ID_KEYS, f.id),
        name: pick(props, WELL_NAME_KEYS, "Unnamed well"),
        status: pick(props, STATUS_KEYS, null),
      };
    });
  }, [features]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return wells;
    return wells.filter(
      (w) =>
        String(w.name).toLowerCase().includes(q) ||
        String(w.id).toLowerCase().includes(q)
    );
  }, [wells, query]);

  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <span className="eyebrow">Wells</span>
        <span className="sidebar__count">{wells.length}</span>
      </div>

      <input
        className="sidebar__search"
        type="text"
        placeholder="Search by name or ID…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search wells"
      />

      {loading && <div className="sidebar__status">Loading wells…</div>}
      {error && <div className="sidebar__status sidebar__status--error">{error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <div className="sidebar__status">No wells match “{query}”.</div>
      )}

      <ul className="sidebar__list">
        {filtered.map((w) => (
          <li key={w.id}>
            <button
              className={
                "sidebar__item" + (String(w.id) === String(selectedId) ? " is-selected" : "")
              }
              onClick={() => onSelect(w.id)}
            >
              <span className="sidebar__item-name">{w.name}</span>
              <span className="sidebar__item-id">{w.id}</span>
              {w.status && <span className="sidebar__item-status">{w.status}</span>}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
