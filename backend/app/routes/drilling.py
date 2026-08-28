from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from .. import models, schemas

router = APIRouter()

@router.post("/drilling", response_model=schemas.DrillingDataResponse, status_code=201)
def create_drilling_record(record: schemas.DrillingDataCreate, db: Session = Depends(get_db)):
    # Verify well exists
    well = db.query(models.Well).filter(models.Well.well_id == record.well_id).first()
    if not well:
        raise HTTPException(status_code=400, detail="Referenced Well ID does not exist")
        
    db_record = db.query(models.DrillingData).filter(models.DrillingData.record_id == record.record_id).first()
    if db_record:
        raise HTTPException(status_code=400, detail="Record ID already registered")
        
    new_record = models.DrillingData(**record.dict())
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record


@router.get("/drilling/well/{well_id}", response_model=List[schemas.DrillingDataResponse])
def get_drilling_data_for_well(
    well_id: str,
    skip: int = 0,
    limit: int = 100,
    min_depth: Optional[float] = None,
    max_depth: Optional[float] = None,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    activity_code: Optional[models.ActivityCode] = None,
    formation_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.DrillingData).filter(models.DrillingData.well_id == well_id)
    
    if min_depth is not None:
        query = query.filter(models.DrillingData.hole_depth_md_m >= min_depth)
    if max_depth is not None:
        query = query.filter(models.DrillingData.hole_depth_md_m <= max_depth)
    if start_time:
        query = query.filter(models.DrillingData.timestamp >= start_time)
    if end_time:
        query = query.filter(models.DrillingData.timestamp <= end_time)
    if activity_code:
        query = query.filter(models.DrillingData.activity_code == activity_code)
    if formation_name:
        query = query.filter(models.DrillingData.formation_name == formation_name)
        
    return query.order_by(models.DrillingData.timestamp.desc()).offset(skip).limit(limit).all()


@router.get("/drilling/{record_id}", response_model=schemas.DrillingDataResponse)
def get_drilling_record(record_id: str, db: Session = Depends(get_db)):
    db_record = db.query(models.DrillingData).filter(models.DrillingData.record_id == record_id).first()
    if db_record is None:
        raise HTTPException(status_code=404, detail="Drilling data record not found")
    return db_record
