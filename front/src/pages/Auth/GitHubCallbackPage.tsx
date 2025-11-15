// pages/GitHubCallback.tsx
import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Toast from "../../components/common/Toast";
import { AuthContext } from "../../context/AuthContext";

const GitHubCallback = () => {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);
    const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
        visible: false,
        message: '',
        type: 'success'
    });

    useEffect(() => {
        const code = new URL(window.location.href).searchParams.get("code");

        if (code) {
            // ✅ httpOnly 쿠키 기반: 토큰은 쿠키로 자동 설정됨
            axios
                .post(`${process.env.REACT_APP_API_BASE || "/api"}/auth/signup`, {
                    provider: "github",
                    code,
                }, {
                    headers: { 'X-Skip-Auth-Refresh': '1' },
                    withCredentials: true
                })
                .then(async (res) => {
                    // ✅ 토큰은 httpOnly 쿠키로 자동 설정됨 (localStorage 저장 안 함)
                    
                    // 최근 로그인 방법 저장
                    localStorage.setItem("lastLoginMethod", "github");
                    
                    // AuthContext 업데이트 (사용자 정보 자동 로드)
                    const email = res.data?.email;
                    await login(email);
                    
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
    }, [navigate, login]);

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
