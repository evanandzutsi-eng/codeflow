// src/utils/api.js
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// Inject access token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401 TOKEN_EXPIRED
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const code = error.response?.data?.code;

    if (error.response?.status === 401 && code === "TOKEN_EXPIRED" && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRT } = data.data;
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRT);
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.dispatchEvent(new Event("auth:logout"));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const normalized = new Error(
      error.response?.data?.error || error.message || "An error occurred"
    );
    normalized.code = error.response?.data?.code;
    normalized.status = error.response?.status;
    normalized.details = error.response?.data?.details;
    return Promise.reject(normalized);
  }
);

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  logout: (refreshToken) => api.post("/auth/logout", { refreshToken }),
  me: () => api.get("/auth/me"),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (data) => api.post("/auth/reset-password", data),
};

// ─── CHAT ─────────────────────────────────────────────────────────────────────
export const chatApi = {
  getConversations: (params) => api.get("/chat/conversations", { params }),
  createConversation: (data) => api.post("/chat/conversations", data),
  getConversation: (id) => api.get(`/chat/conversations/${id}`),
  updateConversation: (id, data) => api.patch(`/chat/conversations/${id}`, data),
  deleteConversation: (id) => api.delete(`/chat/conversations/${id}`),
  sendMessage: (data) => api.post("/chat/message", { ...data, stream: false }),

  sendMessageStream: (data, { onDelta, onDone, onError, onStart }) => {
    const controller = new AbortController();
    const token = localStorage.getItem("accessToken");

    fetch(`${BASE_URL}/chat/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...data, stream: true }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          let errMsg = "Stream failed";
          try {
            const errBody = await response.json();
            errMsg = errBody.error || errMsg;
            if (response.status === 402) {
              const e = new Error(errMsg);
              e.code = errBody.code;
              onError?.(e);
              return;
            }
          } catch { /* not JSON */ }
          onError?.(new Error(errMsg));
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let done = false;

        while (!done) {
          const { done: streamDone, value } = await reader.read();
          if (streamDone) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (raw === "[DONE]") { done = true; break; }
            try {
              const parsed = JSON.parse(raw);
              if (parsed.type === "start") onStart?.(parsed);
              if (parsed.type === "delta") onDelta?.(parsed.content);
              if (parsed.type === "done") onDone?.(parsed);
              if (parsed.type === "error") {
                onError?.(new Error(parsed.error));
                done = true;
                break;
              }
            } catch { /* ignore malformed lines */ }
          }
        }
      })
      .catch((err) => { if (err.name !== "AbortError") onError?.(err); });

    return () => controller.abort();
  },
};

// ─── IMAGE ────────────────────────────────────────────────────────────────────
export const imageApi = {
  generate: (data) => api.post("/image/generate", data),
  getHistory: (params) => api.get("/image/history", { params }),
  deleteImage: (id) => api.delete(`/image/${id}`),
};

// ─── BILLING ──────────────────────────────────────────────────────────────────
export const billingApi = {
  getPlans: () => api.get("/billing/plans"),
  getCredits: (params) => api.get("/billing/credits", { params }),
  initializePayment: (data) => api.post("/billing/initialize", data),
  verifyPayment: (reference) => api.get(`/billing/verify/${reference}`),
  cancelSubscription: () => api.delete("/billing/subscription"),
};

export default api;