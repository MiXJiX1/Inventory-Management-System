import axios from "axios";

const api = axios.create({
    baseURL: (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, ""),
    withCredentials: true,
    timeout: 10000,
});

let isRefreshing = false;

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Don't retry refresh requests or already-retried requests
        if (
            originalRequest._retry ||
            originalRequest.url?.includes("/auth/refresh")
        ) {
            return Promise.reject(error);
        }

        if (error.response?.status === 401) {
            originalRequest._retry = true;
            if (isRefreshing) return Promise.reject(error);
            isRefreshing = true;
            try {
                await api.post("/auth/refresh");
                isRefreshing = false;
                return api(originalRequest);
            } catch (refreshError) {
                isRefreshing = false;
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
