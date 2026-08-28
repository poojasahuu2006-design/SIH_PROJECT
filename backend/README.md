# Drilling Risk Backend

This is the P3 GIS + Backend module for the "Nearby Wells Intelligence System" hackathon project. It provides a FastAPI-based backend powered by PostgreSQL and PostGIS to supply nearby-well intelligence and historical drilling data to the P1 Risk Engine and P5 Dashboard.

## Prerequisites & Installation

### 1. PostgreSQL Installation
Install PostgreSQL (version 13+ recommended).
* Windows: Use the EnterpriseDB installer.
* Linux: `sudo apt install postgresql postgresql-contrib`
* Mac: `brew install postgresql`

### 2. PostGIS Installation
Install the PostGIS extension for your PostgreSQL version.
* Windows: Use the Application Stack Builder included with PostgreSQL to download and install PostGIS.
* Linux: `sudo apt install postgis postgresql-13-postgis-3` (adjust versions as needed).
* Mac: `brew install postgis`

### 3. Database Creation
Create a new database for the project (e.g., `gisdb`):
```sql
CREATE DATABASE gisdb;
```

### 4. PostGIS Extension Setup
Connect to the `gisdb` database and enable PostGIS:
```sql
\c gisdb;
CREATE EXTENSION postgis;
```
You can verify it by running: `SELECT postgis_full_version();`

### 5. Environment Variables
Copy `.env.example` to `.env` and configure your database URL and CORS origins:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/gisdb
CORS_ORIGINS=http://localhost:5173
```

### 6. Python Dependencies
Create a virtual environment and install dependencies:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 7. CSV Data Ingestion
To populate the database with data (either real P4 data or the synthetic demo data):
```bash
python seed_data.py
```
This script will parse the CSVs in the `data/` folder, validate them, generate PostGIS geometries, and insert records into the database while maintaining relationships.

### 8. Running the FastAPI Server
Start the development server using Uvicorn:
```bash
uvicorn app.main:app --reload
```

### 9. Swagger Documentation
Once the server is running, interactive API documentation is available at:
[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 10. API Endpoints
**Wells:**
* `GET /api/wells`: List wells (supports filtering)
* `GET /api/wells/{well_id}`: Get well details
* `POST /api/wells`: Create a well
* `GET /api/wells/geojson`: Return valid GeoJSON of all wells
* `GET /api/wells/{well_id}/nearby`: Find nearby offset wells (GIS)
* `GET /api/wells/{well_id}/summary`: Well intelligence summary

**Drilling Events:**
* `GET /api/events`: List events
* `GET /api/events/{event_id}`: Get event details
* `GET /api/events/well/{well_id}`: Get events for a specific well
* `POST /api/events`: Create an event

**Drilling Data:**
* `GET /api/drilling/{record_id}`: Get drilling data record
* `GET /api/drilling/well/{well_id}`: Get drilling data for a specific well
* `POST /api/drilling`: Create a drilling data record

### 11. Example Nearby-Well Query
Find all offset wells within 5km of well `W001`:
```bash
curl "http://127.0.0.1:8000/api/wells/W001/nearby?radius_km=5"
```
Response format:
```json
{
  "reference_well": "W001",
  "radius_km": 5,
  "count": 3,
  "nearby_wells": [
    {
      "well_id": "W002",
      "well_name": "Offset-02",
      "field_name": "Field-A",
      "surface_latitude": 19.0800,
      "surface_longitude": 72.8850,
      "target_formation": "Formation-X",
      "total_depth_md_m": 3400,
      "distance_km": 1.24
    }
  ]
}
```

### 12. Frontend Integration
The API supports CORS for `CORS_ORIGINS` specified in the `.env` file (e.g., React/Vite running on `http://localhost:5173`).
* Use the `/api/wells/geojson` endpoint to plot wells on frontend maps (like Mapbox or Leaflet).
* Use the `/api/wells/{well_id}/summary` endpoint to retrieve a unified snapshot of a well, its nearby offsets, and historical events to render the main intelligence dashboard.
