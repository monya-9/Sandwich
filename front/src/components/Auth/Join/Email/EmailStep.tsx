import React, { useEffect, useRef, useState } from "react";
import EmailInput from "./EmailInput";
import CodeVerification from "./CodeVerification";
import PasswordInput from "./PasswordInput";
import StepButtonGroup from "../StepButtonGroup";
import TermsAgreement from "./TermsAgreement";
import logo from "../../../../assets/logo.png";
import { Link } from "react-router-dom";

import api from "../../../../api/axiosInstance";
import RecaptchaV2, { RecaptchaV2Handle } from "../../RecaptchaV2";

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
    const [verifyStatus, setVerifyStatus] =
        useState<"default" | "success" | "error" | "timeout">("default");
    const [emailSentMessage, setEmailSentMessage] = useState("");
    const [showVerifyMessage, setShowVerifyMessage] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    // v2
    const [captcha, setCaptcha] = useState<string | null>(null);
    const [captchaMsg, setCaptchaMsg] = useState<string>("");
    const [sending, setSending] = useState(false);
    const [showCaptcha, setShowCaptcha] = useState(true); // 성공 시 숨김, 재전송 시 자동 표시

    const recaptchaRef = useRef<RecaptchaV2Handle>(null);

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
            const res = await api.post("/email/verify", { email, code });
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

    const resetCaptchaBox = () => {
        try {
            recaptchaRef.current?.reset();
        } finally {
            setCaptcha(null);
        }
    };

    const handleSendCode = async () => {
        // 토큰 없으면 위젯 표시 + 안내
        if (!captcha) {
            setShowCaptcha(true);
            setCaptchaMsg("이 체크박스를 완료해야 이메일 인증이 가능합니다.");
            return;
        }
        try {
            setSending(true);
            await api.post(
                "/email/send",
                { email },
                { headers: { "X-Recaptcha-Token": captcha } }
            );

            setEmailSent(true);
            setTimeLeft(300);
            setIsVerified(false);
            setCode("");
            setVerifyStatus("default");
            setEmailSentMessage("✔ 인증번호가 발송되었습니다.");
            setCaptchaMsg("");
            setShowCaptcha(false); // 성공했으니 박스 숨김
        } catch (e: any) {
            const code = e?.response?.data?.code || "";
            if (code === "RECAPTCHA_FAIL") {
                setCaptchaMsg("reCAPTCHA 검증에 실패했어요. 다시 체크해 주세요.");
            } else {
                setCaptchaMsg("이메일 전송에 실패했어요. 잠시 후 다시 시도해 주세요.");
            }
            setShowCaptcha(true); // 실패 시 다시 표시
        } finally {
            setSending(false);
            resetCaptchaBox(); // v2 토큰 일회성 → 항상 reset
        }
    };

    // 타이머
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (emailSent && !isVerified && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
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
    const derivedStatus = isVerified ? "success" : timeLeft <= 0 ? "timeout" : verifyStatus;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
            <Link to="/">
                <img src={logo} alt="Sandwich Logo" className="w-36 mb-10" />
            </Link>

            <div className="w-full max-w-sm space-y-6">
                {/* reCAPTCHA: 이메일 입력 위, 성공 시만 display:none (언마운트 X) */}
                <div className="space-y-1" style={{ display: showCaptcha ? undefined : "none" }}>
                    <RecaptchaV2
                        ref={recaptchaRef}
                        onVerify={(t) => {
                            setCaptcha(t);
                            setCaptchaMsg("");
                        }}
                        onExpire={() => {
                            setCaptcha(null);
                            setCaptchaMsg("체크가 만료되었어요. 다시 체크해 주세요.");
                            setShowCaptcha(true);
                        }}
                        onError={() => {
                            setCaptcha(null);
                            setCaptchaMsg("reCAPTCHA 로딩에 실패했습니다. 새로고침하거나 잠시 후 다시 시도해 주세요.");
                            setShowCaptcha(true);
                        }}
                    />
                    {captchaMsg && <p className="text-xs text-gray-500 text-left">{captchaMsg}</p>}
                </div>

                <EmailInput
                    email={email}
                    onChange={setEmail}
                    onSend={handleSendCode}
                    disabled={isVerified || sending}
                    sent={emailSent}
                    verified={isVerified}
                    message={emailSentMessage}
                />

                {emailSent && (
                    <CodeVerification
                        code={code}
                        setCode={setCode}
                        onVerify={handleVerifyCode}
                        disabled={isVerified || derivedStatus === "timeout"}
                        readOnly={isVerified}
                        status={derivedStatus}
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
