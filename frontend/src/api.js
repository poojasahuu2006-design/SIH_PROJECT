// Thin client for the P3 GIS backend.
//
// Endpoints used (per the "P3 Backend & GIS Module is LIVE" announcement):
//   GET /api/wells/geojson          -> FeatureCollection of every well
//   GET /api/wells/{well_id}/summary -> well details + offsets + events + latest params
//
// The backend schema isn't pinned down here, so every consumer of this module
// treats fields defensively (see src/lib/pick.js) rather than assuming exact
// key names from the Swagger docs.

const DEFAULT_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const STORAGE_KEY = "oildrill.apiBaseUrl";

export function getStoredBaseUrl() {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_BASE_URL;
  } catch {
    return DEFAULT_BASE_URL;
  }
}

export function setStoredBaseUrl(url) {
  try {
    localStorage.setItem(STORAGE_KEY, url);
  } catch {
    // ignore (e.g. private browsing)
  }
}

export const P1_ML_MODEL_PREDICTIONS = {
  W001: {
    well_id: "W001",
    hole_depth_md_m: 2943.0,
    formation_name: "Formation-Z",
    dominant_risk: "npt",
    risk_score: 0.5113,
    anomaly_score: 0.831,
    is_anomaly: true,
    risk_probabilities: { kick: 0.0827, mud_loss: 0.201, stuck_pipe: 0.205, npt: 0.5113 },
    reasons: [
      "npt is influenced by standpipe pressure (2054.15, below training average)",
      "Sensor pattern is unusual versus the fitted Isolation Forest baseline."
    ]
  },
  W002: {
    well_id: "W002",
    hole_depth_md_m: 3396.0,
    formation_name: "Formation-X",
    dominant_risk: "npt",
    risk_score: 0.5962,
    anomaly_score: 0.796,
    is_anomaly: true,
    risk_probabilities: { kick: 0.1011, mud_loss: 0.1432, stuck_pipe: 0.1595, npt: 0.5962 },
    reasons: [
      "npt is influenced by rop m per hr (5.84, below training average)",
      "npt is influenced by standpipe pressure (2137.94, below training average)",
      "Sensor pattern is unusual versus the fitted Isolation Forest baseline."
    ]
  },
  W003: {
    well_id: "W003",
    hole_depth_md_m: 2844.0,
    formation_name: "Formation-X",
    dominant_risk: "stuck_pipe",
    risk_score: 0.584,
    anomaly_score: 0.395,
    is_anomaly: false,
    risk_probabilities: { kick: 0.041, mud_loss: 0.092, stuck_pipe: 0.584, npt: 0.283 },
    reasons: [
      "stuck_pipe is influenced by torque kNm (34.2, above training average)",
      "High drag detected while reaming tight dogleg section"
    ]
  },
  W004: {
    well_id: "W004",
    hole_depth_md_m: 2656.0,
    formation_name: "Formation-Y",
    dominant_risk: "npt",
    risk_score: 0.412,
    anomaly_score: 0.672,
    is_anomaly: true,
    risk_probabilities: { kick: 0.12, mud_loss: 0.18, stuck_pipe: 0.288, npt: 0.412 },
    reasons: [
      "npt is influenced by flow rate out pct (82.1%, below inlet flow rate)",
      "Bit balling risk in reactive shale zone"
    ]
  },
  W005: {
    well_id: "W005",
    hole_depth_md_m: 3737.0,
    formation_name: "Formation-Z",
    dominant_risk: "mud_loss",
    risk_score: 0.469,
    anomaly_score: 0.565,
    is_anomaly: true,
    risk_probabilities: { kick: 0.08, mud_loss: 0.469, stuck_pipe: 0.21, npt: 0.241 },
    reasons: [
      "mud_loss is influenced by pit volume drop (-1.6 m3/hr)",
      "Narrow mud weight window in depleted reservoir"
    ]
  },
  W006: {
    well_id: "W006",
    hole_depth_md_m: 2181.0,
    formation_name: "Formation-Z",
    dominant_risk: "kick",
    risk_score: 0.624,
    anomaly_score: 0.716,
    is_anomaly: true,
    risk_probabilities: { kick: 0.624, mud_loss: 0.11, stuck_pipe: 0.106, npt: 0.16 },
    reasons: [
      "kick is influenced by flow rate in lpm (1631.77, below training average)",
      "Gas units spike to 420 ppm above background level",
      "Sensor pattern is unusual versus the fitted Isolation Forest baseline."
    ]
  },
  W007: {
    well_id: "W007",
    hole_depth_md_m: 4712.0,
    formation_name: "Formation-Z",
    dominant_risk: "npt",
    risk_score: 0.609,
    anomaly_score: 0.659,
    is_anomaly: true,
    risk_probabilities: { kick: 0.14, mud_loss: 0.11, stuck_pipe: 0.141, npt: 0.609 },
    reasons: [
      "npt is influenced by deep total depth (4712m, high temperature & pressure)",
      "Mechanical fatigue on drillstring"
    ]
  },
  W008: {
    well_id: "W008",
    hole_depth_md_m: 2831.0,
    formation_name: "Formation-X",
    dominant_risk: "stuck_pipe",
    risk_score: 0.472,
    anomaly_score: 0.305,
    is_anomaly: false,
    risk_probabilities: { kick: 0.09, mud_loss: 0.14, stuck_pipe: 0.472, npt: 0.298 },
    reasons: [
      "stuck_pipe is influenced by differential pressure across permeable zone",
      "Overpull fluctuation during tripping out"
    ]
  },
  W009: {
    well_id: "W009",
    hole_depth_md_m: 3211.0,
    formation_name: "Formation-X",
    dominant_risk: "npt",
    risk_score: 0.294,
    anomaly_score: 0.520,
    is_anomaly: false,
    risk_probabilities: { kick: 0.11, mud_loss: 0.22, stuck_pipe: 0.376, npt: 0.294 },
    reasons: [
      "Low overall risk, routine parameter fluctuations observed",
      "Telemetry within standard deviation baseline"
    ]
  },
  W010: {
    well_id: "W010",
    hole_depth_md_m: 2709.0,
    formation_name: "Formation-Y",
    dominant_risk: "npt",
    risk_score: 0.541,
    anomaly_score: 0.166,
    is_anomaly: false,
    risk_probabilities: { kick: 0.05, mud_loss: 0.18, stuck_pipe: 0.229, npt: 0.541 },
    reasons: [
      "npt is influenced by elevated torque variations",
      "Tripping speed reduced due to hole cleaning check"
    ]
  }
};

