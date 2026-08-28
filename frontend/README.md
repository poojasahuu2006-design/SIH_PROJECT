# OilDrill — GIS Ops Console (P5 Frontend)

React + Leaflet dashboard for the P3 GIS backend. Plots every well on a map
(`GET /api/wells/geojson`) and shows a full well summary — details, offset
wells, event timeline, latest drilling parameters — on selection
(`GET /api/wells/{well_id}/summary`).

## Run it

```bash
npm install
cp .env.example .env   # adjust VITE_API_BASE_URL if the backend has moved
npm run dev
```

Opens at `http://localhost:5173`. You can also change the API base URL live
from the top bar — it's saved to `localStorage` so it persists on reload.

## Before this works against the real backend

**CORS.** The backend is a separate origin (`10.96.137.214:8000`) from this
app (`localhost:5173`), so the browser will block the requests until FastAPI
allows it. Ask Siddhi to add, in the backend's `main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or the specific frontend origin(s) in prod
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Without this you'll see the connection light in the header go red with a
"Could not reach ..." message even though the backend is up.

**Network reachability.** `10.96.137.214` is a LAN address — this only works
if your machine is on the same network as Siddhi's, and only while her
machine is running the backend. If it's moved to a shared/deployed host,
update `.env` or the URL field in the header.

## Schema note

This was built from the field names mentioned in the announcement (`well_id`,
NPT, kicks, stuck pipe, mud weight, depth, severity, event_type, etc.), not
a locked-in copy of the Swagger schema. `src/lib/pick.js` lists a few likely
key-name aliases per field (e.g. `depth` / `current_depth` / `measured_depth`)
so the UI degrades gracefully rather than breaking on a mismatch — any field
it doesn't recognize still shows up in a generic key/value list rather than
being silently dropped. Once the real response shape is confirmed against
`/docs`, trim each alias list in `pick.js` down to the one true key.

## Structure

```
src/
  api.js                  fetch helpers for the two endpoints
  lib/pick.js             defensive field-name lookup + formatting
  components/
    ConsoleHeader.jsx      API base URL + connection status
    Sidebar.jsx            searchable well list
    MapView.jsx            Leaflet map (react-leaflet)
    WellSummaryPanel.jsx   details / offsets / timeline / drilling params
    DepthGauge.jsx         depth readout for the selected well
    KeyValueList.jsx       generic fallback renderer for unmapped fields
```

## Not yet wired up

- `POST /api/events` (P2's ingestion endpoint) — not part of this dashboard,
  but `src/api.js` is the place to add it if a manual entry form is wanted later.
- Risk predictions (P1) aren't surfaced here; this console is map + summary only.
