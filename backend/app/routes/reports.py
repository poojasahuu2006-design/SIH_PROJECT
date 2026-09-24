from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import HistoricalReport
from ..services.reports import MAX_UPLOAD_BYTES, UPLOAD_DIR, ask_provider, new_report, process_report, search_chunks

router = APIRouter(prefix="/reports")


class AskRequest(BaseModel):
    question: str = Field(min_length=3, max_length=1000)


def _serialize(report):
    return {"id": report.id, "filename": report.filename, "status": report.status, "page_count": report.page_count, "chunk_count": report.chunk_count, "error": report.error_message, "created_at": report.created_at.isoformat()}


@router.post("/upload")
async def upload_report(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if Path(file.filename or "").suffix.lower() != ".pdf" or file.content_type not in ("application/pdf", "application/octet-stream", None):
        raise HTTPException(status_code=400, detail="Only PDF uploads are supported.")
    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Report exceeds the upload size limit.")
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    report = new_report(file.filename)
    (UPLOAD_DIR / report.stored_filename).write_bytes(content)
    db.add(report)
    db.commit()
    try:
        process_report(db, report)
        db.commit()
    except Exception as exc:
        db.rollback()
        report.status = "error"
        report.error_message = str(exc)[:500]
        db.add(report)
        db.commit()
    return _serialize(report)


@router.get("")
def list_reports(db: Session = Depends(get_db)):
    return [_serialize(report) for report in db.query(HistoricalReport).order_by(HistoricalReport.created_at.desc()).all()]


@router.post("/search")
def search_reports(payload: AskRequest, db: Session = Depends(get_db)):
    try:
        chunks = search_chunks(db, payload.question)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {"results": [{"id": c.id, "filename": c.document.filename, "page": c.page_number, "section": c.section_title, "well": c.well, "depth": c.depth, "text": c.text} for c in chunks]}


@router.post("/ask")
def ask_reports(payload: AskRequest, db: Session = Depends(get_db)):
    try:
        chunks = search_chunks(db, payload.question)
        answer, provider_status = ask_provider(payload.question, chunks)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"RAG request failed: {exc}") from exc
    return {"answer": answer, "provider_status": provider_status, "sources": [{"document_id": c.document_id, "filename": c.document.filename, "page": c.page_number, "section": c.section_title, "well": c.well, "depth": c.depth, "chunk_id": c.id} for c in chunks]}


@router.get("/{report_id}")
def get_report(report_id: int, db: Session = Depends(get_db)):
    report = db.get(HistoricalReport, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    return {**_serialize(report), "chunks": [{"id": c.id, "page": c.page_number, "section": c.section_title, "well": c.well, "depth": c.depth, "extracted": c.extracted_json, "text": c.text} for c in report.chunks]}