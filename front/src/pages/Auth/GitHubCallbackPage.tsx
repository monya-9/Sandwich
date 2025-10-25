// pages/GitHubCallback.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Toast from "../../components/common/Toast";
import { API_BASE } from "../../config/apiBase";

const GitHubCallback = () => {
    const navigate = useNavigate();
    const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
        visible: false,
        message: '',
        type: 'success'
    });

    useEffect(() => {
        const code = new URL(window.location.href).searchParams.get("code");

        if (code) {
            axios
                .post(`${API_BASE}/auth/signup`, {
                    provider: "github",
                    code,
                })
                .then((res) => {
                    const { accessToken, refreshToken } = res.data;
                    localStorage.setItem("accessToken", accessToken);
                    localStorage.setItem("refreshToken", refreshToken);
                    setToast({
                        visible: true,
                        message: "GitHub 로그인 성공!",
                        type: 'success'
                    });
                    setTimeout(() => navigate("/"), 2000);
                })
                .catch((err) => {
                    setToast({
                        visible: true,
                        message: "GitHub 로그인 실패",
                        type: 'error'
                    });
                    console.error(err);
                    setTimeout(() => navigate("/join"), 2000);
                });
        } else {
            setToast({
                visible: true,
                message: "GitHub 인증 코드가 없습니다.",
                type: 'error'
            });
            setTimeout(() => navigate("/join"), 2000);
        }
    }, [navigate]);

    return (
        <>
            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                size="medium"
                autoClose={3000}
                closable={true}
                onClose={() => setToast(prev => ({ ...prev, visible: false }))}
            />
            <div className="text-center mt-10">GitHub 로그인 처리 중...</div>
        </>
    );
};

export default GitHubCallback;
