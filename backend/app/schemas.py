from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from .models import WellType, WellStatus, WellTrajectory, EventType, EventCategory, Phase, Severity, ActivityCode

# --- Well Schemas ---
class WellBase(BaseModel):
    well_name: str
    field_name: str
    block_name: str
    operator: str
    well_type: WellType
    well_status: WellStatus
    spud_date: Optional[date] = None
    rig_release_date: Optional[date] = None
    surface_latitude: float = Field(..., ge=-90, le=90)
    surface_longitude: float = Field(..., ge=-180, le=180)
    bottom_latitude: Optional[float] = Field(None, ge=-90, le=90)
    bottom_longitude: Optional[float] = Field(None, ge=-180, le=180)
    ground_elevation_m: Optional[float] = None
    total_depth_md_m: Optional[float] = Field(None, ge=0)
    total_depth_tvd_m: Optional[float] = Field(None, ge=0)
    well_trajectory: Optional[WellTrajectory] = None
    target_formation: Optional[str] = None
    rig_name: Optional[str] = None
    rig_contractor: Optional[str] = None
    spacing_distance_km: Optional[float] = None
    basin_name: Optional[str] = None
    remarks: Optional[str] = None

class WellCreate(WellBase):
    well_id: str

class WellResponse(WellBase):
    well_id: str

    class Config:
        orm_mode = True

# --- Drilling Event Schemas ---
class DrillingEventBase(BaseModel):
    well_id: str
    event_type: EventType
    event_category: EventCategory
    phase: Phase
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_hours: Optional[float] = None
    depth_md_m: Optional[float] = Field(None, ge=0)
    depth_tvd_m: Optional[float] = Field(None, ge=0)
    formation_name: Optional[str] = None
    severity: Optional[Severity] = None
    description: Optional[str] = None
    root_cause: Optional[str] = None
    corrective_action: Optional[str] = None
    cost_impact_inr: Optional[float] = None
    mud_weight_at_event: Optional[float] = None
    data_source: Optional[str] = None

class DrillingEventCreate(DrillingEventBase):
    event_id: str

class DrillingEventResponse(DrillingEventBase):
    event_id: str

    class Config:
        orm_mode = True

# --- Drilling Data Schemas ---
class DrillingDataBase(BaseModel):
    well_id: str
    timestamp: datetime
    hole_depth_md_m: Optional[float] = Field(None, ge=0)
    bit_depth_md_m: Optional[float] = Field(None, ge=0)
    tvd_m: Optional[float] = Field(None, ge=0)
    rop_m_per_hr: Optional[float] = None
    wob_ton: Optional[float] = None
    rpm: Optional[float] = None
    torque_kNm: Optional[float] = None
    standpipe_pressure_psi: Optional[float] = None
    flow_rate_in_lpm: Optional[float] = None
    flow_rate_out_pct: Optional[float] = None
    mud_weight_in_sg: Optional[float] = None
    mud_weight_out_sg: Optional[float] = None
    pit_volume_m3: Optional[float] = None
    hook_load_ton: Optional[float] = None
    block_position_m: Optional[float] = None
    ecd_sg: Optional[float] = None
    gas_units: Optional[float] = None
    bit_type: Optional[str] = None
    hole_diameter_in: Optional[float] = None
    casing_size_in: Optional[float] = None
    formation_name: Optional[str] = None
    activity_code: Optional[ActivityCode] = None

class DrillingDataCreate(DrillingDataBase):
    record_id: str

class DrillingDataResponse(DrillingDataBase):
    record_id: str

    class Config:
        orm_mode = True

# --- API Specific Responses ---

class NearbyWellResponse(BaseModel):
    well_id: str
    well_name: str
    field_name: str
    surface_latitude: float
    surface_longitude: float
    target_formation: Optional[str] = None
    total_depth_md_m: Optional[float] = None
    distance_km: float

class NearbyWellsResult(BaseModel):
    reference_well: str
    radius_km: float
    count: int
    nearby_wells: List[NearbyWellResponse]

class WellSummaryResponse(BaseModel):
    well: WellResponse
    nearby_wells: NearbyWellsResult
    historical_events: List[DrillingEventResponse]
    latest_drilling_data: List[DrillingDataResponse]
