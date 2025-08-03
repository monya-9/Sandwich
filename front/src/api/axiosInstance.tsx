import axios from "axios";

const api = axios.create({
    baseURL: "/api", // setupProxy 사용 시
});

// 요청 시 AccessToken 자동 첨부
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 응답 시 401 → Refresh Token으로 재발급
api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken");
            if (!refreshToken) {
                // 토큰 없으면 로그인으로
                window.location.href = "/login";
                return Promise.reject(error);
            }

            try {
                const res = await axios.post("/api/auth/refresh", { refreshToken });
                const { accessToken, refreshToken: newRefreshToken } = res.data;

                // Storage 갱신
                const keep = !!localStorage.getItem("refreshToken");
                if (keep) {
                    localStorage.setItem("accessToken", accessToken);
                    localStorage.setItem("refreshToken", newRefreshToken);
                } else {
                    sessionStorage.setItem("accessToken", accessToken);
                    sessionStorage.setItem("refreshToken", newRefreshToken);
                }

                // 원래 요청 재시도
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshErr) {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = "/login";
                return Promise.reject(refreshErr);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
