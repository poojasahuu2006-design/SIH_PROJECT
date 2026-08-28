from sqlalchemy.orm import Session
from sqlalchemy import func
from geoalchemy2.types import Geography
from ..models import Well
from fastapi import HTTPException

def get_nearby_wells(db: Session, well_id: str, radius_km: float):
    # Find the reference well
    reference_well = db.query(Well).filter(Well.well_id == well_id).first()
    if not reference_well:
        raise HTTPException(status_code=404, detail=f"Well with ID {well_id} not found")

    if reference_well.location is None:
        raise HTTPException(status_code=400, detail=f"Reference well {well_id} has no location data")

    # PostGIS query: Find wells within radius_km (converted to meters)
    # Using Geography cast for accurate distance calculations on SRID 4326 (WGS 84)
    radius_meters = radius_km * 1000.0

    # Create a PostGIS point directly from the reference well's coordinates to avoid WKB conversion issues
    ref_point = func.ST_SetSRID(func.ST_MakePoint(reference_well.surface_longitude, reference_well.surface_latitude), 4326)

    # Query for nearby wells excluding the reference well itself
    nearby_query = db.query(
        Well,
        func.ST_Distance(
            func.cast(Well.location, Geography),
            func.cast(ref_point, Geography)
        ).label('distance_meters')
    ).filter(
        Well.well_id != well_id,
        func.ST_DWithin(
            func.cast(Well.location, Geography),
            func.cast(ref_point, Geography),
            radius_meters
        )
    ).order_by('distance_meters').all()

    # Format the results
    nearby_wells_data = []
    for well, dist_m in nearby_query:
        nearby_wells_data.append({
            "well_id": well.well_id,
            "well_name": well.well_name,
            "field_name": well.field_name,
            "surface_latitude": well.surface_latitude,
            "surface_longitude": well.surface_longitude,
            "target_formation": well.target_formation,
            "total_depth_md_m": well.total_depth_md_m,
            "distance_km": round(dist_m / 1000.0, 3) if dist_m is not None else 0.0
        })

    return {
        "reference_well": well_id,
        "radius_km": radius_km,
        "count": len(nearby_wells_data),
        "nearby_wells": nearby_wells_data
    }
