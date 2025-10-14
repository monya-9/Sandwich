// src/components/challenge/EmptySubmissionState.tsx
import React from "react";
import { CTAButton } from "./common";
import logoImage from "../../assets/logo.png";

type EmptySubmissionStateProps = {
    type: "CODE" | "PORTFOLIO";
    onSubmit: () => void;
};

export default function EmptySubmissionState({ type, onSubmit }: EmptySubmissionStateProps) {
    const isCode = type === "CODE";
    
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <img 
                src={logoImage} 
                alt="Sandwich Logo" 
                className="w-32 h-auto mb-6 opacity-60 object-contain"
            />
            <h3 className="text-xl font-bold text-neutral-700 mb-2">
                아직 제출물이 없습니다
            </h3>
            <p className="text-neutral-500 mb-6 max-w-md">
                이 챌린지의 첫 번째 제출자가 되어보세요!<br />
                창의적인 {isCode ? "코드" : "포트폴리오"}를 기다리고 있습니다.
            </p>
            <CTAButton as="button" onClick={onSubmit}>
                첫 번째 제출하기 🚀
            </CTAButton>
        </div>
    );
}
