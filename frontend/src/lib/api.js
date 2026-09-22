import axios from "axios";

// Production: frontend and backend are on the same Render URL.
// Local development: optionally set REACT_APP_BACKEND_URL.
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("fanops_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      const path = window.location.pathname;
      if (path !== "/login") {
        localStorage.removeItem("fanops_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);
