import "./KeyValueList.css";

function labelFor(key) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function displayValue(val) {
  if (val === null || val === undefined || val === "") return "—";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

// Renders whatever fields exist on an object as label/value rows. Used as a
// catch-all so unrecognized backend fields are still visible instead of
// silently dropped, until the schema is confirmed against the Swagger docs.
export default function KeyValueList({ data, exclude }) {
  if (!data || typeof data !== "object") return null;
  const skip = exclude || new Set();
  const entries = Object.entries(data).filter(([k]) => !skip.has(k));
  if (entries.length === 0) return null;

  return (
    <dl className="kv-list">
      {entries.map(([key, val]) => (
        <div className="kv-row" key={key}>
          <dt>{labelFor(key)}</dt>
          <dd>{displayValue(val)}</dd>
        </div>
      ))}
    </dl>
  );
}
