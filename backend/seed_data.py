import os
import pandas as pd
from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from app.database import engine, SessionLocal, Base
from app import models

# Load env variables for DB connection
load_dotenv()

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
WELLS_CSV = os.path.join(DATA_DIR, "wells.csv")
EVENTS_CSV = os.path.join(DATA_DIR, "drilling_events.csv")
DATA_CSV = os.path.join(DATA_DIR, "drilling_data.csv")

def generate_synthetic_data():
    print("Generating Synthetic demo data — not real operational drilling data...")
    os.makedirs(DATA_DIR, exist_ok=True)
    
    # 1. Generate Wells
    wells_data = []
    statuses = ["planned", "drilling", "completed", "producing", "abandoned", "suspended"]
    types = ["exploratory", "development", "appraisal", "injector", "workover"]
    
    for i in range(1, 11):
        well_id = f"W{i:03d}"
        wells_data.append({
            "well_id": well_id,
            "well_name": f"Offset-{i:02d}",
            "field_name": random.choice(["Alpha", "Beta", "Gamma"]),
            "block_name": random.choice(["Block-1", "Block-2"]),
            "operator": "OilCo",
            "well_type": random.choice(types),
            "well_status": random.choice(statuses),
            "spud_date": "2023-01-15",
            "rig_release_date": "2023-03-20",
            # Generate points near each other on solid land mass (Kalyan / Badlapur / Karjat inland)
            "surface_latitude": 19.08 + random.uniform(0.0, 0.25),
            "surface_longitude": 73.08 + random.uniform(0.0, 0.20),
            "bottom_latitude": 19.08 + random.uniform(0.0, 0.25),
            "bottom_longitude": 73.08 + random.uniform(0.0, 0.20),
            "ground_elevation_m": random.uniform(10, 100),
            "total_depth_md_m": random.uniform(2000, 5000),
            "total_depth_tvd_m": random.uniform(1900, 4800),
            "well_trajectory": random.choice(["vertical", "directional", "horizontal", "multilateral"]),
            "target_formation": random.choice(["Formation-X", "Formation-Y", "Formation-Z"]),
            "rig_name": f"Rig-{random.randint(1,5)}",
            "rig_contractor": "DrillCorp",
            "spacing_distance_km": random.uniform(0.5, 2.0),
            "basin_name": "Western Offshore",
            "remarks": "Synthetic data well"
        })
    pd.DataFrame(wells_data).to_csv(WELLS_CSV, index=False)
    
    # 2. Generate Events
    events_data = []
    event_types = ["NPT", "kick", "stuck_pipe", "lost_circulation", "well_control", "formation_top", "mud_loss"]
    severities = ["low", "medium", "high", "critical"]
    
    event_idx = 1
    for w in wells_data:
        for _ in range(random.randint(1, 4)):
            events_data.append({
                "event_id": f"EVT{event_idx:04d}",
                "well_id": w["well_id"],
                "event_type": random.choice(event_types),
                "event_category": random.choice(["planned", "unplanned"]),
                "phase": random.choice(["drilling", "tripping", "casing", "cementing"]),
                "start_time": "2023-02-01 10:00:00",
                "end_time": "2023-02-01 14:00:00",
                "duration_hours": random.uniform(1, 10),
                "depth_md_m": random.uniform(500, w["total_depth_md_m"]),
                "depth_tvd_m": random.uniform(500, w["total_depth_tvd_m"]),
                "formation_name": w["target_formation"],
                "severity": random.choice(severities),
                "description": "Synthetic drilling event",
                "root_cause": "Unknown",
                "corrective_action": "Monitored",
                "cost_impact_inr": random.uniform(100000, 5000000),
                "mud_weight_at_event": random.uniform(1.1, 1.5),
                "data_source": "Daily Drilling Report"
            })
            event_idx += 1
    pd.DataFrame(events_data).to_csv(EVENTS_CSV, index=False)
    
    # 3. Generate Drilling Data
    drilling_data = []
    data_idx = 1
    for w in wells_data:
        current_depth = 500.0
        current_time = datetime(2023, 1, 15, 8, 0, 0)
        
        for _ in range(20): # 20 records per well
            drilling_data.append({
                "record_id": f"DD{data_idx:05d}",
                "well_id": w["well_id"],
                "timestamp": current_time.strftime("%Y-%m-%d %H:%M:%S"),
                "hole_depth_md_m": current_depth,
                "bit_depth_md_m": current_depth,
                "tvd_m": current_depth * 0.95,
                "rop_m_per_hr": random.uniform(5, 30),
                "wob_ton": random.uniform(10, 25),
                "rpm": random.uniform(60, 120),
                "torque_kNm": random.uniform(10, 30),
                "standpipe_pressure_psi": random.uniform(2000, 4000),
                "flow_rate_in_lpm": random.uniform(1500, 3000),
                "flow_rate_out_pct": random.uniform(90, 100),
                "mud_weight_in_sg": random.uniform(1.2, 1.4),
                "mud_weight_out_sg": random.uniform(1.2, 1.4),
                "pit_volume_m3": random.uniform(50, 80),
                "hook_load_ton": random.uniform(100, 200),
                "block_position_m": random.uniform(10, 30),
                "ecd_sg": random.uniform(1.25, 1.45),
                "gas_units": random.uniform(10, 500),
                "bit_type": "PDC",
                "hole_diameter_in": 12.25,
                "casing_size_in": 13.375,
                "formation_name": w["target_formation"],
                "activity_code": "drilling"
            })
            current_depth += random.uniform(10, 50)
            current_time += timedelta(minutes=15)
            data_idx += 1
    pd.DataFrame(drilling_data).to_csv(DATA_CSV, index=False)
    print("Synthetic data generated successfully.")

