// pages/GitHubCallback.tsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const GitHubCallback = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const code = new URL(window.location.href).searchParams.get("code");

        if (code) {
            axios
                .post("/api/auth/signup", {
                    provider: "github",
                    code,
                })
                .then((res) => {
                    const { accessToken, refreshToken } = res.data;
                    localStorage.setItem("accessToken", accessToken);
                    localStorage.setItem("refreshToken", refreshToken);
                    navigate("/"); // 로그인 후 메인으로 이동
                })
                .catch((err) => {
                    alert("GitHub 로그인 실패");
                    console.error(err);
                    navigate("/join");
                });
        } else {
            alert("GitHub 인증 코드가 없습니다.");
            navigate("/join");
        }
    }, [navigate]);

    return <div className="text-center mt-10">GitHub 로그인 처리 중...</div>;
};

export default GitHubCallback;
