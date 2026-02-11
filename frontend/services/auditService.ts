
import api from "../lib/api";

export const auditService = {
    getLogs: async (params?: { page?: number; limit?: number; action?: string; userId?: string; search?: string }) => {
        return api.get("/audit-logs", { params });
    },
};
