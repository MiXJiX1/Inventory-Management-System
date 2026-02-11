import api from "../lib/api";

export const authService = {
    login: async (data: any) => {
        return api.post("/auth/login", data);
    },
    register: async (data: any) => {
        return api.post("/auth/register", data);
    },
    logout: async () => {
        return api.post("/auth/logout");
    },
    me: async () => {
        return api.get("/auth/me");
    },
};
