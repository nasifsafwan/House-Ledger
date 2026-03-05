import api from "./client";

export const MembersAPI = {
    list: (messId) => api.get(`/members/${messId}`),
    remove: (messId, memberId) => api.delete(`/members/${messId}/${memberId}`),
    setRent: (messId, memberId, payload) =>
        api.patch(`/members/${messId}/${memberId}/rent`, payload),
};