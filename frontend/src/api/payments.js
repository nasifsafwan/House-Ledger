import api from "./client";

export const PaymentsAPI = {
  selfPaid: (messId, payload) =>
    api.post(`/payments/${messId}/self-paid`, payload),
  markReceived: (messId, memberUserId, payload) =>
    api.put(`/payments/${messId}/${memberUserId}`, payload),
  list: (messId, monthKey) => api.get(`/payments/${messId}`, { params: { monthKey } })
};