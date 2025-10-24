import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axiosInstance";
import PositionSelect from "../Join/Profile/PositionSelect";
import InterestSelect from "../Join/Profile/InterestSelect";
import CompleteButton from "../Join/CompleteButton";
import NameInput from "../Join/Profile/NameInput";
import logo from "../../../assets/logo.png";
import { positionMap, interestMap } from "../../../constants/position";
import Toast from "../../common/Toast";
import { setToken } from "../../../utils/tokenStorage";

const ProfileStep = () => {
    const [nickname, setNickname] = useState("");
    const [position, setPosition] = useState("");
    const [interests, setInterests] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
        visible: false,
        message: '',
        type: 'success'
    });
    const navigate = useNavigate();

    // ✅ URL 파라미터에서 토큰 처리
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("token");
        const refreshToken = urlParams.get("refreshToken");
        
        console.log("🔍 ProfileStep useEffect 토큰 처리:", {
            token: token ? "있음" : "없음",
            refreshToken: refreshToken ? "있음" : "없음",
            urlParams: urlParams.toString()
        });
        
        if (token) {
            // 토큰 저장
            setToken(token, true);
            if (refreshToken) {
                localStorage.setItem("refreshToken", refreshToken);
            }
            
            // URL 정리 (토큰 정보 제거)
            const cleanUrl = window.location.pathname;
            window.history.replaceState(null, "", cleanUrl);
            
            console.log("🔍 토큰 저장 완료:", {
                storedToken: localStorage.getItem("accessToken") ? "있음" : "없음"
            });
        }
    }, []);

    const handleSubmit = async () => {
        if (!nickname || !position || interests.length === 0) {
            setToast({
                visible: true,
                message: "닉네임, 포지션, 관심사를 모두 입력해주세요.",
                type: 'error'
            });
            return;
        }

        // ✅ 토큰 체크 및 디버깅
        const token = localStorage.getItem("accessToken");
        console.log("🔍 ProfileStep 토큰 체크:", {
            token: token ? "있음" : "없음",
            tokenLength: token?.length,
            localStorage: Object.keys(localStorage).filter(k => k.includes('Token') || k.includes('token')),
            urlParams: new URLSearchParams(window.location.search).toString()
        });
        
        if (!token) {
            setToast({
                visible: true,
                message: "로그인이 필요합니다.",
                type: 'error'
            });
            setTimeout(() => navigate("/login"), 2000);
            return;
        }

        setLoading(true);
        try {
            const positionId = positionMap[position];
            const interestIds = interests.map((item) => interestMap[item]);

            await api.put("/users/profile", {
                nickname,
                positionId,
                interestIds,
            });

            // ✅ 닉네임을 localStorage에 저장
            localStorage.setItem("userNickname", nickname);
            console.log("🔍 닉네임 저장 완료:", {
                nickname,
                storedNickname: localStorage.getItem("userNickname")
            });

            setToast({
                visible: true,
                message: "프로필 설정 완료!",
                type: 'success'
            });
            setTimeout(() => navigate("/"), 2000);
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message;
            if (msg.includes("닉네임")) {
                setToast({
                    visible: true,
                    message: "이미 사용 중인 닉네임입니다.",
                    type: 'error'
                });
            } else {
                setToast({
                    visible: true,
                    message: "프로필 설정 실패: " + msg,
                    type: 'error'
                });
            }
        } finally {
            setLoading(false);
        }
    };

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
            <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
                <img src={logo} alt="logo" className="w-36 mb-10" />

                <div className="w-full max-w-sm space-y-6">
                    <NameInput value={nickname} onChange={setNickname} />
                    <PositionSelect selected={position} onChange={setPosition} />
                    <InterestSelect selected={interests} onChange={setInterests} />
                </div>

                <CompleteButton
                    onComplete={handleSubmit}
                    completeDisabled={!nickname || !position || interests.length === 0 || loading}
                    className="mt-8"
                />
            </div>
        </>
    );
};

export default ProfileStep;
