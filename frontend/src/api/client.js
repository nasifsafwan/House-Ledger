import axios from "axios";
import { authStore } from "../store/authStore";

const isLocalhost = typeof window !== "undefined" && window.location.hostname === "localhost";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (isLocalhost ? "http://localhost:8080/api" : "/api")
});

api.interceptors.request.use((config) => {
  const token = authStore.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authStore.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;