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
        if (
            originalRequest._retry ||
            originalRequest.url?.includes("/auth/refresh")
        ) {
            return Promise.reject(error);
        }

        if (error.response?.status === 401) {
            if (originalRequest._retry) return Promise.reject(error);
            originalRequest._retry = true;
            if (isRefreshing) return Promise.reject(error);
            isRefreshing = true;
            try {
                await api.post("/auth/refresh");
                isRefreshing = false;
                return api(originalRequest);
            } catch (refreshError) {
                isRefreshing = false;
                // If refresh fails, clear the user and go to login
                if (typeof window !== "undefined") {
                    window.location.href = "/login";
                }
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
