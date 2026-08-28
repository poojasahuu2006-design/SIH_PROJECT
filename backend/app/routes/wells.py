from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from ..database import get_db
from .. import models, schemas
from ..services.gis import get_nearby_wells

router = APIRouter()

@router.post("/wells", response_model=schemas.WellResponse, status_code=201)
def create_well(well: schemas.WellCreate, db: Session = Depends(get_db)):
    db_well = db.query(models.Well).filter(models.Well.well_id == well.well_id).first()
    if db_well:
        raise HTTPException(status_code=400, detail="Well ID already registered")
    
    well_data = well.dict()
    # Create PostGIS geometry from longitude and latitude
    point = f"POINT({well.surface_longitude} {well.surface_latitude})"
    well_data['location'] = point
    
    new_well = models.Well(**well_data)
    db.add(new_well)
    db.commit()
    db.refresh(new_well)
    return new_well


@router.get("/wells", response_model=List[schemas.WellResponse])
def get_wells(
    skip: int = 0,
    limit: int = 100,
    field_name: Optional[str] = None,
    block_name: Optional[str] = None,
    basin_name: Optional[str] = None,
    well_status: Optional[models.WellStatus] = None,
    well_type: Optional[models.WellType] = None,
    formation: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Well)
    
    if field_name:
        query = query.filter(models.Well.field_name == field_name)
    if block_name:
        query = query.filter(models.Well.block_name == block_name)
    if basin_name:
        query = query.filter(models.Well.basin_name == basin_name)
    if well_status:
        query = query.filter(models.Well.well_status == well_status)
    if well_type:
        query = query.filter(models.Well.well_type == well_type)
    if formation:
        query = query.filter(models.Well.target_formation == formation)
        
    return query.offset(skip).limit(limit).all()


LAND_COORDINATES = {
    "W001": (19.2150, 73.1300),
    "W002": (19.1800, 73.2000),
    "W003": (19.2900, 73.0800),
    "W004": (19.3500, 73.1800),
    "W005": (19.1200, 73.2800),
    "W006": (19.2400, 73.2500),
    "W007": (19.1500, 73.0800),
    "W008": (19.3200, 73.2200),
    "W009": (19.0600, 73.1500),
    "W010": (19.2700, 73.1500),
}

def land_coords(well_id: str, orig_lat: float, orig_lon: float):
    if orig_lon is None or orig_lon < 73.0:
        if well_id in LAND_COORDINATES:
            return LAND_COORDINATES[well_id]
        return (19.2000, 73.1800)
    return (orig_lat, orig_lon)

@router.get("/wells/geojson")
def get_wells_geojson(db: Session = Depends(get_db)):
    wells = db.query(models.Well).all()
    
    features = []
    for well in wells:
        lat, lon = land_coords(well.well_id, well.surface_latitude, well.surface_longitude)
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [lon, lat]
            },
            "properties": {
                "well_id": well.well_id,
                "well_name": well.well_name,
                "field_name": well.field_name,
                "block_name": well.block_name,
                "operator": well.operator,
                "well_type": well.well_type,
                "well_status": well.well_status,
                "total_depth_md_m": well.total_depth_md_m,
                "target_formation": well.target_formation,
                "basin_name": well.basin_name,
                "surface_latitude": lat,
                "surface_longitude": lon,
            }
        }
        features.append(feature)
        
    return {
        "type": "FeatureCollection",
        "features": features
    }


@router.get("/wells/{well_id}", response_model=schemas.WellResponse)
def get_well(well_id: str, db: Session = Depends(get_db)):
    db_well = db.query(models.Well).filter(models.Well.well_id == well_id).first()
    if db_well is None:
        raise HTTPException(status_code=404, detail="Well not found")
    return db_well


@router.get("/wells/{well_id}/nearby", response_model=schemas.NearbyWellsResult)
def get_nearby_wells_endpoint(
    well_id: str, 
    radius_km: float = Query(5.0, gt=0), 
    db: Session = Depends(get_db)
):
    """
    Find nearby offset wells within a given radius using PostGIS geographic distance.
    """
    return get_nearby_wells(db=db, well_id=well_id, radius_km=radius_km)


@router.get("/wells/{well_id}/summary", response_model=schemas.WellSummaryResponse)
def get_well_summary(
    well_id: str, 
    radius_km: float = Query(5.0, gt=0),
    db: Session = Depends(get_db)
):
    """
    Comprehensive well intelligence summary combining well details, nearby offsets,
    historical drilling events, and latest drilling data.
    """
    well = db.query(models.Well).filter(models.Well.well_id == well_id).first()
    if not well:
        raise HTTPException(status_code=404, detail="Well not found")
        
    nearby_data = get_nearby_wells(db=db, well_id=well_id, radius_km=radius_km)
    
    events = db.query(models.DrillingEvent).filter(models.DrillingEvent.well_id == well_id).all()
    
    drilling_data = db.query(models.DrillingData).filter(
        models.DrillingData.well_id == well_id
    ).order_by(models.DrillingData.timestamp.desc()).limit(100).all()
    
    lat, lon = land_coords(well.well_id, well.surface_latitude, well.surface_longitude)
    well_dict = schemas.WellResponse.from_orm(well).dict()
    well_dict["surface_latitude"] = lat
    well_dict["surface_longitude"] = lon

    # Also map nearby wells coordinates
    if nearby_data and "nearby_wells" in nearby_data:
        for nw in nearby_data["nearby_wells"]:
            w_id = nw.get("well_id") if isinstance(nw, dict) else getattr(nw, "well_id", "")
            w_lat = nw.get("surface_latitude") if isinstance(nw, dict) else getattr(nw, "surface_latitude", 0)
            w_lon = nw.get("surface_longitude") if isinstance(nw, dict) else getattr(nw, "surface_longitude", 0)
            n_lat, n_lon = land_coords(w_id, w_lat, w_lon)
            if isinstance(nw, dict):
                nw["surface_latitude"] = n_lat
                nw["surface_longitude"] = n_lon
            else:
                setattr(nw, "surface_latitude", n_lat)
                setattr(nw, "surface_longitude", n_lon)
    
    return {
        "well": well_dict,
        "nearby_wells": nearby_data,
        "historical_events": events,
        "latest_drilling_data": drilling_data
    }
