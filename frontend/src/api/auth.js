import api from "./client";

export const AuthAPI = {
    register: (payload) => api.post("/auth/register", payload),
    login: (payload) => api.post("/auth/login", payload),
};