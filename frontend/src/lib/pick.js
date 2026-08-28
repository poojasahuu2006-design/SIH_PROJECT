// The exact JSON key names returned by /api/wells/geojson and
// /api/wells/{id}/summary are defined by the backend's Swagger docs, which
// this frontend was built without direct access to. Rather than hard-coding
// one guess per field, `pick` tries a shortlist of likely aliases so the UI
// keeps working once someone confirms the real schema against the docs —
// at that point, trim each list down to the one true key.

export function pick(obj, keys, fallback = undefined) {
  if (!obj || typeof obj !== "object") return fallback;
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
      return obj[key];
    }
  }
  return fallback;
}

export function pickArray(obj, keys) {
  const val = pick(obj, keys);
  return Array.isArray(val) ? val : [];
}

// Common aliases, gathered from the field names mentioned in the P3 post
// (well_id, NPT, kicks, stuck pipe, mud weight, depth, severity, event_type).
export const WELL_ID_KEYS = ["well_id", "id", "wellId", "uid"];
export const WELL_NAME_KEYS = ["name", "well_name", "wellName"];
export const OPERATOR_KEYS = ["operator", "operator_name"];
export const STATUS_KEYS = ["status", "well_status"];
export const DEPTH_KEYS = ["depth", "current_depth", "measured_depth", "md", "total_depth"];
export const LAT_KEYS = ["latitude", "lat"];
export const LON_KEYS = ["longitude", "lon", "lng"];

export const OFFSET_WELLS_KEYS = ["offset_wells", "nearby_wells", "offsets", "nearby"];
export const EVENTS_KEYS = ["events", "historical_events", "drilling_events"];
export const DRILLING_PARAMS_KEYS = [
  "latest_drilling_data",
  "drilling_data",
  "latest_parameters",
  "drilling_params",
  "latest_drilling_parameters",
];
export const WELL_DETAILS_KEYS = ["well", "well_details", "details"];

export const DISTANCE_KEYS = ["distance_km", "distance", "distance_m"];
export const EVENT_TYPE_KEYS = ["event_type", "type"];
export const SEVERITY_KEYS = ["severity"];
export const EVENT_DATE_KEYS = ["date", "event_date", "timestamp", "created_at"];
export const EVENT_DESC_KEYS = ["description", "notes", "summary"];

export const MUD_WEIGHT_KEYS = ["mud_weight", "mud_weight_ppg", "mw"];
export const NPT_KEYS = ["npt_hours", "npt", "non_productive_time"];
export const KICK_KEYS = ["kicks", "kick_count", "num_kicks"];
export const STUCK_PIPE_KEYS = ["stuck_pipe", "stuck_pipe_events", "stuck_pipe_count"];

// Keys already surfaced by a structured field, so the raw JSON fallback view
// doesn't repeat them.
export const KNOWN_TOP_LEVEL_KEYS = new Set([
  ...WELL_ID_KEYS,
  ...WELL_NAME_KEYS,
  ...OPERATOR_KEYS,
  ...STATUS_KEYS,
  ...DEPTH_KEYS,
  ...OFFSET_WELLS_KEYS,
  ...EVENTS_KEYS,
  ...DRILLING_PARAMS_KEYS,
  ...WELL_DETAILS_KEYS,
]);

export function formatNumber(val, digits = 0) {
  const n = Number(val);
  if (Number.isNaN(n)) return String(val ?? "—");
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}
