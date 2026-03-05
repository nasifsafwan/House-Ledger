import api from "./client";

export const MessAPI = {
  create: (payload) => api.post("/mess", payload),
  join: (payload) => api.post("/mess/join", payload),
  myMesses: () => api.get("/mess/me"),

  // Inside mess
  memberSummary: (messId, monthKey) =>
    api.get(`/mess/${messId}/summary/member`, { params: { monthKey } }),

  managerSummary: (messId, monthKey) =>
    api.get(`/mess/${messId}/summary/manager`, { params: { monthKey } }),

  // meals
  logMeal: (messId, payload) => api.post(`/mess/${messId}/meals`, payload),
  listMeals: (messId, params) => api.get(`/mess/${messId}/meals`, { params }),

  // bills
  getBills: (messId, monthKey) => api.get(`/mess/${messId}/bills`, { params: { monthKey } }),
  setBills: (messId, payload) => api.put(`/mess/${messId}/bills`, payload),

  // meal price
  getMealPrice: (messId, monthKey) =>
    api.get(`/mess/${messId}/meal-price`, { params: { monthKey } }),
  setMealPrice: (messId, payload) => api.put(`/mess/${messId}/meal-price`, payload),

  // visitors
  addVisitor: (messId, payload) => api.post(`/mess/${messId}/visitors`, payload),
  listVisitors: (messId) => api.get(`/mess/${messId}/visitors`),

  // reminder
  getReminder: (messId) => api.get(`/mess/${messId}/reminder`),
  setReminder: (messId, payload) => api.put(`/mess/${messId}/reminder`, payload),

  createSettlement: (messId, payload) => api.post(`/mess/${messId}/settlements`, payload),
  listSettlements: (messId, monthKey) => api.get(`/mess/${messId}/settlements`, { params: { monthKey } }),
  paySettlement: (messId, settlementId, payload) =>
    api.post(`/mess/${messId}/settlements/${settlementId}/pay`, payload),
  settleSettlement: (messId, settlementId) =>
    api.patch(`/mess/${messId}/settlements/${settlementId}/settle`)
};
