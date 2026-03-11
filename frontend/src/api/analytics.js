import api from "./client";

export const AnalyticsAPI = {
    personal: (params) => api.get("/analytics/personal", { params }),
    mess: (messId, params) => api.get(`/analytics/mess/${messId}`, { params }),
};
