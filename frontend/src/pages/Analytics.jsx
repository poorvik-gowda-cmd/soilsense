import React, { useEffect, useState } from "react";
import { getAnalytics } from "../api/client";
import Plotly from "plotly.js-dist-min";
import createPlotlyComponent from "react-plotly.js/factory";
import SoilMap from "../components/SoilMap";
import "./Analytics.css";

const PlotFactory = createPlotlyComponent.default || createPlotlyComponent;
const Plot = PlotFactory(Plotly);

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await getAnalytics();
        if (res.data.status === "success") {
          setData(res.data);
        } else {
          setError(res.data.message || "No data available");
        }
      } catch (err) {
        setError("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="container" style={{paddingTop: "4rem"}}>Loading advanced analytics...</div>;
  if (error || !data) return <div className="container" style={{paddingTop: "4rem", color: "var(--text-muted)"}}>{error || "No data available."}</div>;

  const { total_predictions, data: aData } = data;
  const { 
    avg_npk, 
    ph_histogram, 
    yield_vs_fert, 
    correlation_matrix, 
    geospatial_points = [],
    crop_distribution = [],
    shi_distribution = {},
    shi_trend = [],
    avg_yield_per_crop = [],
    fert_distribution = [],
    avg_shi = 0,
    recent_records = []
  } = aData;

  // ── Prepare Correlation Heatmap Data ──
  // Heatmap expects x (labels), y (labels), and z (2D array)
  // Our backend sends: [{x: 'N', y: 'P', value: 0.5}, ...]
  const uniqueX = [...new Set(correlation_matrix.map(d => d.x))];
  const uniqueY = [...new Set(correlation_matrix.map(d => d.y))];
  const zData = uniqueY.map(y => {
    return uniqueX.map(x => {
      const match = correlation_matrix.find(d => d.x === x && d.y === y);
      return match ? match.value : 0;
    });
  });

  return (
    <div className="analytics-page">
      <div className="container">
        <div className="page-header fade-up">
          <h1>Advanced <span className="grad-text">Analytics</span></h1>
          <p>Descriptive, Diagnostic, Predictive & Prescriptive Insights</p>
        </div>

        {/* 1. Data Overview Panel */}
        <div className="overview-panel fade-up">
          <div className="stat-card primary-card">
            <h3>Overall Soil Health</h3>
            <div className="stat-value">{avg_shi}%</div>
            <div className="stat-label">Average SHI Score</div>
          </div>
          <div className="stat-card">
            <h3>Total Records</h3>
            <div className="stat-value">{total_predictions}</div>
            <div className="stat-label">Analyses Performed</div>
          </div>
          <div className="stat-card">
            <h3>Avg Nitrogen</h3>
            <div className="stat-value">{avg_npk?.N}</div>
            <div className="stat-label">kg/ha</div>
          </div>
          <div className="stat-card">
            <h3>Avg Phosphorus</h3>
            <div className="stat-value">{avg_npk?.P}</div>
            <div className="stat-label">kg/ha</div>
          </div>
          <div className="stat-card">
            <h3>Avg Potassium</h3>
            <div className="stat-value">{avg_npk?.K}</div>
            <div className="stat-label">kg/ha</div>
          </div>
        </div>

        <div className="charts-grid fade-up">
          {/* 1. Crop Suitability Distribution */}
          <div className="chart-card">
            <h3>Crop Suitability Distribution</h3>
            <Plot
              data={[{
                type: "pie",
                labels: crop_distribution.map(d => d.crop),
                values: crop_distribution.map(d => d.count),
                hole: 0.4,
                marker: { colors: ["#22c55e", "#38bdf8", "#a855f7", "#f59e0b", "#ef4444"] }
              }]}
              layout={{
                paper_bgcolor: "transparent",
                plot_bgcolor: "transparent",
                font: { color: "#e2e8f0" },
                margin: { t: 40, b: 20, l: 20, r: 20 },
                height: 300,
                showlegend: true,
                legend: { orientation: "h", y: -0.2 }
              }}
              config={{ displayModeBar: false, responsive: true }}
              style={{ width: "100%" }}
            />
          </div>

          {/* 2. Soil Health Category Distribution */}
          <div className="chart-card">
            <h3>Soil Health Categories</h3>
            <Plot
              data={[{
                type: "pie",
                labels: Object.keys(shi_distribution),
                values: Object.values(shi_distribution),
                marker: { 
                  colors: Object.keys(shi_distribution).map(cat => 
                    cat === "Excellent" ? "#22c55e" : 
                    cat === "Good" ? "#a3e635" : 
                    cat === "Moderate" ? "#facc15" : 
                    cat === "Poor" ? "#fb923c" : "#f87171"
                  ) 
                }
              }]}
              layout={{
                paper_bgcolor: "transparent",
                plot_bgcolor: "transparent",
                font: { color: "#e2e8f0" },
                margin: { t: 40, b: 20, l: 20, r: 20 },
                height: 300,
                showlegend: true,
                legend: { orientation: "h", y: -0.2 }
              }}
              config={{ displayModeBar: false, responsive: true }}
              style={{ width: "100%" }}
            />
          </div>

          {/* 3. SHI Score Trend */}
          <div className="chart-card full-width">
            <h3>Soil Health Index Trend (Timeline)</h3>
            <Plot
              data={[{
                type: "scatter",
                mode: "lines+markers",
                x: shi_trend.map(d => d.timestamp),
                y: shi_trend.map(d => d.score),
                line: { color: "#22c55e", width: 3 },
                marker: { size: 8, color: "#22c55e" }
              }]}
              layout={{
                paper_bgcolor: "transparent",
                plot_bgcolor: "transparent",
                font: { color: "#e2e8f0" },
                margin: { t: 20, b: 40, l: 40, r: 20 },
                xaxis: { title: "Date", color: "#475569", gridcolor: "rgba(255,255,255,0.05)" },
                yaxis: { title: "SHI Score", color: "#475569", gridcolor: "rgba(255,255,255,0.05)", range: [0, 100] },
                height: 300
              }}
              config={{ displayModeBar: false, responsive: true }}
              style={{ width: "100%" }}
            />
          </div>

          {/* 4. Soil Health Visualization: pH Histogram */}
          <div className="chart-card">
            <h3>pH Distribution (Diagnostic)</h3>
            <Plot
              data={[{
                type: "histogram",
                x: ph_histogram,
                marker: { color: "#38bdf8" },
                opacity: 0.75,
              }]}
              layout={{
                paper_bgcolor: "transparent",
                plot_bgcolor: "transparent",
                font: { color: "#e2e8f0" },
                margin: { t: 20, b: 40, l: 40, r: 20 },
                xaxis: { title: "pH Level", color: "#475569", gridcolor: "rgba(255,255,255,0.05)" },
                yaxis: { title: "Frequency", color: "#475569", gridcolor: "rgba(255,255,255,0.05)" },
                height: 300
              }}
              config={{ displayModeBar: false, responsive: true }}
              style={{ width: "100%" }}
            />
          </div>

          {/* 5. Predictive: Yield vs Fertilizer Line Chart */}
          <div className="chart-card">
            <h3>Avg Yield vs Fertilizer (Prescriptive)</h3>
            <Plot
              data={[{
                type: "scatter",
                mode: "lines+markers",
                x: yield_vs_fert.map(d => d.fertilizer),
                y: yield_vs_fert.map(d => d.avg_yield),
                line: { color: "#a855f7", width: 3 },
                marker: { size: 8 }
              }]}
              layout={{
                paper_bgcolor: "transparent",
                plot_bgcolor: "transparent",
                font: { color: "#e2e8f0" },
                margin: { t: 20, b: 60, l: 40, r: 20 },
                xaxis: { title: "Fertilizer Product", color: "#475569", gridcolor: "rgba(255,255,255,0.05)", tickangle: -45 },
                yaxis: { title: "Avg Yield (t/ha)", color: "#475569", gridcolor: "rgba(255,255,255,0.05)" },
                height: 300
              }}
              config={{ displayModeBar: false, responsive: true }}
              style={{ width: "100%" }}
            />
          </div>

          {/* 6. Advanced: Correlation Heatmap */}
          <div className="chart-card">
            <h3>Parameter Correlation Heatmap</h3>
            <Plot
              data={[{
                type: "heatmap",
                x: uniqueX,
                y: uniqueY,
                z: zData,
                colorscale: "Viridis"
              }]}
              layout={{
                paper_bgcolor: "transparent",
                plot_bgcolor: "transparent",
                font: { color: "#e2e8f0" },
                margin: { t: 20, b: 40, l: 40, r: 20 },
                xaxis: { color: "#475569" },
                yaxis: { color: "#475569" },
                height: 300
              }}
              config={{ displayModeBar: false, responsive: true }}
              style={{ width: "100%" }}
            />
          </div>

          {/* 7. Fertilizer Distribution */}
          <div className="chart-card">
            <h3>Recommended Fertilizer Distribution</h3>
            <Plot
              data={[{
                type: "bar",
                x: fert_distribution.map(d => d.product),
                y: fert_distribution.map(d => d.count),
                marker: { color: "#4ade80" }
              }]}
              layout={{
                paper_bgcolor: "transparent",
                plot_bgcolor: "transparent",
                font: { color: "#e2e8f0" },
                margin: { t: 20, b: 40, l: 40, r: 20 },
                xaxis: { title: "Fertilizer Product", color: "#475569", gridcolor: "rgba(255,255,255,0.05)" },
                yaxis: { title: "Recommendation Count", color: "#475569", gridcolor: "rgba(255,255,255,0.05)" },
                height: 300
              }}
              config={{ displayModeBar: false, responsive: true }}
              style={{ width: "100%" }}
            />
          </div>
        </div>

        {/* 5. Geospatial Map */}
        <div className="chart-card full-width fade-up" style={{ marginTop: "2rem" }}>
          <h3>🗺️ Regional Soil Health Map</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1rem" }}>
            Soil health scores visualized geographically. Upload CSVs with <code>latitude</code> and <code>longitude</code> columns to populate this map.
          </p>
          <div style={{ height: "480px", position: "relative", zIndex: 1 }}>
            <SoilMap points={geospatial_points} />
          </div>
        </div>

        {/* 6. Recent Activity Table */}
        <div className="chart-card full-width fade-up" style={{ marginTop: "2rem" }}>
          <h3>📋 Recent Analysis Activity</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1rem" }}>
            The latest 10 records processed and stored in your account.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table className="recent-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Crop</th>
                  <th>SHI</th>
                  <th>Category</th>
                  <th>N-P-K</th>
                  <th>pH</th>
                </tr>
              </thead>
              <tbody>
                {recent_records.length > 0 ? (
                  recent_records.map((r, i) => (
                    <tr key={i}>
                      <td>{new Date(r.created_at).toLocaleTimeString()}</td>
                      <td style={{ textTransform: "capitalize" }}>{r.crop_recommendation}</td>
                      <td>{r.soil_health_index.toFixed(1)}</td>
                      <td>{r.health_category}</td>
                      <td>{r.n_value}-{r.p_value}-{r.k_value}</td>
                      <td>{r.ph}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="6" style={{ textAlign: "center", padding: "2rem" }}>No recent records.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
