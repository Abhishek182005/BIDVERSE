import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("bv_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthCheck = error.config?.url?.includes("/auth/me");
    const alreadyOnLogin =
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/auth");
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      !isAuthCheck &&
      !alreadyOnLogin
    ) {
      // Token expired — clear and redirect to login
      localStorage.removeItem("bv_token");
      localStorage.removeItem("bv_user");
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  },
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
};

// ─── Auctions ────────────────────────────────────────────────────────────────
export const auctionsApi = {
  getAll: (params) => api.get("/auctions", { params }),
  getOne: (id) => api.get(`/auctions/${id}`),
  create: (data) => api.post("/auctions", data),
  update: (id, data) => api.put(`/auctions/${id}`, data),
  delete: (id) => api.delete(`/auctions/${id}`),
  close: (id) => api.post(`/auctions/${id}/close`),
  generateDescription: (data) =>
    api.post("/auctions/generate-description", data),
};

// ─── Bids ────────────────────────────────────────────────────────────────────
export const bidsApi = {
  place: (data) => api.post("/bids", data),
  getAuctionBids: (auctionId) => api.get(`/bids/auction/${auctionId}`),
  getMyBids: (params) => api.get("/bids/my", { params }),
  getSuggestions: (auctionId) => api.get(`/bids/suggestions/${auctionId}`),
  setAutoBid: (data) => api.post("/bids/autobid", data),
  getAutoBid: (auctionId) => api.get(`/bids/autobid/${auctionId}`),
  cancelAutoBid: (auctionId) => api.delete(`/bids/autobid/${auctionId}`),
};

// ─── Admin ───────────────────────────────────────────────────────────────────
export const adminApi = {
  getStats: () => api.get("/admin/stats"),
  getUsers: (params) => api.get("/admin/users", { params }),
  assignCredits: (userId, data) =>
    api.put(`/admin/users/${userId}/credits`, data),
  toggleUserStatus: (userId) => api.put(`/admin/users/${userId}/toggle-status`),
  getReports: (params) => api.get("/admin/reports", { params }),
  getAuctionReport: (auctionId) => api.get(`/admin/reports/${auctionId}`),
};

// ─── Upload ──────────────────────────────────────────────────────────────────
export const uploadApi = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append("image", file);
    return api.post("/upload/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// ─── Users ───────────────────────────────────────────────────────────────────
export const usersApi = {
  getProfile: () => api.get("/users/profile"),
  updateProfile: (data) => api.put("/users/profile", data),
  getNotifications: (params) => api.get("/users/notifications", { params }),
  markNotificationsRead: (data) => api.put("/users/notifications/read", data),
};

export default api;
