import React, { useEffect } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./SoilMap.css";

// Color based on Soil Health Index score
function getSHIColor(shi) {
  if (shi === null || shi === undefined) return "#94a3b8";
  if (shi >= 80) return "#22c55e";   // Excellent - green
  if (shi >= 60) return "#a3e635";   // Good - lime
  if (shi >= 40) return "#facc15";   // Moderate - yellow
  if (shi >= 20) return "#fb923c";   // Poor - orange
  return "#f87171";                   // Critical - red
}

// Auto-fit map to all markers
function AutoFit({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [points, map]);
  return null;
}

export default function SoilMap({ points }) {
  if (!points || points.length === 0) {
    return (
      <div className="map-empty">
        <div className="map-empty-icon">🗺️</div>
        <h3>No Geospatial Data Yet</h3>
        <p>
          Upload a CSV file that includes <code>latitude</code> and <code>longitude</code>{" "}
          columns to see your soil data plotted on this map.
        </p>
        <div className="map-csv-hint">
          <strong>CSV Format Example:</strong>
          <code>N, P, K, pH, temperature, humidity, rainfall, organic_carbon, latitude, longitude</code>
          <code>90, 42, 43, 6.5, 25, 80, 200, 0.8, 28.6139, 77.2090</code>
        </div>
      </div>
    );
  }

  // Default center = average of all points
  const centerLat = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const centerLng = points.reduce((s, p) => s + p.lng, 0) / points.length;

  return (
    <div className="soil-map-wrapper">
      {/* Legend */}
      <div className="map-legend">
        <span className="legend-title">Soil Health Index</span>
        <div className="legend-items">
          <span className="legend-dot" style={{ background: "#22c55e" }} /> Excellent (≥80)
          <span className="legend-dot" style={{ background: "#a3e635" }} /> Good (≥60)
          <span className="legend-dot" style={{ background: "#facc15" }} /> Moderate (≥40)
          <span className="legend-dot" style={{ background: "#fb923c" }} /> Poor (≥20)
          <span className="legend-dot" style={{ background: "#f87171" }} /> Critical
        </div>
      </div>

      <MapContainer
        center={[centerLat, centerLng]}
        zoom={6}
        style={{ height: "480px", width: "100%", borderRadius: "0.75rem" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <AutoFit points={points} />

        {points.map((p, i) => (
          <CircleMarker
            key={i}
            center={[p.lat, p.lng]}
            radius={10}
            pathOptions={{
              fillColor: getSHIColor(p.shi),
              color: "#0f172a",
              weight: 1.5,
              fillOpacity: 0.85,
            }}
          >
            <Popup>
              <div className="map-popup">
                <div className="popup-header" style={{ color: getSHIColor(p.shi) }}>
                  {p.category || "Unknown"} Soil
                </div>
                <div className="popup-row"><span>SHI Score:</span> <strong>{p.shi?.toFixed(1) ?? "N/A"}</strong></div>
                <div className="popup-row"><span>Crop:</span> <strong>{p.crop ?? "N/A"}</strong></div>
                <div className="popup-row"><span>Est. Yield:</span> <strong>{p.yield ? `${p.yield} t/ha` : "N/A"}</strong></div>
                <div className="popup-row"><span>Coords:</span> <strong>{p.lat.toFixed(4)}, {p.lng.toFixed(4)}</strong></div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      <p className="map-point-count">{points.length} data point{points.length !== 1 ? "s" : ""} plotted</p>
    </div>
  );
}
