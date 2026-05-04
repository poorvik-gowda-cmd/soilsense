import React, { useState } from "react";
import { uploadCsv } from "../api/client";
import "./CsvUploader.css";

export default function CsvUploader({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setMsg(null);
    setError(null);
    try {
      const res = await uploadCsv(file);
      setMsg(res.data.message);
      if (onUploadSuccess) onUploadSuccess();
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to upload file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="csv-uploader">
      <div 
        className="dropzone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {file ? (
          <p className="file-name">Selected: {file.name}</p>
        ) : (
          <p>Drag & Drop a CSV file here, or click to select</p>
        )}
        <input 
          type="file" 
          accept=".csv" 
          onChange={(e) => setFile(e.target.files[0])} 
          style={{ display: "none" }} 
          id="csv-file-input" 
        />
        <label htmlFor="csv-file-input" className="btn btn-secondary">
          Browse Files
        </label>
      </div>

      {file && (
        <button 
          className="btn btn-primary upload-btn" 
          onClick={handleUpload} 
          disabled={loading}
        >
          {loading ? "Processing..." : "Process Data"}
        </button>
      )}

      {error && <div className="alert error">{error}</div>}
      {msg && <div className="alert success">{msg}</div>}
    </div>
  );
}
