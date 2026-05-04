import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { predictSoil } from "../api/client";
import CsvUploader from "../components/CsvUploader";
import "./Home.css";

const FIELDS = [
  { key: "N",              label: "Nitrogen (N)",         unit: "kg/ha",  min: 0,   max: 560,  step: 1,    default: 90,  desc: "Available soil nitrogen" },
  { key: "P",              label: "Phosphorus (P)",       unit: "kg/ha",  min: 0,   max: 50,   step: 0.5,  default: 42,  desc: "Available phosphorus" },
  { key: "K",              label: "Potassium (K)",        unit: "kg/ha",  min: 0,   max: 500,  step: 1,    default: 43,  desc: "Available potassium" },
  { key: "pH",             label: "Soil pH",              unit: "",       min: 3.5, max: 10,   step: 0.1,  default: 6.5, desc: "Acidity / alkalinity (ideal: 6–7)" },
  { key: "temperature",    label: "Temperature",          unit: "°C",     min: 0,   max: 55,   step: 0.5,  default: 25,  desc: "Mean annual temperature" },
  { key: "humidity",       label: "Humidity",             unit: "%",      min: 0,   max: 100,  step: 1,    default: 80,  desc: "Relative humidity %" },
  { key: "rainfall",       label: "Rainfall",             unit: "mm/yr",  min: 0,   max: 5000, step: 5,    default: 200, desc: "Annual rainfall" },
  { key: "organic_carbon", label: "Organic Carbon",       unit: "%",      min: 0,   max: 5,    step: 0.05, default: 0.8, desc: "Soil organic carbon %" },
];

const GEO_DEFAULT = { latitude: "", longitude: "" };

function buildDefaults() {
  return Object.fromEntries(FIELDS.map(f => [f.key, f.default]));
}

function SliderInput({ field, value, onChange }) {
  const pct = ((value - field.min) / (field.max - field.min)) * 100;
  return (
    <div className="field-card">
      <div className="field-header">
        <div>
          <span className="form-label">{field.label}</span>
          <span className="field-desc">{field.desc}</span>
        </div>
        <div className="field-value-box">
          <input
            type="number"
            className="field-number-input"
            value={value}
            min={field.min}
            max={field.max}
            step={field.step}
            onChange={e => onChange(field.key, parseFloat(e.target.value) || 0)}
          />
          {field.unit && <span className="field-unit">{field.unit}</span>}
        </div>
      </div>
      <div className="slider-wrap">
        <input
          type="range"
          min={field.min}
          max={field.max}
          step={field.step}
          value={value}
          onChange={e => onChange(field.key, parseFloat(e.target.value))}
          style={{ "--pct": `${pct}%` }}
        />
        <div className="slider-labels">
          <span>{field.min}</span>
          <span>{field.max}</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [values, setValues]   = useState(buildDefaults());
  const [geo, setGeo]         = useState({ latitude: "", longitude: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const navigate              = useNavigate();

  const handleChange = (key, val) => setValues(prev => ({ ...prev, [key]: val }));
  const handleGeoChange = (key, val) => setGeo(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...values,
        latitude:  geo.latitude  !== "" ? parseFloat(geo.latitude)  : null,
        longitude: geo.longitude !== "" ? parseFloat(geo.longitude) : null,
      };
      const { data } = await predictSoil(payload);
      navigate("/results", { state: { result: data, input: values, geo } });
    } catch (err) {
      setError(err.response?.data?.detail || "Connection failed. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => { setValues(buildDefaults()); setGeo({ latitude: "", longitude: "" }); };

  return (
    <div className="home-page">
      <div className="container">
        <div className="page-header fade-up">
          <h1>Soil <span className="grad-text">Health Analysis</span></h1>
          <p>Enter your soil parameters to get crop recommendations, yield forecasts, and precision fertilizer advice.</p>
        </div>

        <div className="fade-up" style={{ marginBottom: "2rem" }}>
          <CsvUploader onUploadSuccess={() => navigate("/analytics")} />
        </div>

        <div className="divider" style={{ margin: "2rem 0" }} />

        <form onSubmit={handleSubmit} className="soil-form fade-up">
          <div className="form-section">
            <h2 className="section-title">🧪 Soil Nutrients</h2>
            <div className="fields-grid">
              {FIELDS.slice(0,4).map(f => (
                <SliderInput key={f.key} field={f} value={values[f.key]} onChange={handleChange} />
              ))}
            </div>
          </div>

          <div className="divider" />

          <div className="form-section">
            <h2 className="section-title">🌦️ Environment</h2>
            <div className="fields-grid">
              {FIELDS.slice(4).map(f => (
                <SliderInput key={f.key} field={f} value={values[f.key]} onChange={handleChange} />
              ))}
            </div>
          </div>

          <div className="divider" />

          <div className="form-section">
            <h2 className="section-title">
              📍 Location
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 400, marginLeft: "0.75rem" }}>
                optional — enables soil map on results
              </span>
            </h2>
            <div className="fields-grid">
              <div className="field-card">
                <div className="field-header">
                  <div>
                    <span className="form-label">Latitude</span>
                    <span className="field-desc">Degrees North/South (−90 to 90)</span>
                  </div>
                  <div className="field-value-box">
                    <input
                      type="number"
                      className="field-number-input"
                      value={geo.latitude}
                      min={-90} max={90} step={0.0001}
                      placeholder="e.g. 28.6139"
                      onChange={e => handleGeoChange("latitude", e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="field-card">
                <div className="field-header">
                  <div>
                    <span className="form-label">Longitude</span>
                    <span className="field-desc">Degrees East/West (−180 to 180)</span>
                  </div>
                  <div className="field-value-box">
                    <input
                      type="number"
                      className="field-number-input"
                      value={geo.longitude}
                      min={-180} max={180} step={0.0001}
                      placeholder="e.g. 77.2090"
                      onChange={e => handleGeoChange("longitude", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="error-banner">
              ⚠️ {error}
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={handleReset}>
              Reset Defaults
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" /> Analyzing…</> : "🔍 Analyze Soil"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