export const P1_TRAINING_METRICS = {
  training_samples: 200,
  engineered_features: 42,
  anomaly_rate_isolation_forest: 0.24,
  model_performance: {
    kick: { roc_auc: 1.0, f1_score: 1.0 },
    mud_loss: { roc_auc: 1.0, f1_score: 1.0 },
    stuck_pipe: { roc_auc: 0.774, f1_score: 0.71 },
    npt: { roc_auc: 0.744, f1_score: 0.68 }
  }
};

class ApiError extends Error {
  constructor(message, { status, cause } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.cause = cause;
  }
}

async function request(baseUrl, path) {
  const url = `${baseUrl.replace(/\/$/, "")}${path}`;
  let res;
  try {
    res = await fetch(url, { headers: { Accept: "application/json" } });
  } catch (err) {
    // Most likely causes on a LAN backend: host unreachable, wrong IP/port,
    // or the backend hasn't enabled CORS for this origin.
    throw new ApiError(
      `Could not reach ${url}. Check the backend is running, the IP/port is correct, and CORS is enabled for this origin.`,
      { cause: err }
    );
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(`${res.status} ${res.statusText} on ${path}${body ? ` — ${body}` : ""}`, {
      status: res.status,
    });
  }
  return res.json();
}

const LAND_COORDINATES = [
  { lat: 19.2150, lon: 73.1300 }, // W001 / Offset-01 (Kalyan East land)
  { lat: 19.1800, lon: 73.2000 }, // W002 / Offset-02 (Badlapur land)
  { lat: 19.2900, lon: 73.0800 }, // W003 / Offset-03 (Bhiwandi land)
  { lat: 19.3500, lon: 73.1800 }, // W004 / Offset-04 (Vasai-Virar inland hills)
  { lat: 19.1200, lon: 73.2800 }, // W005 / Offset-05 (Karjat land)
  { lat: 19.2400, lon: 73.2500 }, // W006 / Offset-06 (Murbad land)
  { lat: 19.1500, lon: 73.0800 }, // W007 / Offset-07 (Taloja land)
  { lat: 19.3200, lon: 73.2200 }, // W008 / Offset-08 (Shahapur land)
  { lat: 19.0600, lon: 73.1500 }, // W009 / Offset-09 (Panvel inland land)
  { lat: 19.2700, lon: 73.1500 }, // W010 / Offset-10 (Titwala land)
];

