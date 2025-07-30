import React, { useState } from "react";
import JoinIntro from "../../components/Auth/Join/intro/JoinIntro";
import EmailStep from "../../components/Auth/Join/Email/EmailStep";
import ProfileStep from "../../components/Auth/Join/Profile/ProfileStep"; // ✅ 수정된 부분

const JoinPage = () => {
    const [step, setStep] = useState(0);

    const nextStep = () => setStep((prev) => prev + 1);
    const prevStep = () => setStep((prev) => Math.max(prev - 1, 0));

    return (
        <div className="min-h-screen flex justify-center items-center">
            {step === 0 && <JoinIntro onNext={nextStep} />}
            {step === 1 && <EmailStep onNext={nextStep} onPrev={prevStep} />}
            {step === 2 && <ProfileStep onPrev={prevStep} />} {/* ✅ 최종 단계 */}
        </div>
    );
};

export default JoinPage;
