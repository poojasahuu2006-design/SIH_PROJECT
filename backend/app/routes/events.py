from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from ..database import get_db
from .. import models, schemas

router = APIRouter()

@router.post("/events", response_model=schemas.DrillingEventResponse, status_code=201)
def create_event(event: schemas.DrillingEventCreate, db: Session = Depends(get_db)):
    # Verify well exists
    well = db.query(models.Well).filter(models.Well.well_id == event.well_id).first()
    if not well:
        raise HTTPException(status_code=400, detail="Referenced Well ID does not exist")
        
    db_event = db.query(models.DrillingEvent).filter(models.DrillingEvent.event_id == event.event_id).first()
    if db_event:
        raise HTTPException(status_code=400, detail="Event ID already registered")
        
    new_event = models.DrillingEvent(**event.dict())
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event


@router.get("/events", response_model=List[schemas.DrillingEventResponse])
def get_events(
    skip: int = 0,
    limit: int = 100,
    event_type: Optional[models.EventType] = None,
    severity: Optional[models.Severity] = None,
    formation_name: Optional[str] = None,
    min_depth: Optional[float] = None,
    max_depth: Optional[float] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.DrillingEvent)
    
    if event_type:
        query = query.filter(models.DrillingEvent.event_type == event_type)
    if severity:
        query = query.filter(models.DrillingEvent.severity == severity)
    if formation_name:
        query = query.filter(models.DrillingEvent.formation_name == formation_name)
    if min_depth is not None:
        query = query.filter(models.DrillingEvent.depth_md_m >= min_depth)
    if max_depth is not None:
        query = query.filter(models.DrillingEvent.depth_md_m <= max_depth)
        
    return query.offset(skip).limit(limit).all()


@router.get("/events/{event_id}", response_model=schemas.DrillingEventResponse)
def get_event(event_id: str, db: Session = Depends(get_db)):
    db_event = db.query(models.DrillingEvent).filter(models.DrillingEvent.event_id == event_id).first()
    if db_event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    return db_event


@router.get("/events/well/{well_id}", response_model=List[schemas.DrillingEventResponse])
def get_events_for_well(well_id: str, db: Session = Depends(get_db)):
    events = db.query(models.DrillingEvent).filter(models.DrillingEvent.well_id == well_id).all()
    return events
