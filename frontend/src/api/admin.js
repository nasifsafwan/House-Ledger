import api from "./client";

export const AdminAPI = {
  overview: () => api.get("/admin/overview"),
  users: () => api.get("/admin/users"),
  admins: () => api.get("/admin/admins"),
  deleteAdmin: (adminId) => api.delete(`/admin/remove-admin/${adminId}`),
  messes: () => api.get("/admin/messes"),
  updateUser: (userId, payload) => api.patch(`/admin/users/${userId}`, payload),
  updateMess: (messId, payload) => api.patch(`/admin/messes/${messId}`, payload),
  updateMessMember: (messId, userId, payload) => api.patch(`/admin/messes/${messId}/members/${userId}`, payload),
  removeMessMember: (messId, userId) => api.delete(`/admin/messes/${messId}/members/${userId}`),
};