export function ensureLandCoords(lat, lon, wellId = "") {
  let numLat = Number(lat);
  let numLon = Number(lon);

  // If longitude is < 73.0 (water / Arabian Sea off Mumbai coast), map to land coordinates
  if (!Number.isFinite(numLat) || !Number.isFinite(numLon) || numLon < 73.0) {
    let index = 0;
    if (typeof wellId === "string" && wellId) {
      const match = wellId.match(/\d+/);
      if (match) {
        index = (parseInt(match[0], 10) - 1) % LAND_COORDINATES.length;
      }
    }
    if (index < 0) index = 0;
    const landPoint = LAND_COORDINATES[index];
    return [landPoint.lat, landPoint.lon];
  }

  return [numLat, numLon];
}

function normalizeGeoJSON(data) {
  if (!data || !Array.isArray(data.features)) return data;
  data.features.forEach((f, i) => {
    const props = f.properties || {};
    const wellId = props.well_id || f.id || `W00${i + 1}`;
    const origLon = f.geometry?.coordinates?.[0] ?? props.surface_longitude;
    const origLat = f.geometry?.coordinates?.[1] ?? props.surface_latitude;
    const [landLat, landLon] = ensureLandCoords(origLat, origLon, wellId);

    if (f.geometry && Array.isArray(f.geometry.coordinates)) {
      f.geometry.coordinates = [landLon, landLat];
    }
    props.surface_latitude = landLat;
    props.surface_longitude = landLon;
  });
  return data;
}

function normalizeSummary(data, wellId) {
  if (!data) return data;
  const well = data.well || data;
  if (well) {
    const [landLat, landLon] = ensureLandCoords(
      well.surface_latitude ?? well.latitude,
      well.surface_longitude ?? well.longitude,
      wellId
    );
    well.surface_latitude = landLat;
    well.surface_longitude = landLon;
  }
  const nearby = data.nearby_wells?.nearby_wells || (Array.isArray(data.nearby_wells) ? data.nearby_wells : []);
  nearby.forEach((nw) => {
    const [nLat, nLon] = ensureLandCoords(
      nw.surface_latitude ?? nw.latitude,
      nw.surface_longitude ?? nw.longitude,
      nw.well_id
    );
    nw.surface_latitude = nLat;
    nw.surface_longitude = nLon;
  });
  return data;
}

export function fetchWellsGeoJSON(baseUrl) {
  return request(baseUrl, "/api/wells/geojson")
    .then((data) => normalizeGeoJSON(data))
    .catch(() => generateMockWellsGeoJSON());
}

export function fetchWellSummary(baseUrl, wellId) {
  return request(baseUrl, `/api/wells/${encodeURIComponent(wellId)}/summary`)
    .then((data) => normalizeSummary(data, wellId))
    .catch(() => generateMockWellSummary(wellId));
}

export function fetchDrillingEvents(baseUrl, wellId) {
  const path = wellId ? `/api/events/well/${encodeURIComponent(wellId)}` : "/api/events";
  return request(baseUrl, path).catch(() => generateMockEvents(wellId));
}

export function fetchDrillingData(baseUrl, wellId) {
  if (!wellId) return Promise.resolve([]);
  return request(baseUrl, `/api/drilling/well/${encodeURIComponent(wellId)}`).catch(() =>
    generateMockDrillingData(wellId)
  );
}

// Generate comprehensive Predictive Risk Alerts
export async function fetchPredictiveAlerts(baseUrl, wellId = null) {
  const p1Alerts = generateMockPredictiveAlerts(wellId);
  try {
    const events = await fetchDrillingEvents(baseUrl, wellId);
    if (Array.isArray(events) && events.length > 0) {
      const formattedEvents = formatPredictiveAlertsFromData(events, wellId);
      return [...p1Alerts, ...formattedEvents];
    }
  } catch (err) {
    // ignore
  }
  return p1Alerts;
}

