import axios from "axios";

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return "https://law-ai-ts2x.onrender.com/api/v1";
  }
  return "http://localhost:8000/api/v1";
};

const API_BASE_URL = getApiBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
  withCredentials: true,
});

// Request interceptor: attach Bearer token if present
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("law_ai_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: auto-refresh on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    // If 401 and not already retrying or requesting auth endpoints
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true, timeout: 15000 }
        );
        const newToken = res.data?.access_token;
        if (newToken) {
          localStorage.setItem("law_ai_token", newToken);
          if (res.data?.user) {
            localStorage.setItem("law_ai_user", JSON.stringify(res.data.user));
          }
          apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem("law_ai_token");
        localStorage.removeItem("law_ai_user");
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const LegalApiService = {
  // 1. Interactive Chat
  async sendChatMessage(payload) {
    const response = await apiClient.post("/chat", payload);
    return response.data;
  },

  // 2. Generate Formal Strategy Report
  async generateReport(payload) {
    const response = await apiClient.post("/generate-report", payload);
    return response.data;
  },

  // 3. Download Court-Ready PDF Report
  async downloadReportPdf(payload, filename = "Supreme_Court_Strategy_Brief.pdf") {
    const response = await apiClient.post("/export-report-pdf", payload, {
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // 4. Analyze Case via File Upload (Multipart Form)
  async analyzeCaseFile(formData) {
    const response = await apiClient.post("/analyze-case", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // 5. Standalone Precedent Search
  async searchPrecedents(query, topK = 5) {
    const params = new URLSearchParams();
    params.append("query", query);
    params.append("top_k", topK.toString());
    const response = await apiClient.post("/search-precedents", params);
    return response.data;
  },

  // 6. Health Check
  async checkHealth() {
    const response = await apiClient.get("/health");
    return response.data;
  },

  // ============================================================================
  // Authentication & Session APIs
  // ============================================================================
  async register(email, fullName, password) {
    const response = await apiClient.post("/auth/register", {
      email,
      full_name: fullName,
      password,
    });
    if (response.data?.access_token) {
      localStorage.setItem("law_ai_token", response.data.access_token);
      localStorage.setItem("law_ai_user", JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async login(email, password) {
    const response = await apiClient.post("/auth/login", { email, password });
    if (response.data?.access_token) {
      localStorage.setItem("law_ai_token", response.data.access_token);
      localStorage.setItem("law_ai_user", JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async logout() {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      localStorage.removeItem("law_ai_token");
      localStorage.removeItem("law_ai_user");
    }
  },

  async getMe() {
    const response = await apiClient.get("/auth/me");
    if (response.data) {
      localStorage.setItem("law_ai_user", JSON.stringify(response.data));
    }
    return response.data;
  },

  async verifyEmail(token) {
    const response = await apiClient.post("/auth/verify-email", { token });
    return response.data;
  },

  async resendVerification(email) {
    const response = await apiClient.post("/auth/resend-verification", { email });
    return response.data;
  },

  async forgotPassword(email) {
    const response = await apiClient.post("/auth/forgot-password", { email });
    return response.data;
  },

  async resetPassword(token, newPassword) {
    const response = await apiClient.post("/auth/reset-password", {
      token,
      new_password: newPassword,
    });
    return response.data;
  },

  async changePassword(currentPassword, newPassword) {
    const response = await apiClient.post("/auth/change-password", {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  // ============================================================================
  // Consultations Persistence APIs
  // ============================================================================
  async getConsultations() {
    const response = await apiClient.get("/consultations");
    return response.data?.consultations || [];
  },

  async saveConsultation(payload) {
    const response = await apiClient.post("/consultations", payload);
    return response.data;
  },

  async getConsultation(id) {
    const response = await apiClient.get(`/consultations/${id}`);
    return response.data;
  },

  async deleteConsultation(id) {
    const response = await apiClient.delete(`/consultations/${id}`);
    return response.data;
  },
};
