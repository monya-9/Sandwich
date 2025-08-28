import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axiosInstance";
import PositionSelect from "../Join/Profile/PositionSelect";
import InterestSelect from "../Join/Profile/InterestSelect";
import CompleteButton from "../Join/CompleteButton";
import NameInput from "../Join/Profile/NameInput";
import logo from "../../../assets/logo.png";
import { positionMap, interestMap } from "../../../constants/position";

const ProfileStep = () => {
    const [nickname, setNickname] = useState("");
    const [position, setPosition] = useState("");
    const [interests, setInterests] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async () => {
        if (!nickname || !position || interests.length === 0) {
            alert("닉네임, 포지션, 관심사를 모두 입력해주세요.");
            return;
        }

        // ✅ 토큰 체크
        const token = localStorage.getItem("accessToken");
        if (!token) {
            alert("로그인이 필요합니다.");
            navigate("/login");
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

            alert("프로필 설정 완료!");
            navigate("/");
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message;
            if (msg.includes("닉네임")) {
                alert("이미 사용 중인 닉네임입니다.");
            } else {
                alert("프로필 설정 실패: " + msg);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
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
    );
};

export default ProfileStep;
