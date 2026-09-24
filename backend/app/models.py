from sqlalchemy import Column, String, Float, Date, Enum, ForeignKey, Text, DateTime, Integer, JSON
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from .database import Base
import enum

class WellType(str, enum.Enum):
    exploratory = "exploratory"
    development = "development"
    appraisal = "appraisal"
    injector = "injector"
    workover = "workover"

class WellStatus(str, enum.Enum):
    planned = "planned"
    drilling = "drilling"
    completed = "completed"
    producing = "producing"
    abandoned = "abandoned"
    suspended = "suspended"

class WellTrajectory(str, enum.Enum):
    vertical = "vertical"
    directional = "directional"
    horizontal = "horizontal"
    multilateral = "multilateral"

class EventType(str, enum.Enum):
    NPT = "NPT"
    kick = "kick"
    stuck_pipe = "stuck_pipe"
    lost_circulation = "lost_circulation"
    well_control = "well_control"
    formation_top = "formation_top"
    casing_run = "casing_run"
    cementing = "cementing"
    mud_loss = "mud_loss"
    twist_off = "twist_off"
    equipment_failure = "equipment_failure"
    gas_influx = "gas_influx"
    wellbore_instability = "wellbore_instability"
    other = "other"

class EventCategory(str, enum.Enum):
    planned = "planned"
    unplanned = "unplanned"

class Phase(str, enum.Enum):
    drilling = "drilling"
    tripping = "tripping"
    casing = "casing"
    cementing = "cementing"
    logging = "logging"
    completion = "completion"
    workover = "workover"

class Severity(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"

class ActivityCode(str, enum.Enum):
    drilling = "drilling"
    tripping_in = "tripping_in"
    tripping_out = "tripping_out"
    circulating = "circulating"
    connection = "connection"
    surveying = "surveying"
    other = "other"


class Well(Base):
    __tablename__ = "wells"

    well_id = Column(String, primary_key=True, index=True)
    well_name = Column(String, index=True)
    field_name = Column(String, index=True)
    block_name = Column(String, index=True)
    operator = Column(String)
    well_type = Column(Enum(WellType))
    well_status = Column(Enum(WellStatus))
    spud_date = Column(Date, nullable=True)
    rig_release_date = Column(Date, nullable=True)
    surface_latitude = Column(Float)
    surface_longitude = Column(Float)
    bottom_latitude = Column(Float, nullable=True)
    bottom_longitude = Column(Float, nullable=True)
    ground_elevation_m = Column(Float, nullable=True)
    total_depth_md_m = Column(Float, nullable=True)
    total_depth_tvd_m = Column(Float, nullable=True)
    well_trajectory = Column(Enum(WellTrajectory), nullable=True)
    target_formation = Column(String, nullable=True)
    rig_name = Column(String, nullable=True)
    rig_contractor = Column(String, nullable=True)
    spacing_distance_km = Column(Float, nullable=True)
    basin_name = Column(String, index=True, nullable=True)
    remarks = Column(Text, nullable=True)
    
    # PostGIS Location Point (Longitude, Latitude)
    location = Column(Geometry('POINT', srid=4326, spatial_index=True))

    events = relationship("DrillingEvent", back_populates="well")
    drilling_data = relationship("DrillingData", back_populates="well")


class DrillingEvent(Base):
    __tablename__ = "drilling_events"

    event_id = Column(String, primary_key=True, index=True)
    well_id = Column(String, ForeignKey("wells.well_id"))
    event_type = Column(Enum(EventType))
    event_category = Column(Enum(EventCategory))
    phase = Column(Enum(Phase))
    start_time = Column(DateTime)
    end_time = Column(DateTime, nullable=True)
    duration_hours = Column(Float, nullable=True)
    depth_md_m = Column(Float, nullable=True)
    depth_tvd_m = Column(Float, nullable=True)
    formation_name = Column(String, nullable=True)
    severity = Column(Enum(Severity), nullable=True)
    description = Column(Text, nullable=True)
    root_cause = Column(Text, nullable=True)
    corrective_action = Column(Text, nullable=True)
    cost_impact_inr = Column(Float, nullable=True)
    mud_weight_at_event = Column(Float, nullable=True)
    data_source = Column(String, nullable=True)

    well = relationship("Well", back_populates="events")


class DrillingData(Base):
    __tablename__ = "drilling_data"

    record_id = Column(String, primary_key=True, index=True)
    well_id = Column(String, ForeignKey("wells.well_id"))
    timestamp = Column(DateTime)
    hole_depth_md_m = Column(Float, nullable=True)
    bit_depth_md_m = Column(Float, nullable=True)
    tvd_m = Column(Float, nullable=True)
    rop_m_per_hr = Column(Float, nullable=True)
    wob_ton = Column(Float, nullable=True)
    rpm = Column(Float, nullable=True)
    torque_kNm = Column(Float, nullable=True)
    standpipe_pressure_psi = Column(Float, nullable=True)
    flow_rate_in_lpm = Column(Float, nullable=True)
    flow_rate_out_pct = Column(Float, nullable=True)
    mud_weight_in_sg = Column(Float, nullable=True)
    mud_weight_out_sg = Column(Float, nullable=True)
    pit_volume_m3 = Column(Float, nullable=True)
    hook_load_ton = Column(Float, nullable=True)
    block_position_m = Column(Float, nullable=True)
    ecd_sg = Column(Float, nullable=True)
    gas_units = Column(Float, nullable=True)
    bit_type = Column(String, nullable=True)
    hole_diameter_in = Column(Float, nullable=True)
    casing_size_in = Column(Float, nullable=True)
    formation_name = Column(String, nullable=True)
    activity_code = Column(Enum(ActivityCode), nullable=True)

    well = relationship("Well", back_populates="drilling_data")


class HistoricalReport(Base):
    __tablename__ = "historical_reports"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    stored_filename = Column(String, nullable=False, unique=True)
    status = Column(String, nullable=False, default="processing")
    page_count = Column(Integer, default=0)
    chunk_count = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False)

    chunks = relationship("ReportChunk", back_populates="document", cascade="all, delete-orphan")


class ReportChunk(Base):
    __tablename__ = "historical_report_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("historical_reports.id"), nullable=False, index=True)
    page_number = Column(Integer, nullable=False)
    section_title = Column(String, nullable=True)
    well = Column(String, nullable=True)
    depth = Column(Float, nullable=True)
    text = Column(Text, nullable=False)
    metadata_json = Column(JSON, nullable=False, default=dict)
    extracted_json = Column(JSON, nullable=False, default=dict)
    embedding = Column(JSON, nullable=False)

    document = relationship("HistoricalReport", back_populates="chunks")
