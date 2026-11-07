import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

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
  }
};