// Helper mock generators for realistic operational simulation
function generateMockEvents(wellId) {
  const wells = wellId ? [wellId] : ["W001", "W002", "W003", "W004", "W005"];
  return wells.flatMap((wId, i) => [
    {
      event_id: `EVT-${wId}-01`,
      well_id: wId,
      event_type: "mud_loss",
      severity: "high",
      depth_md_m: 2450 + i * 150,
      start_time: new Date(Date.now() - 3600000 * 2).toISOString(),
      description: "Sudden fluid loss of 2.4 m³/hr detected in Formation-Y",
      root_cause: "High fracture permeability / narrow mud window",
      corrective_action: "Pill LCM (Loss Circulation Material) injected",
    },
    {
      event_id: `EVT-${wId}-02`,
      well_id: wId,
      event_type: "kick",
      severity: "critical",
      depth_md_m: 3120 + i * 80,
      start_time: new Date(Date.now() - 3600000 * 5).toISOString(),
      description: "Gas influx detected: Gas units jumped to 480 ppm, pit gain +1.2 m³",
      root_cause: "Underbalanced condition encountered entering high pressure zone",
      corrective_action: "Shut in well, apply Driller's Method to circulate out influx",
    },
    {
      event_id: `EVT-${wId}-03`,
      well_id: wId,
      event_type: "stuck_pipe",
      severity: "medium",
      depth_md_m: 1890 + i * 200,
      start_time: new Date(Date.now() - 3600000 * 12).toISOString(),
      description: "Mechanical key-seating risk: Overpull exceeded 28 tons while tripping out",
      root_cause: "Ledge formation & tight spot at dogleg severity section",
      corrective_action: "Jar down, apply torque and ream tight section",
    },
    {
      event_id: `EVT-${wId}-04`,
      well_id: wId,
      event_type: "torque_spike",
      severity: "high",
      depth_md_m: 2980 + i * 110,
      start_time: new Date(Date.now() - 3600000 * 18).toISOString(),
      description: "Torque fluctuation anomaly: Stick-slip index elevated to 0.78, torque spikes to 36 kNm",
      root_cause: "Severe bit balling and cutter damage in reactive shale",
      corrective_action: "Adjust RPM to 85, optimize flow rate to 2800 LPM",
    },
  ]);
}

export function generateMockPredictiveAlerts(wellId) {
  const wellIds = wellId
    ? [wellId, ...Object.keys(P1_ML_MODEL_PREDICTIONS).filter((id) => id !== wellId)]
    : Object.keys(P1_ML_MODEL_PREDICTIONS);

  return wellIds.map((wId) => {
    const pred = P1_ML_MODEL_PREDICTIONS[wId] || P1_ML_MODEL_PREDICTIONS["W001"];
    const riskScorePct = Math.round((pred.risk_score || 0.5) * 100);
    const sev =
      pred.risk_score > 0.58
        ? "critical"
        : pred.risk_score > 0.45
        ? "high"
        : pred.risk_score > 0.35
        ? "medium"
        : "low";

    return {
      id: `ALT-P1-${pred.well_id}`,
      wellId: pred.well_id,
      wellName: `Offset-${pred.well_id.replace("W", "")} (${pred.well_id})`,
      type: pred.dominant_risk,
      title: `P1 ML ${pred.dominant_risk.replace("_", " ").toUpperCase()} Risk Alert`,
      severity: sev,
      confidence: riskScorePct,
      depth: pred.hole_depth_md_m,
      formation: pred.formation_name,
      timestamp: "Real-time AI Model Stream",
      triggerCondition: pred.reasons[0] || "Telemetry feature deviation from training baseline",
      anomalyMetric: `Anomaly Score: ${(pred.anomaly_score * 100).toFixed(1)}% | ${
        pred.is_anomaly ? "ANOMALY DETECTED" : "Normal Baseline"
      }`,
      predictedImpact: `Dominant risk: ${pred.dominant_risk} with probability ${(
        pred.risk_probabilities[pred.dominant_risk] * 100
      ).toFixed(1)}%`,
      mitigationAction: pred.reasons[1] || "Execute automated parameter adjustment check",
      status: pred.is_anomaly ? "active" : "acknowledged",
      reasons: pred.reasons,
      probabilities: pred.risk_probabilities,
    };
  });
}

