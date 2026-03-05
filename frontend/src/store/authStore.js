const KEY = "mess_auth_v1";

export const authStore = {
  get() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || { token: null, user: null };
    } catch {
      return { token: null, user: null };
    }
  },
  set(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  },
  clear() {
    localStorage.removeItem(KEY);
  },
  getToken() {
    return this.get().token;
  },
  getUser() {
    return this.get().user;
  }
};