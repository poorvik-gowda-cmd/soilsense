import { useState, useEffect } from "react";
import { getHistory } from "../api/client";
import { useAuth } from "../context/AuthContext";
import "./History.css";

const BADGE_MAP = {
  Excellent: "badge-green",
  Good:      "badge-lime",
  Moderate:  "badge-amber",
  Poor:      "badge-orange",
  Critical:  "badge-red",
};

function fmt(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    + " " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export default function History() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [search,  setSearch]  = useState("");
  const { user } = useAuth();

  useEffect(() => {
    getHistory(100)
      .then(r => setRecords(r.data.data || []))
      .catch(e => setError(e.response?.data?.detail || "Could not load history."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = records.filter(r =>
    !search ||
    r.crop_recommendation?.toLowerCase().includes(search.toLowerCase()) ||
    r.health_category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="history-page">
      <div className="container">
        <div className="page-header fade-up">
          <h1>Prediction <span className="grad-text">History</span></h1>
          <p>
            Showing analyses for <strong style={{ color: "var(--primary)" }}>{user?.email}</strong>
            {" "}— your data is private and isolated to your account.
          </p>
        </div>

        <div className="history-toolbar fade-up">
          <input
            className="form-input search-input"
            placeholder="🔍 Filter by crop or health category…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span className="history-count">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {loading && (
          <div className="history-loading">
            <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
            <p>Loading your analyses…</p>
          </div>
        )}

        {error && (
          <div className="card" style={{ color: "var(--red-400)", textAlign: "center" }}>
            ⚠️ {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="card" style={{ textAlign: "center", color: "var(--text-muted)", padding: "3rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🌱</div>
            <p>No analyses found for your account yet.</p>
            <p style={{ marginTop: "0.5rem" }}>Run a soil analysis or upload a CSV to get started!</p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="history-table-wrap card fade-up">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Crop</th>
                  <th>SHI Score</th>
                  <th>Health</th>
                  <th>Yield (t/ha)</th>
                  <th>N</th>
                  <th>P</th>
                  <th>K</th>
                  <th>pH</th>
                  <th>Fertilizer</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const fert = Array.isArray(r.fertilizer_advice) && r.fertilizer_advice[0]
                    ? r.fertilizer_advice[0].product
                    : "—";
                  return (
                    <tr key={r.id || i} className="history-row">
                      <td className="col-date">{fmt(r.created_at)}</td>
                      <td className="col-crop" style={{ textTransform: "capitalize" }}>{r.crop_recommendation || "—"}</td>
                      <td className="col-shi">
                        <div className="mini-bar-wrap">
                          <div
                            className="mini-bar"
                            style={{
                              width: `${r.soil_health_index || 0}%`,
                              background: r.soil_health_index >= 60 ? "#22c55e"
                                        : r.soil_health_index >= 40 ? "#eab308" : "#f87171",
                            }}
                          />
                          <span>{r.soil_health_index?.toFixed(1) || "—"}</span>
                        </div>
                      </td>
                      <td><span className={`badge ${BADGE_MAP[r.health_category] || "badge-amber"}`}>{r.health_category || "—"}</span></td>
                      <td className="col-num">{r.yield_prediction?.toFixed(2) || "—"}</td>
                      <td className="col-num">{r.n_value ?? "—"}</td>
                      <td className="col-num">{r.p_value ?? "—"}</td>
                      <td className="col-num">{r.k_value ?? "—"}</td>
                      <td className="col-num">{r.ph ?? "—"}</td>
                      <td className="col-fert">{fert}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
