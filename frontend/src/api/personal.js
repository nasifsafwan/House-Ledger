import api from "./client";

export const PersonalAPI = {
    create: (payload) => api.post("/personal", payload),
    list: (params) => api.get("/personal", { params }),
    remove: (id) => api.delete(`/personal/${id}`),
};
