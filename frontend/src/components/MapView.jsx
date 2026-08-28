import { useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Circle,
  Polyline,
  Tooltip,
  useMap,
} from "react-leaflet";
import { WELL_ID_KEYS, WELL_NAME_KEYS, STATUS_KEYS, pick } from "../lib/pick";
import { ensureLandCoords } from "../api";
import "leaflet/dist/leaflet.css";
import "./MapView.css";

// Solid inland land region (Kalyan / Thane / Badlapur / Karjat onshore area)
const DEFAULT_CENTER = [19.20, 73.18];
const DEFAULT_ZOOM = 10;

const COLORS = {
  red: "#e85c4a",
  amber: "#f2a93b",
  teal: "#3fbf9e",
  blue: "#5b9bd5",
  mutedRed: "#b56b6b",
  steel: "#8a979c",
  bone: "#e7e4da",
  gold: "#ffd700",
};

function statusColor(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("alert") || s.includes("kick") || s.includes("npt")) return COLORS.red;
  if (s.includes("active") || s.includes("drilling")) return COLORS.amber;
  if (s.includes("complete") || s.includes("producing")) return COLORS.teal;
  if (s.includes("planned")) return COLORS.blue;
  if (s.includes("abandoned")) return COLORS.mutedRed;
  return COLORS.steel;
}

// Extract [lat, lon] defensively from various feature shapes & ensure land coordinates
function getCoords(f) {
  if (!f) return null;
  const props = f.properties || f;
  const wellId = pick(props, WELL_ID_KEYS, f.id || "");

  let lon = null;
  let lat = null;

  if (f.geometry?.coordinates && Array.isArray(f.geometry.coordinates) && f.geometry.coordinates.length >= 2) {
    lon = Number(f.geometry.coordinates[0]);
    lat = Number(f.geometry.coordinates[1]);
  } else {
    lat = Number(props.surface_latitude ?? props.latitude ?? props.lat);
    lon = Number(props.surface_longitude ?? props.longitude ?? props.lon ?? props.lng);
  }

  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    return ensureLandCoords(lat, lon, wellId);
  }

  return ensureLandCoords(null, null, wellId);
}

// Invalidate container size & fit map bounds to oil drills
function MapController({ points }) {
  const map = useMap();
  const pointsKey = points.map((p) => `${p.id}:${p.latlng[0]},${p.latlng[1]}`).join("|");

  useEffect(() => {
    // Force Leaflet to recalculate container dimensions in flex layout
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0].latlng, 10);
    } else {
      map.fitBounds(
        points.map((p) => p.latlng),
        { padding: [50, 50], maxZoom: 12 }
      );
    }
  }, [pointsKey, map, points]);

  return null;
}

function FocusSelectedWell({ points, selectedId }) {
  const map = useMap();
  const lastSelectedRef = useRef(null);

  useEffect(() => {
    if (!selectedId || lastSelectedRef.current === selectedId) return;
    const selected = points.find((point) => String(point.id) === String(selectedId));
    if (selected) {
      map.flyTo(selected.latlng, 10, { duration: 0.8 });
      lastSelectedRef.current = selectedId;
    }
  }, [map, points, selectedId]);

  return null;
}

