# 🛢️ OilDrill - Intelligence Ops Console & AI Predictive Analytics

A high-performance, real-time offshore & onshore drilling intelligence system featuring interactive GIS mapping, AI risk prediction, telemetry parameter curves, and operational anomaly detection. Integrated with the P1 Machine Learning Model research baseline ([amitmishra61724-oss/oildrill](https://github.com/amitmishra61724-oss/oildrill)).

---

## 🌟 Key Features

- 🗺️ **GIS Map & Well Visualizer**: Interactive Leaflet-based spatial visualization with land-constrained coordinate boundaries.
- 🚨 **AI Predictive Risk & Anomaly Alerts**: Real-time multi-label risk predictions (Kick, Mud Loss, Stuck Pipe, NPT, Well Control) powered by Isolation Forest anomaly detection and SHAP feature explainability.
- 📈 **Operational Parameter Trends**: Live depth-progression telemetry curves (ROP, Torque, SPP, Flow Rate, Gas Spikes) with red anomaly highlight bands.
- 📊 **KPIs & Risk Matrix Dashboard**: Operational safety matrix and real-time drill site statistics.
- 🛡️ **Pore Pressure & Offset Well Profiling**: Complete offset comparison across 10 monitored wells.

---

## 🏗️ Repository Architecture

```
oildrill-frontend/
├── frontend/             # React + Vite UI console
│   ├── src/
│   │   ├── components/   # GIS Map, Predictive Alerts Panel, Charts, KPIs
│   │   ├── api.js        # Thin client API layer & P1 ML Model baseline
│   │   ├── App.jsx       # Main console view switcher
│   │   └── main.jsx      # React entrypoint wrapped in ErrorBoundary
│   ├── .env.example
│   └── package.json
├── backend/              # FastAPI Python Backend
│   ├── app/              # Routes, events, wells endpoints
│   ├── data/             # CSV wells & telemetry datasets
│   ├── .env.example
│   └── requirements.txt
├── .gitignore            # Git protection rules
└── README.md             # Project documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: `v18+` or `v20+`
- **Python**: `v3.10+`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Backend Setup
```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate

# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

---

## 🧪 P1 Machine Learning Model Specifications

The predictive alerts panel utilizes the P1 ML model baseline:
- **Algorithms**: Isolation Forest (Anomaly Detection) & Multi-Label Classifiers
- **Monitored Risks**: NPT, Kick Influx, Mud Loss, Stuck Pipe, Well Control
- **Explainability**: SHAP (SHapley Additive exPlanations) values for sensor-level root cause diagnosis.

---

## 📄 License
MIT License. Built for OilDrill Operational Risk Management.
