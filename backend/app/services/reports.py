import json
import os
import re
import uuid
from datetime import datetime
from pathlib import Path
from urllib import request as urlrequest

from pypdf import PdfReader
from sqlalchemy.orm import Session

from ..models import HistoricalReport, ReportChunk

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "data" / "uploads"
MAX_UPLOAD_BYTES = int(os.getenv("REPORT_MAX_UPLOAD_BYTES", str(50 * 1024 * 1024)))


def _clean(text):
    return re.sub(r"\s+", " ", text or "").strip()


def _number_after(pattern, text):
    match = re.search(pattern, text, re.IGNORECASE)
    if not match:
        return None
    try:
        return float(match.group(1).replace(",", ""))
    except ValueError:
        return None


def _extract_page_text(pdf_path):
    reader = PdfReader(str(pdf_path))
    pages = [_clean(page.extract_text() or "") for page in reader.pages]
    if sum(len(page) for page in pages) >= 40:
        return pages

    # OCR is optional because Tesseract is an external Windows install.
    try:
        import fitz
        import pytesseract
        from PIL import Image
        from io import BytesIO

        ocr_pages = []
        document = fitz.open(str(pdf_path))
        for page in document:
            image = Image.open(BytesIO(page.get_pixmap(dpi=180).tobytes("png")))
            ocr_pages.append(_clean(pytesseract.image_to_string(image)))
        return ocr_pages
    except Exception as exc:
        if sum(len(page) for page in pages) == 0:
            raise RuntimeError("PDF has no extractable text and OCR is unavailable. Install Tesseract and OCR dependencies.") from exc
        return pages


def _chunk_page(text, max_words=180):
    sentences = re.split(r"(?<=[.!?])\s+", text)
    chunks, current = [], []
    for sentence in sentences:
        words = sentence.split()
        if current and len(current) + len(words) > max_words:
            chunks.append(" ".join(current))
            current = []
        current.extend(words)
    if current:
        chunks.append(" ".join(current))
    return chunks


def _metadata(text):
    well = re.search(r"\b(W\d{3,}|well\s+[A-Z0-9_-]+)\b", text, re.IGNORECASE)
    section = re.search(r"(?:section|formation|event)\s*[:\-]?\s*([^.;]{3,60})", text, re.IGNORECASE)
    depth = _number_after(r"(?:depth|MD|TVD)\s*[:=]?\s*([\d,]+(?:\.\d+)?)\s*m?", text)
    def value(label):
        match = re.search(rf"{label}\s*[:\-]\s*([^.;]{3,180})", text, re.IGNORECASE)
        return match.group(1).strip() if match else None

    return {
        "well": well.group(1) if well else None,
        "depth": depth,
        "section_title": section.group(1).strip() if section else None,
        "formation": value("formation"),
        "event": value("event"),
        "severity": value("severity"),
        "cause": value("cause|root cause"),
        "mitigation": value("mitigation|corrective action"),
        "npt": value("NPT|non-productive time"),
    }


def _embed(texts):
    try:
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer(os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2"))
        return model.encode(texts, normalize_embeddings=True).tolist()
    except Exception as exc:
        raise RuntimeError("Embedding model unavailable. Install sentence-transformers and ensure the embedding model can be downloaded.") from exc


def _cosine(left, right):
    return sum(a * b for a, b in zip(left, right))


def process_report(db: Session, report: HistoricalReport):
    pages = _extract_page_text(UPLOAD_DIR / report.stored_filename)
    texts, records = [], []
    for page_number, page_text in enumerate(pages, start=1):
        for text in _chunk_page(page_text):
            if len(text) < 20:
                continue
            metadata = _metadata(text)
            texts.append(text)
            records.append((page_number, metadata, text))
    if not records:
        raise RuntimeError("No useful text was found in the report.")
    vectors = _embed(texts)
    for (page_number, metadata, text), vector in zip(records, vectors):
        db.add(ReportChunk(document=report, page_number=page_number, section_title=metadata["section_title"], well=metadata["well"], depth=metadata["depth"], text=text, metadata_json=metadata, extracted_json={key: metadata[key] for key in ("formation", "event", "severity", "cause", "mitigation", "npt")}, embedding=vector))
    report.page_count = len(pages)
    report.chunk_count = len(records)
    report.status = "ready"


def search_chunks(db: Session, question, limit=6):
    query_vector = _embed([question])[0]
    ranked = []
    for chunk in db.query(ReportChunk).join(HistoricalReport).filter(HistoricalReport.status == "ready").all():
        ranked.append((_cosine(query_vector, chunk.embedding), chunk))
    return [chunk for _, chunk in sorted(ranked, key=lambda item: item[0], reverse=True)[:limit]]


def ask_provider(question, chunks):
    evidence = "\n\n".join(f"[{index}] {chunk.document.filename}, page {chunk.page_number}\n{chunk.text}" for index, chunk in enumerate(chunks, 1))
    system_prompt = "Answer only from the supplied drilling-report evidence. Be concise and engineering-focused. If evidence is insufficient, say so explicitly. Cite evidence using [number] markers."
    provider = os.getenv("LLM_PROVIDER", "gemini").lower()
    if provider == "gemini":
        api_key = os.getenv("GEMINI_API_KEY")
        model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        if not api_key:
            return "Gemini is not configured. Retrieved evidence is shown below; configure GEMINI_API_KEY to generate an answer.", "provider_not_configured"
        api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        payload = {"systemInstruction": {"parts": [{"text": system_prompt}]}, "contents": [{"role": "user", "parts": [{"text": f"Question: {question}\n\nEvidence:\n{evidence}"}]}], "generationConfig": {"temperature": 0}}
        req = urlrequest.Request(api_url, data=json.dumps(payload).encode(), headers={"Content-Type": "application/json", "x-goog-api-key": api_key}, method="POST")
    else:
        api_key = os.getenv("LLM_API_KEY")
        api_url = os.getenv("LLM_API_URL", "https://api.openai.com/v1/chat/completions")
        model = os.getenv("LLM_MODEL", "gpt-4o-mini")
        if not api_key:
            return "LLM provider is not configured. Retrieved evidence is shown below; configure LLM_API_KEY to generate an answer.", "provider_not_configured"
        payload = {"model": model, "temperature": 0, "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": f"Question: {question}\n\nEvidence:\n{evidence}"}]}
        req = urlrequest.Request(api_url, data=json.dumps(payload).encode(), headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}, method="POST")
    with urlrequest.urlopen(req, timeout=60) as response:
        body = json.loads(response.read().decode())
    if provider == "gemini":
        return body["candidates"][0]["content"]["parts"][0]["text"], "ok"
    return body["choices"][0]["message"]["content"], "ok"


def new_report(filename):
    safe_name = Path(filename).name
    return HistoricalReport(filename=safe_name, stored_filename=f"{uuid.uuid4().hex}.pdf", status="processing", created_at=datetime.utcnow())