import axios from "axios";

// Read API URL from Vite environment, fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to inject JWT Token dynamically from local storage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email, password) => {
    const params = new URLSearchParams();
    params.append("username", email);
    params.append("password", password);
    const response = await api.post("/auth/token", params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    if (response.data.access_token) {
      localStorage.setItem("token", response.data.access_token);
    }
    return response.data;
  },

  register: async (email, password, fullName) => {
    const response = await api.post("/auth/register", {
      email,
      password,
      full_name: fullName,
    });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("token");
  },
};

export const dashboardService = {
  getState: async () => {
    const response = await api.get("/api/dashboard");
    return response.data;
  },

  runSimulation: async () => {
    const response = await api.post("/api/simulation");
    return response.data;
  },

  applyAI: async (insightType) => {
    const response = await api.post(`/api/optimize/${insightType}`);
    return response.data;
  },

  joinChallenge: async (challengeId) => {
    const response = await api.post(`/api/challenges/${challengeId}/join`);
    return response.data;
  },

  redeemReward: async (rewardId) => {
    const response = await api.post(`/api/rewards/${rewardId}/redeem`);
    return response.data;
  },

  resetState: async () => {
    const response = await api.post("/api/dashboard/reset");
    return response.data;
  },
  
  getAuditReport: async () => {
    const response = await api.get("/api/reports/esg_summary");
    return response.data;
  }
};

export default api;