def clean_nan(val):
    return None if pd.isna(val) else val

def ingest_data(db: Session):
    # Ensure tables are created
    Base.metadata.create_all(bind=engine)
    
    # 1. Ingest Wells
    print("Ingesting Wells...")
    wells_df = pd.read_csv(WELLS_CSV)
    for _, row in wells_df.iterrows():
        # Check if exists
        existing = db.query(models.Well).filter(models.Well.well_id == row['well_id']).first()
        if existing:
            continue
            
        location_point = f"POINT({row['surface_longitude']} {row['surface_latitude']})"
        
        well = models.Well(
            well_id=row['well_id'],
            well_name=clean_nan(row['well_name']),
            field_name=clean_nan(row['field_name']),
            block_name=clean_nan(row['block_name']),
            operator=clean_nan(row['operator']),
            well_type=clean_nan(row['well_type']),
            well_status=clean_nan(row['well_status']),
            spud_date=clean_nan(row.get('spud_date')),
            rig_release_date=clean_nan(row.get('rig_release_date')),
            surface_latitude=row['surface_latitude'],
            surface_longitude=row['surface_longitude'],
            bottom_latitude=clean_nan(row.get('bottom_latitude')),
            bottom_longitude=clean_nan(row.get('bottom_longitude')),
            ground_elevation_m=clean_nan(row.get('ground_elevation_m')),
            total_depth_md_m=clean_nan(row.get('total_depth_md_m')),
            total_depth_tvd_m=clean_nan(row.get('total_depth_tvd_m')),
            well_trajectory=clean_nan(row.get('well_trajectory')),
            target_formation=clean_nan(row.get('target_formation')),
            rig_name=clean_nan(row.get('rig_name')),
            rig_contractor=clean_nan(row.get('rig_contractor')),
            spacing_distance_km=clean_nan(row.get('spacing_distance_km')),
            basin_name=clean_nan(row.get('basin_name')),
            remarks=clean_nan(row.get('remarks')),
            location=location_point
        )
        db.add(well)
    db.commit()

    # 2. Ingest Events
    print("Ingesting Events...")
    events_df = pd.read_csv(EVENTS_CSV)
    for _, row in events_df.iterrows():
        existing = db.query(models.DrillingEvent).filter(models.DrillingEvent.event_id == row['event_id']).first()
        if existing:
            continue
            
        event = models.DrillingEvent(
            event_id=row['event_id'],
            well_id=row['well_id'],
            event_type=clean_nan(row['event_type']),
            event_category=clean_nan(row['event_category']),
            phase=clean_nan(row['phase']),
            start_time=clean_nan(row['start_time']),
            end_time=clean_nan(row.get('end_time')),
            duration_hours=clean_nan(row.get('duration_hours')),
            depth_md_m=clean_nan(row.get('depth_md_m')),
            depth_tvd_m=clean_nan(row.get('depth_tvd_m')),
            formation_name=clean_nan(row.get('formation_name')),
            severity=clean_nan(row.get('severity')),
            description=clean_nan(row.get('description')),
            root_cause=clean_nan(row.get('root_cause')),
            corrective_action=clean_nan(row.get('corrective_action')),
            cost_impact_inr=clean_nan(row.get('cost_impact_inr')),
            mud_weight_at_event=clean_nan(row.get('mud_weight_at_event')),
            data_source=clean_nan(row.get('data_source'))
        )
        db.add(event)
    db.commit()

    # 3. Ingest Drilling Data
    print("Ingesting Drilling Data...")
    data_df = pd.read_csv(DATA_CSV)
    for _, row in data_df.iterrows():
        existing = db.query(models.DrillingData).filter(models.DrillingData.record_id == row['record_id']).first()
        if existing:
            continue
            
        record = models.DrillingData(
            record_id=row['record_id'],
            well_id=row['well_id'],
            timestamp=clean_nan(row['timestamp']),
            hole_depth_md_m=clean_nan(row.get('hole_depth_md_m')),
            bit_depth_md_m=clean_nan(row.get('bit_depth_md_m')),
            tvd_m=clean_nan(row.get('tvd_m')),
            rop_m_per_hr=clean_nan(row.get('rop_m_per_hr')),
            wob_ton=clean_nan(row.get('wob_ton')),
            rpm=clean_nan(row.get('rpm')),
            torque_kNm=clean_nan(row.get('torque_kNm')),
            standpipe_pressure_psi=clean_nan(row.get('standpipe_pressure_psi')),
            flow_rate_in_lpm=clean_nan(row.get('flow_rate_in_lpm')),
            flow_rate_out_pct=clean_nan(row.get('flow_rate_out_pct')),
            mud_weight_in_sg=clean_nan(row.get('mud_weight_in_sg')),
            mud_weight_out_sg=clean_nan(row.get('mud_weight_out_sg')),
            pit_volume_m3=clean_nan(row.get('pit_volume_m3')),
            hook_load_ton=clean_nan(row.get('hook_load_ton')),
            block_position_m=clean_nan(row.get('block_position_m')),
            ecd_sg=clean_nan(row.get('ecd_sg')),
            gas_units=clean_nan(row.get('gas_units')),
            bit_type=clean_nan(row.get('bit_type')),
            hole_diameter_in=clean_nan(row.get('hole_diameter_in')),
            casing_size_in=clean_nan(row.get('casing_size_in')),
            formation_name=clean_nan(row.get('formation_name')),
            activity_code=clean_nan(row.get('activity_code'))
        )
        db.add(record)
    db.commit()
    print("Ingestion complete.")

if __name__ == "__main__":
    if not (os.path.exists(WELLS_CSV) and os.path.exists(EVENTS_CSV) and os.path.exists(DATA_CSV)):
        generate_synthetic_data()
    
    db = SessionLocal()
    try:
        ingest_data(db)
    finally:
        db.close()
