// ✅ EmailStep.tsx
import React, { useEffect, useState } from "react";
import EmailInput from "./EmailInput";
import CodeVerification from "./CodeVerification";
import PasswordInput from "./PasswordInput";
import StepButtonGroup from "../StepButtonGroup";
import TermsAgreement from "./TermsAgreement";
import logo from "../../../../assets/logo.png";
import axios from "axios";
import { Link } from "react-router-dom";

interface Props {
    onNext: () => void;
    onPrev: () => void;
}

const EmailStep = ({ onNext, onPrev }: Props) => {
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");

    const [emailSent, setEmailSent] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [timeLeft, setTimeLeft] = useState(300);
    const [verifyStatus, setVerifyStatus] = useState<"default" | "success" | "error" | "timeout">("default");
    const [emailSentMessage, setEmailSentMessage] = useState("");
    const [showVerifyMessage, setShowVerifyMessage] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("joinStep1");
        if (saved) {
            const { email, password, passwordConfirm, agreedToTerms } = JSON.parse(saved);
            setEmail(email);
            setPassword(password);
            setPasswordConfirm(passwordConfirm);
            setAgreedToTerms(agreedToTerms);
        }
    }, []);

    const handleNext = () => {
        localStorage.setItem(
            "joinStep1",
            JSON.stringify({ email, password, passwordConfirm, agreedToTerms })
        );
        onNext();
    };

    const handleVerifyCode = async () => {
        try {
            const res = await axios.post("/api/email/verify", { email, code });
            if (res.data?.success === true) {
                setIsVerified(true);
                setVerifyStatus("success");
                setEmailSentMessage("");
                setTimeLeft(0);
                setShowVerifyMessage(true);
                setTimeout(() => setShowVerifyMessage(false), 10000);
            } else {
                setVerifyStatus("error");
            }
        } catch {
            setVerifyStatus("error");
        }
    };

    const handleSendCode = async () => {
        try {
            await axios.post("/api/email/send", { email });
            setEmailSent(true);
            setTimeLeft(300);
            setIsVerified(false);
            setCode("");
            setVerifyStatus("default");
            setEmailSentMessage("✔ 인증번호가 발송되었습니다.");
        } catch {
            alert("이메일 인증번호 전송 실패");
        }
    };

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (emailSent && !isVerified && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [emailSent, timeLeft, isVerified]);

    const isPasswordValid =
        password.length >= 8 &&
        password.length <= 20 &&
        /[A-Za-z]/.test(password) &&
        /[0-9!@#$%^&*()\-_=+]/.test(password) &&
        password === passwordConfirm;

    const minutes = Math.floor(timeLeft / 60);
    const seconds = String(timeLeft % 60).padStart(2, "0");

    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
            <Link to="/">
                <img src={logo} alt="Sandwich Logo" className="w-36 mb-10" />
            </Link>

            <div className="w-full max-w-sm space-y-6">
                <EmailInput
                    email={email}
                    onChange={setEmail}
                    onSend={handleSendCode}
                    disabled={isVerified}
                    sent={emailSent}
                    verified={isVerified}
                    message={emailSentMessage}
                />

                {emailSent && (
                    <CodeVerification
                        code={code}
                        setCode={setCode}
                        onVerify={handleVerifyCode}
                        disabled={isVerified || timeLeft <= 0}
                        readOnly={isVerified}
                        status={verifyStatus === "success" ? "success" : timeLeft <= 0 ? "timeout" : verifyStatus}
                        timeDisplay={`${minutes}:${seconds}`}
                        showSuccessMessage={showVerifyMessage}
                    />
                )}

                <PasswordInput
                    password={password}
                    passwordConfirm={passwordConfirm}
                    onPasswordChange={setPassword}
                    onConfirmChange={setPasswordConfirm}
                />

                <TermsAgreement
                    agreed={agreedToTerms}
                    onToggle={() => setAgreedToTerms((prev) => !prev)}
                />
            </div>

            <StepButtonGroup
                onNext={handleNext}
                onPrev={onPrev}
                nextDisabled={!isVerified || !isPasswordValid || !agreedToTerms}
                className="mt-8"
            />
        </div>
    );
};

export default EmailStep;
