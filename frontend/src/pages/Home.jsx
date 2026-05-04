import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { predictSoil, parseVoiceText } from "../api/client";
import CsvUploader from "../components/CsvUploader";
import "./Home.css";

const FIELDS = [
  { key: "N",              unit: "kg/ha",  min: 0,   max: 560,  step: 1,    default: 90 },
  { key: "P",              unit: "kg/ha",  min: 0,   max: 50,   step: 0.5,  default: 42 },
  { key: "K",              unit: "kg/ha",  min: 0,   max: 500,  step: 1,    default: 43 },
  { key: "pH",             unit: "",       min: 3.5, max: 10,   step: 0.1,  default: 6.5 },
  { key: "temperature",    unit: "°C",     min: 0,   max: 55,   step: 0.5,  default: 25 },
  { key: "humidity",       unit: "%",      min: 0,   max: 100,  step: 1,    default: 80 },
  { key: "rainfall",       unit: "mm/yr",  min: 0,   max: 5000, step: 5,    default: 200 },
  { key: "organic_carbon", unit: "%",      min: 0,   max: 5,    step: 0.05, default: 0.8 },
];

const GEO_DEFAULT = { latitude: "", longitude: "" };

function buildDefaults() {
  return Object.fromEntries(FIELDS.map(f => [f.key, f.default]));
}

function SliderInput({ field, value, onChange, t }) {
  const pct = ((value - field.min) / (field.max - field.min)) * 100;
  return (
    <div className="field-card">
      <div className="field-header">
        <div>
          <span className="form-label">{t(`fields.${field.key}.label`)}</span>
          <span className="field-desc">{t(`fields.${field.key}.desc`)}</span>
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
  const { t }                 = useTranslation();
  const [values, setValues]   = useState(buildDefaults());
  const [geo, setGeo]         = useState({ latitude: "", longitude: "" });
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError]     = useState("");
  const navigate              = useNavigate();

  const handleChange = (key, val) => setValues(prev => ({ ...prev, [key]: val }));
  const handleGeoChange = (key, val) => setGeo(prev => ({ ...prev, [key]: val }));

  const handleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support the Web Speech API. Please try Google Chrome.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      try {
        const { data } = await parseVoiceText(transcript);
        setValues(prev => ({ ...prev, ...data }));
      } catch (err) {
        console.error("Voice parsing failed:", err);
      } finally {
        setListening(false);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setListening(false);
    };

    recognition.start();
  };

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
          <h1>{t('home.title1')} <span className="grad-text">{t('home.title2')}</span></h1>
          <p>{t('home.subtitle')}</p>
        </div>

        <div className="fade-up" style={{ marginBottom: "2rem" }}>
          <CsvUploader onUploadSuccess={() => navigate("/analytics")} />
        </div>

        <div className="divider" style={{ margin: "2rem 0" }} />

        <form onSubmit={handleSubmit} className="soil-form fade-up">
          <div className="form-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 className="section-title" style={{ margin: 0 }}>{t('home.soil_nutrients')}</h2>
              <button 
                type="button" 
                onClick={handleVoice} 
                disabled={listening}
                className="btn btn-ghost" 
                style={{ padding: "0.5rem 1rem", fontSize: "1rem", borderRadius: "20px", display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                {listening ? <><span className="spinner" style={{width: "14px", height: "14px"}}/> {t('home.listening')}</> : t('home.voice_input')}
              </button>
            </div>
            <div className="fields-grid">
              {FIELDS.slice(0,4).map(f => (
                <SliderInput key={f.key} field={f} value={values[f.key]} onChange={handleChange} t={t} />
              ))}
            </div>
          </div>

          <div className="divider" />

          <div className="form-section">
            <h2 className="section-title">{t('home.environment')}</h2>
            <div className="fields-grid">
              {FIELDS.slice(4).map(f => (
                <SliderInput key={f.key} field={f} value={values[f.key]} onChange={handleChange} t={t} />
              ))}
            </div>
          </div>

          <div className="divider" />

          <div className="form-section">
            <h2 className="section-title">
              {t('home.location')}
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 400, marginLeft: "0.75rem" }}>
                {t('home.location_optional')}
              </span>
            </h2>
            <div className="fields-grid">
              <div className="field-card">
                <div className="field-header">
                  <div>
                    <span className="form-label">{t('home.latitude')}</span>
                    <span className="field-desc">{t('home.latitude_desc')}</span>
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
                    <span className="form-label">{t('home.longitude')}</span>
                    <span className="field-desc">{t('home.longitude_desc')}</span>
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
              {t('home.reset')}
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" /> {t('home.analyzing')}</> : t('home.analyze_btn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