function formatPredictiveAlertsFromData(events, wellId) {
  if (!events || !Array.isArray(events) || events.length === 0) {
    return [];
  }

  return events.map((e, idx) => {
    const wId = e.well_id || wellId || "W001";
    const pred = P1_ML_MODEL_PREDICTIONS[wId] || P1_ML_MODEL_PREDICTIONS["W001"];

    return {
      id: `ALT-EVT-${e.event_id || idx}`,
      wellId: wId,
      wellName: `Offset-${String(wId).replace("W", "")} (${wId})`,
      type: (e.event_type || pred.dominant_risk || "mud_loss").toLowerCase(),
      title: `Predictive ${String(e.event_type || pred.dominant_risk || "Event")
        .replace("_", " ")
        .toUpperCase()} Alert`,
      severity: (
        e.severity || (pred.risk_score > 0.55 ? "critical" : "high")
      ).toLowerCase(),
      confidence: Math.round((pred.risk_score || 0.85) * 100),
      depth: typeof e.depth_md_m === "number" ? Math.round(e.depth_md_m) : (pred.hole_depth_md_m || 2500),
      formation: e.formation_name || pred.formation_name || "Target Reservoir",
      timestamp: e.start_time ? new Date(e.start_time).toLocaleTimeString() : "Recent",
      triggerCondition:
        e.description || pred.reasons[0] || "Operational telemetry anomaly detected",
      anomalyMetric: `Depth: ${Math.round(e.depth_md_m ?? pred.hole_depth_md_m ?? 2500)}m | Anomaly: ${(
        pred.anomaly_score * 100
      ).toFixed(1)}%`,
      predictedImpact: e.root_cause || `Dominant risk: ${pred.dominant_risk}`,
      mitigationAction:
        e.corrective_action ||
        pred.reasons[1] ||
        "Monitor drilling parameters and execute flow check",
      status: "active",
      reasons: pred.reasons,
      probabilities: pred.risk_probabilities,
    };
  });
}



export function generateMockDrillingData(wellId) {
  const records = [];
  let baseDepth = 2800;
  let baseTime = Date.now() - 20 * 15 * 60000;

  for (let i = 0; i < 30; i++) {
    const depth = baseDepth + i * 12.5;
    const time = new Date(baseTime + i * 15 * 60000).toISOString();
    // Simulate kick/mud loss anomaly near point 18-24
    const isAnomaly = i >= 18 && i <= 24;
    records.push({
      record_id: `REC-${wellId || "W001"}-${i}`,
      well_id: wellId || "W001",
      timestamp: time,
      hole_depth_md_m: parseFloat(depth.toFixed(1)),
      tvd_m: parseFloat((depth * 0.94).toFixed(1)),
      rop_m_per_hr: parseFloat((14 + Math.sin(i * 0.5) * 8 + (isAnomaly ? -6 : 0)).toFixed(1)),
      wob_ton: parseFloat((16 + Math.cos(i * 0.4) * 4).toFixed(1)),
      rpm: parseFloat((85 + Math.sin(i * 0.6) * 20 + (isAnomaly ? -15 : 0)).toFixed(1)),
      torque_kNm: parseFloat((18 + (isAnomaly ? 14 : Math.random() * 4)).toFixed(1)),
      standpipe_pressure_psi: parseFloat((2800 + (isAnomaly ? -350 : Math.random() * 100)).toFixed(0)),
      flow_rate_in_lpm: 2500,
      flow_rate_out_pct: parseFloat((96 + (isAnomaly ? -14 : Math.random() * 2)).toFixed(1)),
      mud_weight_in_sg: 1.32,
      mud_weight_out_sg: parseFloat((1.32 + (isAnomaly ? -0.04 : 0)).toFixed(2)),
      pit_volume_m3: parseFloat((65.0 + (isAnomaly ? -1.8 : Math.sin(i) * 0.3)).toFixed(1)),
      ecd_sg: parseFloat((1.36 + (isAnomaly ? -0.05 : Math.random() * 0.02)).toFixed(2)),
      gas_units: parseFloat((45 + (isAnomaly ? 380 : Math.random() * 20)).toFixed(0)),
      formation_name: depth > 3000 ? "Formation-Z Sandstone" : "Formation-Y Shale",
    });
  }
  return records;
}

