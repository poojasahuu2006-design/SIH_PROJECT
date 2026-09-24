import { useEffect, useState } from "react";
import { askHistoricalReports, fetchHistoricalReports, uploadHistoricalReport } from "../api";
import "./HistoricalReportsPanel.css";

export default function HistoricalReportsPanel({ baseUrl }) {
  const [reports, setReports] = useState([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [sources, setSources] = useState([]);
  const [status, setStatus] = useState("ready");
  const [error, setError] = useState(null);

  const loadReports = () => fetchHistoricalReports(baseUrl).then(setReports).catch((err) => setError(err.message));
  useEffect(() => { loadReports(); }, [baseUrl]);

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    setStatus("processing");
    try {
      const report = await uploadHistoricalReport(baseUrl, file);
      setReports((current) => [report, ...current]);
      setStatus(report.status === "ready" ? "ready" : "error");
      if (report.error) setError(report.error);
    } catch (err) {
      setStatus("error");
      setError(err.message);
    } finally {
      event.target.value = "";
    }
  }

  async function handleAsk(event) {
    event.preventDefault();
    if (!question.trim()) return;
    setStatus("searching");
    setError(null);
    try {
      const result = await askHistoricalReports(baseUrl, question.trim());
      setAnswer(result.answer);
      setSources(result.sources || []);
      setStatus("answered");
    } catch (err) {
      setStatus("error");
      setError(err.message);
    }
  }

  return (
    <main className="historical-panel">
      <div className="historical-panel__head">
        <div><span className="eyebrow">Historical Reports</span><h1>Drilling Intelligence</h1></div>
        <label className="historical-upload">Upload PDF<input type="file" accept="application/pdf,.pdf" onChange={handleUpload} /></label>
      </div>
      <div className="historical-panel__status"><span className={`status-dot status-dot--${status}`} />{status === "processing" ? "Processing report" : status === "searching" ? "Searching evidence" : status === "answered" ? "Answer ready" : "Ready"}</div>
      {error && <div className="historical-error">{error}</div>}
      <div className="historical-grid">
        <section className="historical-card">
          <span className="eyebrow">Ask the archive</span>
          <form onSubmit={handleAsk} className="historical-question">
            <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="What caused the pressure event in Well W001?" aria-label="Ask historical reports" />
            <button type="submit" disabled={status === "searching"}>Ask AI</button>
          </form>
          {answer && <div className="historical-answer"><h2>Evidence-backed answer</h2><p>{answer}</p><h3>Sources</h3>{sources.map((source) => <div className="historical-source" key={`${source.chunk_id}-${source.page}`}><a href={`${baseUrl.replace(/\/$/, "")}/api/reports/${source.document_id}`} target="_blank" rel="noreferrer"><strong>{source.filename}</strong></a><span>Page {source.page}{source.section ? ` · ${source.section}` : ""}</span></div>)}</div>}
        </section>
        <section className="historical-card">
          <span className="eyebrow">Archive status</span>
          <div className="historical-list">{reports.length === 0 ? <p className="historical-empty">No historical reports indexed.</p> : reports.map((report) => <div className="historical-report" key={report.id}><div><strong>{report.filename}</strong><span>{report.page_count || 0} pages · {report.chunk_count || 0} chunks</span></div><b className={`report-state report-state--${report.status}`}>{report.status}</b></div>)}</div>
        </section>
      </div>
    </main>
  );
}