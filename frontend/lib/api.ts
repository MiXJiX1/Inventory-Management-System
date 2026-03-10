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
                // If refresh fails, we MUST clear the cookies from the server side
                // to prevent the middleware from redirecting us back into a loop.
                try {
                    const logoutUrl = `${(process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/$/, "")}/auth/logout`;
                    await axios.post(logoutUrl, {}, { withCredentials: true });
                } catch (e) {
                    console.error("Failed to clear cookies during refresh failure:", e);
                }

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