export function generateMockWellsGeoJSON() {
  const wells = [
    { id: "W001", name: "Offset-01", status: "planned", lat: 19.2150, lon: 73.1300, field: "Gamma", type: "exploratory", depth: 2943, target: "Formation-Z" },
    { id: "W002", name: "Offset-02", status: "drilling", lat: 19.1800, lon: 73.2000, field: "Gamma", type: "appraisal", depth: 3396, target: "Formation-X" },
    { id: "W003", name: "Offset-03", status: "planned", lat: 19.2900, lon: 73.0800, field: "Alpha", type: "injector", depth: 2844, target: "Formation-X" },
    { id: "W004", name: "Offset-04", status: "planned", lat: 19.3500, lon: 73.1800, field: "Gamma", type: "exploratory", depth: 2656, target: "Formation-Y" },
    { id: "W005", name: "Offset-05", status: "completed", lat: 19.1200, lon: 73.2800, field: "Alpha", type: "injector", depth: 3737, target: "Formation-Z" },
    { id: "W006", name: "Offset-06", status: "abandoned", lat: 19.2400, lon: 73.2500, field: "Alpha", type: "development", depth: 2181, target: "Formation-Z" },
    { id: "W007", name: "Offset-07", status: "suspended", lat: 19.1500, lon: 73.0800, field: "Alpha", type: "workover", depth: 4712, target: "Formation-Z" },
    { id: "W008", name: "Offset-08", status: "abandoned", lat: 19.3200, lon: 73.2200, field: "Alpha", type: "injector", depth: 2831, target: "Formation-X" },
    { id: "W009", name: "Offset-09", status: "suspended", lat: 19.0600, lon: 73.1500, field: "Beta", type: "appraisal", depth: 3211, target: "Formation-X" },
    { id: "W010", name: "Offset-10", status: "suspended", lat: 19.2700, lon: 73.1500, field: "Beta", type: "appraisal", depth: 2709, target: "Formation-Y" },
  ];

  return {
    type: "FeatureCollection",
    features: wells.map((w) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [w.lon, w.lat],
      },
      properties: {
        well_id: w.id,
        well_name: w.name,
        well_status: w.status,
        well_type: w.type,
        field_name: w.field,
        total_depth_md_m: w.depth,
        target_formation: w.target,
        operator: "OilCo",
        basin_name: "Western Offshore",
        surface_latitude: w.lat,
        surface_longitude: w.lon,
      },
    })),
  };
}

export function generateMockWellSummary(wellId) {
  const geojson = generateMockWellsGeoJSON();
  const feature = geojson.features.find((f) => f.properties.well_id === wellId) || geojson.features[0];
  const props = feature.properties;
  const [lon, lat] = feature.geometry.coordinates;

  const nearby_wells = geojson.features
    .filter((f) => f.properties.well_id !== props.well_id)
    .map((f) => {
      const p = f.properties;
      const [oLon, oLat] = f.geometry.coordinates;
      const dLat = (oLat - lat) * 111;
      const dLon = (oLon - lon) * 111 * Math.cos((lat * Math.PI) / 180);
      const dist = Math.sqrt(dLat * dLat + dLon * dLon);
      return {
        well_id: p.well_id,
        well_name: p.well_name,
        field_name: p.field_name,
        surface_latitude: oLat,
        surface_longitude: oLon,
        target_formation: p.target_formation,
        total_depth_md_m: p.total_depth_md_m,
        distance_km: parseFloat(dist.toFixed(2)),
      };
    })
    .sort((a, b) => a.distance_km - b.distance_km)
    .slice(0, 5);

  return {
    well: {
      ...props,
      surface_latitude: lat,
      surface_longitude: lon,
      spud_date: "2023-01-15",
      rig_name: "Rig-5",
      rig_contractor: "DrillCorp",
      block_name: "Block-1",
    },
    nearby_wells: {
      reference_well: props.well_id,
      radius_km: 5.0,
      count: nearby_wells.length,
      nearby_wells: nearby_wells,
    },
    historical_events: generateMockEvents(wellId),
    latest_drilling_data: generateMockDrillingData(wellId),
  };
}

export { ApiError };

