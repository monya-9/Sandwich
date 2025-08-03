import axios from "axios";
import { getToken } from "../utils/tokenStorage";

const api = axios.create({
    baseURL: "/api", // ✅ setupProxy.js 덕분에 포트 자동 처리
});

// ✅ 요청 인터셉터: accessToken 자동 첨부
api.interceptors.request.use((config) => {
    const token = getToken();
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ✅ 응답 인터셉터: 401 시 바로 에러만 반환 (RefreshToken 사용 X)
api.interceptors.response.use(
    (res) => res,
    (error) => {
        // 그냥 에러 반환 (자동 재시도 없음)
        return Promise.reject(error);
    }
);

export default api;