export default function MapView({ features = [], selectedId, onSelect, summary }) {
  const points = useMemo(() => {
    return features
      .map((f) => {
        const latlng = getCoords(f);
        if (!latlng) return null;
        const props = f.properties || f;
        return {
          id: pick(props, WELL_ID_KEYS, f.id),
          name: pick(props, WELL_NAME_KEYS, "Unnamed well"),
          status: pick(props, STATUS_KEYS, null),
          latlng,
          raw: props,
        };
      })
      .filter(Boolean);
  }, [features]);

  // Selected well point
  const selectedPoint = useMemo(() => {
    return points.find((p) => String(p.id) === String(selectedId));
  }, [points, selectedId]);

  // Nearby offset wells from summary
  const offsetLines = useMemo(() => {
    if (!selectedPoint || !summary) return [];
    const rawOffsets =
      summary.nearby_wells?.nearby_wells ||
      (Array.isArray(summary.nearby_wells) ? summary.nearby_wells : []);

    return rawOffsets
      .map((off) => {
        const offId = pick(off, WELL_ID_KEYS, off.well_id);
        const offLat = Number(off.surface_latitude ?? off.lat);
        const offLon = Number(off.surface_longitude ?? off.lon);
        const [landLat, landLon] = ensureLandCoords(offLat, offLon, offId);

        const offName = pick(off, WELL_NAME_KEYS, off.well_name || `Offset ${offId}`);
        const distKm = off.distance_km ?? off.distance;

        return {
          id: offId,
          name: offName,
          from: selectedPoint.latlng,
          to: [landLat, landLon],
          distKm,
        };
      })
      .filter(Boolean);
  }, [selectedPoint, summary]);

  return (
    <div className="map-view">
      <MapContainer
        center={selectedPoint ? selectedPoint.latlng : DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="map-view__container"
        preferCanvas
      >
        <TileLayer
          attribution='Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
        />

        <MapController points={points} />
        <FocusSelectedWell points={points} selectedId={selectedId} />

        {/* 5km GIS Offset radius circle around selected oil drill */}
        {selectedPoint && (
          <Circle
            center={selectedPoint.latlng}
            radius={5000}
            pathOptions={{
              color: "#3fbf9e",
              fillColor: "#3fbf9e",
              fillOpacity: 0.08,
              weight: 1.5,
              dashArray: "6, 6",
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -20]} opacity={0.85}>
              <span className="map-view__radius-tag">5 km Intelligence Boundary</span>
            </Tooltip>
          </Circle>
        )}

        {/* Lines connecting selected oil drill to offset wells */}
        {offsetLines.map((line, idx) => (
          <Polyline
            key={`line-${line.id || idx}`}
            positions={[line.from, line.to]}
            pathOptions={{
              color: "#f2a93b",
              weight: 2,
              dashArray: "4, 6",
              opacity: 0.85,
            }}
          >
            {line.distKm !== undefined && (
              <Tooltip sticky direction="center">
                <span className="map-view__offset-line-tag">
                  {line.name}: {line.distKm} km away
                </span>
              </Tooltip>
            )}
          </Polyline>
        ))}

        {/* Oil Drill Markers */}
        {points.map((p) => {
          const isSelected = String(p.id) === String(selectedId);
          return (
            <CircleMarker
              key={p.id}
              center={p.latlng}
              radius={isSelected ? 10 : 7}
              pathOptions={{
                color: isSelected ? COLORS.gold : statusColor(p.status),
                weight: isSelected ? 3 : 1.5,
                fillColor: statusColor(p.status),
                fillOpacity: isSelected ? 1 : 0.85,
              }}
              eventHandlers={{ click: () => onSelect(p.id) }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                <div className="map-view__tooltip-box">
                  <span className="map-view__tooltip-title">{p.name}</span>
                  <span className="map-view__tooltip-sub">ID: {p.id}</span>
                  {p.status && (
                    <span
                      className="map-view__tooltip-status"
                      style={{ color: statusColor(p.status) }}
                    >
                      • {p.status}
                    </span>
                  )}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Map Legend */}
      <div className="map-view__legend">
        <span className="legend-title">Oil Drill Status</span>
        <div className="legend-items">
          <div className="legend-item">
            <span className="dot" style={{ background: COLORS.amber }} /> Drilling
          </div>
          <div className="legend-item">
            <span className="dot" style={{ background: COLORS.blue }} /> Planned
          </div>
          <div className="legend-item">
            <span className="dot" style={{ background: COLORS.teal }} /> Producing
          </div>
          <div className="legend-item">
            <span className="dot" style={{ background: COLORS.mutedRed }} /> Abandoned
          </div>
          <div className="legend-item">
            <span className="dot" style={{ background: COLORS.steel }} /> Suspended
          </div>
        </div>
      </div>

      {points.length === 0 && (
        <div className="map-view__empty">No wells to plot yet.</div>
      )}
    </div>
  );
}

