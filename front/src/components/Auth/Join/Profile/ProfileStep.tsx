import React, { useEffect, useState } from "react";
import api from "../../../../api/axiosInstance";
import NameInput from "./NameInput";
import PositionSelect from "./PositionSelect";
import InterestSelect from "./InterestSelect";
import CompleteButton from "../CompleteButton";
import logo from "../../../../assets/logo.png";
import { useNavigate } from "react-router-dom";
import { FALLBACK_POSITIONS, FALLBACK_INTERESTS_GENERAL } from "../../../../constants/position";

interface Props { onPrev: () => void; }

const ProfileStep = ({ onPrev }: Props) => {
    const [nickname, setNickname] = useState("");
    const [position, setPosition] = useState("");
    const [interests, setInterests] = useState<string[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const saved = localStorage.getItem("joinStep2");
        if (saved) {
            const { nickname, position, interests } = JSON.parse(saved);
            setNickname(nickname);
            setPosition(position);
            setInterests(interests);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("joinStep2", JSON.stringify({ nickname, position, interests }));
    }, [nickname, position, interests]);

    const handleSubmit = async () => {
        try {
            const step1 = localStorage.getItem("joinStep1");
            if (!step1) throw new Error("이메일 정보가 없습니다.");
            const { email, password } = JSON.parse(step1);

            // 캐시된 메타 (없으면 폴백)
            const posMeta =
                (JSON.parse(localStorage.getItem("meta.positions.v1") || "null") as Array<{id:number; name:string}> | null)
                ?? FALLBACK_POSITIONS;

            const interestMetaGeneral =
                (JSON.parse(localStorage.getItem("meta.interests.GENERAL.v1") || "null") as Array<{id:number; name:string}> | null)
                ?? FALLBACK_INTERESTS_GENERAL;

            // 이름 → id
            const positionId = posMeta.find(p => p.name === position)?.id;
            const interestIds = interests
                .map(n => interestMetaGeneral.find(i => i.name === n)?.id)
                .filter((v): v is number => typeof v === "number");

            console.log({ position, positionId, interests, interestIds });

            await api.post("/auth/signup", {
                email, password, nickname, positionId, interestIds,
            });

            alert("✅ 회원가입이 완료되었습니다.");
            localStorage.removeItem("joinStep1");
            localStorage.removeItem("joinStep2");
            navigate("/login");
        } catch (err: any) {
            alert("회원가입 실패: " + (err?.response?.data?.message || err.message));
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
                onPrev={onPrev}
                onComplete={handleSubmit}
                completeDisabled={!nickname || !position || interests.length === 0}
                className="mt-8"
            />
        </div>
    );
};

export default ProfileStep;
