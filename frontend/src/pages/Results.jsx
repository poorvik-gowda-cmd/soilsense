import React from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Plotly from "plotly.js-dist-min";
import createPlotlyComponent from "react-plotly.js/factory";
import SoilMap from "../components/SoilMap";
import "./Results.css";

const PlotFactory = createPlotlyComponent.default || createPlotlyComponent;
const Plot = PlotFactory(Plotly);

/* ── Health category → badge class ─────────────────────────────────────────── */
const BADGE_MAP = {
  Excellent: "badge-green",
  Good:      "badge-lime",
  Moderate:  "badge-amber",
  Poor:      "badge-orange",
  Critical:  "badge-red",
};

const PRIORITY_BADGE = {
  high:   "badge-red",
  medium: "badge-orange",
  low:    "badge-lime",
};

/* ── SHI Arc Gauge ──────────────────────────────────────────────────────────── */
function SHIGauge({ score, category, color, components }) {
  return (
    <div className="card shi-card">
      <h3 className="card-title">🌍 Soil Health Index</h3>
      <Plot
        data={[{
          type: "indicator",
          mode: "gauge+number+delta",
          value: score,
          number: { font: { size: 42, color: color, family: "Space Grotesk" }, suffix: "" },
          gauge: {
            axis: { range: [0, 100], tickcolor: "#4b7a5c", tickfont: { color: "#4b7a5c", size: 11 } },
            bar: { color: color, thickness: 0.28 },
            bgcolor: "transparent",
            borderwidth: 0,
            steps: [
              { range: [0,  20], color: "rgba(248,113,113,0.12)" },
              { range: [20, 40], color: "rgba(251,146,60,0.12)"  },
              { range: [40, 60], color: "rgba(251,191,36,0.12)"  },
              { range: [60, 80], color: "rgba(163,230,53,0.12)"  },
              { range: [80,100], color: "rgba(74,222,128,0.12)"  },
            ],
            threshold: { line: { color: color, width: 3 }, thickness: 0.75, value: score },
          },
        }]}
        layout={{
          paper_bgcolor: "transparent",
          plot_bgcolor:  "transparent",
          margin: { t: 10, b: 10, l: 20, r: 20 },
          height: 220,
          font:   { color: "#f0fdf4" },
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: "100%" }}
      />
      <div className="shi-footer">
        <span className={`badge ${BADGE_MAP[category] || "badge-amber"}`}>{category}</span>
        <span className="shi-score-label">Score: {score} / 100</span>
      </div>
      {/* Component breakdown */}
      <div className="shi-components">
        {Object.entries(components).map(([key, val]) => (
          <div key={key} className="shi-comp-row">
            <span className="shi-comp-key">{key}</span>
            <div className="shi-comp-bar-bg">
              <div className="shi-comp-bar" style={{ width: `${val}%`, background: val > 60 ? "#22c55e" : val > 40 ? "#eab308" : "#f87171" }} />
            </div>
            <span className="shi-comp-val">{val}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Crop Recommendation Card ───────────────────────────────────────────────── */
function CropCard({ ml, top3 }) {
  const emoji = {
    rice: "🌾", wheat: "🌿", maize: "🌽", cotton: "🌸", coffee: "☕",
    banana: "🍌", mango: "🥭", apple: "🍎", grapes: "🍇", coconut: "🥥",
    papaya: "🍈", watermelon: "🍉", muskmelon: "🍈", pomegranate: "🍎",
    jute: "🌿", lentil: "🫘", chickpea: "🫘", kidneybeans: "🫘",
    pigeonpeas: "🫘", mothbeans: "🫘", mungbean: "🫘", blackgram: "🫘",
    orange: "🍊",
  }[ml.crop_recommendation] || "🌱";

  return (
    <div className="card crop-card">
      <h3 className="card-title">🤖 ML Recommendation</h3>
      <div className="crop-hero">
        <span className="crop-emoji">{emoji}</span>
        <div>
          <div className="crop-name">{ml.crop_recommendation || "Unknown"}</div>
          <div className="crop-conf">{ml.confidence || 0}% confidence</div>
        </div>
      </div>

      <div className="confidence-bar-bg">
        <div className="confidence-bar" style={{ width: `${ml.confidence || 0}%` }} />
      </div>

      <div className="yield-row">
        <div className="yield-box">
          <span className="yield-label">Est. Yield</span>
          <span className="yield-value">{ml.yield_estimate_t_ha || 0} <small>t/ha</small></span>
        </div>
      </div>

      <div className="divider" />
      <p className="top3-label">Top 3 Predictions</p>
      <div className="top3-list">
        {top3.map((c, i) => (
          <div key={c.crop || i} className={`top3-item ${i === 0 ? "top3-winner" : ""}`}>
            <span className="top3-rank">#{i+1}</span>
            <span className="top3-crop">{c.crop}</span>
            <span className="top3-pct">{((c.confidence || 0) * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── NPK Chart ──────────────────────────────────────────────────────────────── */
function NPKChart({ input }) {
  const nutrients = ["N", "P", "K"];
  const values    = [input.N, input.P, input.K];
  const optHigh   = [280, 25, 280];
  const colors    = values.map((v, i) => v < optHigh[i] * 0.5 ? "#f87171" : v < optHigh[i] ? "#fbbf24" : "#4ade80");

  return (
    <div className="card">
      <h3 className="card-title">📊 NPK Levels</h3>
      <Plot
        data={[{
          type: "bar",
          x: nutrients,
          y: values,
          marker: { color: colors, line: { width: 0 } },
          text: values.map(v => `${v}`),
          textposition: "outside",
          textfont: { color: "#86efac", family: "Space Grotesk", size: 13 },
        }]}
        layout={{
          paper_bgcolor: "transparent",
          plot_bgcolor:  "transparent",
          height: 220,
          margin: { t: 10, b: 30, l: 30, r: 10 },
          xaxis: { color: "#4b7a5c", gridcolor: "transparent" },
          yaxis: { color: "#4b7a5c", gridcolor: "rgba(74,222,128,0.06)", zeroline: false },
          font:  { color: "#86efac", family: "Inter" },
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: "100%" }}
      />
      <div className="npk-labels">
        <span>N: Nitrogen</span><span>P: Phosphorus</span><span>K: Potassium</span>
      </div>
    </div>
  );
}

/* ── Environment Summary ────────────────────────────────────────────────────── */
function EnvSummary({ input }) {
  const items = [
    { label: "pH",          value: input.pH,             unit: "",      icon: "⚗️" },
    { label: "Temperature", value: input.temperature,    unit: "°C",    icon: "🌡️" },
    { label: "Humidity",    value: input.humidity,       unit: "%",     icon: "💧" },
    { label: "Rainfall",    value: input.rainfall,       unit: "mm/yr", icon: "🌧️" },
    { label: "Organic C",   value: input.organic_carbon, unit: "%",     icon: "🌿" },
  ];
  return (
    <div className="card">
      <h3 className="card-title">🌦️ Environment Summary</h3>
      <div className="env-grid">
        {items.map(i => (
          <div key={i.label} className="env-item">
            <span className="env-icon">{i.icon}</span>
            <span className="env-label">{i.label}</span>
            <span className="env-value">{i.value}{i.unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Fertilizer Advice ──────────────────────────────────────────────────────── */
function FertilizerPanel({ advice }) {
  return (
    <div className="card fert-card">
      <h3 className="card-title">🧬 Fertilizer Prescription</h3>
      <div className="fert-list">
        {advice.map((a, i) => (
          <div key={i} className="fert-item">
            <div className="fert-header">
              <span className={`badge ${PRIORITY_BADGE[a.priority] || "badge-amber"}`}>
                {a.priority.toUpperCase()}
              </span>
              <span className="fert-product">{a.product}</span>
            </div>
            <p className="fert-reason">{a.reason}</p>
            <div className="fert-dosage">
              📐 <strong>Dosage:</strong> {a.dosage}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Results Page ──────────────────────────────────────────────────────── */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div style={{ color: "red", padding: "2rem" }}>
        <h1>Something went wrong.</h1>
        <pre>{this.state.error && this.state.error.toString()}</pre>
        <pre>{this.state.error && this.state.error.stack}</pre>
      </div>;
    }
    return this.props.children;
  }
}

export default function Results() {
  const { state } = useLocation();
  const navigate  = useNavigate();

  if (!state?.result) {
    return (
      <div className="container" style={{ paddingTop: "4rem", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>No results yet.</p>
        <Link to="/" className="btn btn-primary">← Go Analyze</Link>
      </div>
    );
  }

  const { result = {}, input = {}, geo = {} } = state;
  const { soil_health = {}, ml = {}, fertilizer_advice = [], location = {} } = result;

  const components = soil_health.component_scores || {};
  const top3 = ml.top3_crops || [];

  // ── Parameter Heatmap Data (real, data-driven) ───────────────────────────────
  const PARAM_RANGES = [
    { key: "N",    label: "Nitrogen",   val: input.N,              min: 0, max: 280, ideal: 140 },
    { key: "P",    label: "Phosphorus", val: input.P,              min: 0, max: 50,  ideal: 25  },
    { key: "K",    label: "Potassium",  val: input.K,              min: 0, max: 280, ideal: 200 },
    { key: "pH",   label: "pH",         val: input.pH,             min: 3.5, max: 10, ideal: 6.5 },
    { key: "Temp", label: "Temperature",val: input.temperature,   min: 0, max: 55,  ideal: 25  },
    { key: "Hum",  label: "Humidity",   val: input.humidity,      min: 0, max: 100, ideal: 65  },
    { key: "Rain", label: "Rainfall",   val: input.rainfall,      min: 0, max: 3000, ideal: 800 },
    { key: "OC",   label: "Org. Carbon",val: input.organic_carbon, min: 0, max: 5,  ideal: 2.0 },
  ];
  // Score: distance from ideal as fraction of range → higher = closer to ideal
  const heatScores = PARAM_RANGES.map(p => {
    const range = p.max - p.min;
    const distance = Math.abs(p.val - p.ideal) / range;
    return Math.round((1 - distance) * 100) / 100;
  });
  const heatLabels = PARAM_RANGES.map(p => `${p.label}\n${p.val}`);

  // Single-point map data from location returned by API
  const mapPoints = (location.latitude != null && location.longitude != null)
    ? [{
        lat: location.latitude,
        lng: location.longitude,
        shi: soil_health.index,
        category: soil_health.category,
        crop: ml.crop_recommendation,
        yield: ml.yield_estimate_t_ha,
      }]
    : [];

  return (
    <ErrorBoundary>
      <div className="results-page">
        <div className="container">
          <div className="page-header fade-up">
            <h1>Analysis <span className="grad-text">Results</span></h1>
            <p>AI-powered soil intelligence — prediction + prescription</p>
          </div>

          {/* Row 1: SHI + Crop + NPK */}
          <div className="results-grid-top fade-up">
            <SHIGauge
              score={soil_health.index || 0}
              category={soil_health.category || "Unknown"}
              color={soil_health.color || "#ccc"}
              components={components}
            />
            <div className="results-col-right">
              <CropCard ml={ml} top3={top3} />
              <NPKChart input={input} />
            </div>
          </div>

          {/* Row 2: Fertilizer + Env */}
          <div className="results-grid-bottom fade-up">
            <FertilizerPanel advice={fertilizer_advice} />
            <EnvSummary input={input} />
          </div>

          {/* Row 3: Parameter Heatmap */}
          <div className="card full-width-card fade-up" style={{ marginTop: "2rem" }}>
            <h3 className="card-title">🌡️ Soil Parameter Adequacy Heatmap</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
              Each cell shows how close this parameter is to its ideal value (1.0 = perfect, 0.0 = critical).
              Computed from your actual input values.
            </p>
            <Plot
              data={[{
                type: "heatmap",
                x: heatLabels,
                y: ["Adequacy"],
                z: [heatScores],
                colorscale: [
                  [0,    "#f87171"],
                  [0.4,  "#fb923c"],
                  [0.6,  "#facc15"],
                  [0.8,  "#a3e635"],
                  [1.0,  "#22c55e"]
                ],
                zmin: 0, zmax: 1,
                showscale: true,
                text: [heatScores.map(v => `${Math.round(v * 100)}%`)],
                texttemplate: "%{text}",
                hovertemplate: "%{x}<br>Adequacy: %{z:.0%}<extra></extra>",
              }]}
              layout={{
                paper_bgcolor: "transparent",
                plot_bgcolor: "transparent",
                font: { color: "#e2e8f0", family: "Inter" },
                margin: { t: 10, b: 60, l: 80, r: 20 },
                xaxis: { color: "#475569", tickangle: -20, tickfont: { size: 11 } },
                yaxis: { color: "#475569", showticklabels: false },
                height: 180,
              }}
              config={{ displayModeBar: false, responsive: true }}
              style={{ width: "100%" }}
            />
          </div>

          {/* Row 4: Soil Map */}
          <div className="card full-width-card fade-up" style={{ marginTop: "2rem" }}>
            <h3 className="card-title">🗺️ Sample Location Map</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1rem" }}>
              {mapPoints.length > 0
                ? "Your sample location with soil health color-coded."
                : "Add Latitude & Longitude on the Analyze page to see your sample on the map."}
            </p>
            <SoilMap points={mapPoints} />
          </div>

          <div className="results-actions fade-up">
            <button className="btn btn-ghost" onClick={() => navigate("/")}>← New Analysis</button>
            <Link to="/history" className="btn btn-ghost">📋 View History</Link>
            <Link to="/analytics" className="btn btn-ghost">📊 Analytics</Link>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
