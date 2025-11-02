import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axiosInstance";
import PositionSelect from "../Join/Profile/PositionSelect";
import InterestSelect from "../Join/Profile/InterestSelect";
import CompleteButton from "../Join/CompleteButton";
import NameInput from "../Join/Profile/NameInput";
import { getStaticUrl } from "../../../config/staticBase";
import { positionMap, interestMap } from "../../../constants/position";
import Toast from "../../common/Toast";

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

    // ✅ httpOnly 쿠키는 JavaScript에서 읽을 수 없음 (보안상 정상)
    // axios가 자동으로 쿠키를 전송하므로 문제없음
    useEffect(() => {
        console.log("🔍 ProfileStep - httpOnly 쿠키 방식으로 작동 중");
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

        // ✅ httpOnly 쿠키는 JavaScript로 확인 불가
        // API 호출이 401을 반환하면 자동으로 리프레시 시도함

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
            sessionStorage.setItem("userNickname", nickname);
            
            // 닉네임 변경 이벤트 발생
            window.dispatchEvent(new Event("user-nickname-updated"));

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
            <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center bg-white dark:bg-black">
                <img src={getStaticUrl("assets/logo.png")} alt="logo" className="w-36 mb-10" />

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
