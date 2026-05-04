import axios from "axios";
import { supabase } from "../lib/supabase";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE,
  timeout: 30000,
});

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export const predictSoil = (data) => api.post("/predict", data);
export const uploadCsv = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};
export const getHistory = (limit = 20) => api.get(`/history?limit=${limit}`);
export const getAnalytics = () => api.get("/analytics");
export const healthCheck = () => api.get("/health");

export default api;
