import { useCallback, useEffect, useState } from "react";
import ConsoleHeader from "./components/ConsoleHeader";
import Sidebar from "./components/Sidebar";
import MapView from "./components/MapView";
import WellSummaryPanel from "./components/WellSummaryPanel";
import PredictiveAlertsPanel from "./components/PredictiveAlertsPanel";
import ParameterCharts from "./components/ParameterCharts";
import KpiDashboard from "./components/KpiDashboard";
import RiskMatrixDashboard from "./components/RiskMatrixDashboard";
import HistoricalReportsPanel from "./components/HistoricalReportsPanel";
import {
  fetchWellsGeoJSON,
  fetchWellSummary,
  fetchPredictiveAlerts,
  fetchDrillingData,
  generateMockPredictiveAlerts,
  getStoredBaseUrl,
  setStoredBaseUrl,
} from "./api";
import "./App.css";

export default function App() {
  const [baseUrl, setBaseUrl] = useState(getStoredBaseUrl);
  const [connectionStatus, setConnectionStatus] = useState("idle"); // idle | loading | ok | error

  const handleUpdateBaseUrl = (newUrl) => {
    const cleanUrl = newUrl.trim().replace(/\/$/, "");
    setStoredBaseUrl(cleanUrl);
    setBaseUrl(cleanUrl);
  };

  const [activeView, setActiveView] = useState("map"); // map | alerts | kpis | charts | pressure

  const [features, setFeatures] = useState([]);
  const [wellsError, setWellsError] = useState(null);
  const [wellsLoading, setWellsLoading] = useState(false);

  const [selectedId, setSelectedId] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  // Predictive Alerts & Telemetry State
  const [alerts, setAlerts] = useState(() => generateMockPredictiveAlerts());
  const [alertsLoading, setAlertsLoading] = useState(false);

  const [drillingData, setDrillingData] = useState([]);
  const [drillingLoading, setDrillingLoading] = useState(false);

  const loadWells = useCallback(async (url) => {
    setWellsLoading(true);
    setWellsError(null);
    setConnectionStatus("loading");
    try {
      const geojson = await fetchWellsGeoJSON(url);
      const featureList = Array.isArray(geojson?.features) ? geojson.features : [];
      setFeatures(featureList);
      if (featureList.length > 0 && !selectedId) {
        setSelectedId(featureList[0].properties?.well_id);
      }
      setConnectionStatus("ok");
    } catch (err) {
      setWellsError(err.message);
      setConnectionStatus("error");
      setFeatures([]);
    } finally {
      setWellsLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    loadWells(baseUrl);
  }, [baseUrl, loadWells]);

  // Load Predictive Alerts
  useEffect(() => {
    setAlertsLoading(true);
    fetchPredictiveAlerts(baseUrl, selectedId)
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAlerts(data);
        } else {
          setAlerts(generateMockPredictiveAlerts(selectedId));
        }
      })
      .catch(() => setAlerts(generateMockPredictiveAlerts(selectedId)))
      .finally(() => setAlertsLoading(false));
  }, [baseUrl, selectedId]);

  // Load Well Summary
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    setSummaryLoading(true);
    setSummaryError(null);
    fetchWellSummary(baseUrl, selectedId)
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch((err) => {
        if (!cancelled) setSummaryError(err.message);
      })
      .finally(() => {
        if (!cancelled) setSummaryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [baseUrl, selectedId]);

  // Load Drilling Telemetry Data for selected well
  useEffect(() => {
    if (!selectedId) return;
    setDrillingLoading(true);
    fetchDrillingData(baseUrl, selectedId)
      .then((data) => setDrillingData(data))
      .catch(() => setDrillingData([]))
      .finally(() => setDrillingLoading(false));
  }, [baseUrl, selectedId]);

  return (
    <div className="app">
      <ConsoleHeader
        status={connectionStatus}
        baseUrl={baseUrl}
        onUpdateBaseUrl={handleUpdateBaseUrl}
        onRetry={() => loadWells(baseUrl)}
        activeView={activeView}
        onViewChange={setActiveView}
        alertCount={alerts.filter((a) => a.severity === "critical" || a.severity === "high").length}
      />

      {activeView === "map" && (
        <div className="app__body">
          <Sidebar
            features={features}
            selectedId={selectedId}
            onSelect={setSelectedId}
            loading={wellsLoading}
            error={wellsError}
          />
          <MapView
            features={features}
            selectedId={selectedId}
            onSelect={setSelectedId}
            summary={summary}
          />
          <WellSummaryPanel
            summary={summary}
            loading={summaryLoading}
            error={summaryError}
            wellId={selectedId}
            onSelectWell={setSelectedId}
          />
        </div>
      )}

      {activeView === "alerts" && (
        <div className="app__full-view">
          <PredictiveAlertsPanel
            alerts={alerts}
            loading={alertsLoading}
            onSelectWell={setSelectedId}
            onSelectView={setActiveView}
          />
        </div>
      )}

      {activeView === "kpis" && (
        <div className="app__full-view">
          <KpiDashboard
            wells={features}
            alerts={alerts}
            onSelectWell={setSelectedId}
            onSelectView={setActiveView}
          />
        </div>
      )}

      {activeView === "charts" && (
        <div className="app__full-view">
          <ParameterCharts
            wells={features}
            selectedWellId={selectedId}
            drillingData={drillingData}
            loading={drillingLoading}
            onSelectWell={setSelectedId}
          />
        </div>
      )}

      {activeView === "pressure" && (
        <div className="app__full-view">
          <RiskMatrixDashboard wells={features} />
        </div>
      )}

      {activeView === "historical" && (
        <HistoricalReportsPanel baseUrl={baseUrl} onUpdateBaseUrl={handleUpdateBaseUrl} />
      )}
    </div>
  );
}

