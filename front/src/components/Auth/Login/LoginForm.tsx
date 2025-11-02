// src/components/auth/login/LoginForm.tsx
import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import { getStaticUrl } from "../../../config/staticBase";
import LoginInput from "./LoginInput";
import LoginButton from "./LoginButton";
import KeepLoginCheck from "./KeepLoginCheck";
import SNSLogin from "./SNSLogin";
import LoginActions from "./LoginActions";
import RecentLogin from "../RecentLogin";
import OtpForm from "./OtpForm";
import api from "../../../api/axiosInstance";
import { setToken, setRefreshToken, clearAllUserData } from "../../../utils/tokenStorage";
import { ensureNicknameInStorage } from "../../../utils/profile";

const LoginForm = () => {
    const navigate = useNavigate();
    const { login, clearState } = useContext(AuthContext);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [keepLogin, setKeepLogin] = useState(true); // 기본 체크
    const [loginFailed, setLoginFailed] = useState(false);
    
    // 🆕 MFA 관련 상태들
    const [showOtpForm, setShowOtpForm] = useState(false);
    const [pendingId, setPendingId] = useState("");
    const [maskedEmail, setMaskedEmail] = useState("");
    
    const isActive = email.trim() !== "" && password.trim() !== "";

    const handleLogin = async () => {
        try {
            // ✅ 1. 기존 모든 사용자 데이터 완전 삭제
            clearAllUserData();

            // ✅ 2. React 상태 즉시 초기화 (깜빡임 방지)
            clearState(); // React 상태만 즉시 초기화

            // ✅ public API: 로그인은 인증 없이 호출
            const res = await api.post("/auth/login", { email, password }, {
                headers: { 'X-Skip-Auth-Refresh': '1' }
            });
            
            // 🆕 MFA_REQUIRED 분기 처리
            if (res.data?.status === "MFA_REQUIRED") {
                setPendingId(res.data.pendingId);
                setMaskedEmail(res.data.maskedEmail);
                setShowOtpForm(true);
                setLoginFailed(false);
                return; // 여기서 종료
            }

            // 기존 성공 로직
            const {
                accessToken,
                refreshToken,          // ⬅️ 응답에 오면 같이 저장
                email: serverEmail,
            } = res.data || {};

            // ✅ 3. 새 토큰 저장 (keepLogin=true → localStorage, false → sessionStorage)
            setToken(accessToken, keepLogin);
            setRefreshToken(refreshToken ?? null, keepLogin); // ⬅️ 중요!

            // ✅ 4. 새 사용자 정보 저장
            const storage = keepLogin ? localStorage : sessionStorage;
            const effectiveEmail = serverEmail || email;
            storage.setItem("userEmail", effectiveEmail);
            
            // ✅ 최근 로그인 방법 저장 (이메일 로그인)
            localStorage.setItem("lastLoginMethod", "local");

            // ✅ 5. 로그인 직후 프로필/닉네임 보강
            await ensureNicknameInStorage(accessToken, effectiveEmail, storage);

            // ✅ 6. 컨텍스트 업데이트
            login(effectiveEmail);

            setLoginFailed(false);
            navigate("/");
        } catch (err) {
            console.error("로그인 오류", err);
            setLoginFailed(true);
        }
    };

    // 🆕 OTP 인증 성공 처리
    const handleOtpSuccess = async (accessToken: string, refreshToken: string) => {
        try {
            // 토큰 저장
            setToken(accessToken, keepLogin);
            setRefreshToken(refreshToken ?? null, keepLogin);

            // 사용자 정보 저장
            const storage = keepLogin ? localStorage : sessionStorage;
            const effectiveEmail = email;
            storage.setItem("userEmail", effectiveEmail);
            
            // 최근 로그인 방법 저장 (이메일 로그인)
            localStorage.setItem("lastLoginMethod", "local");

            // 로그인 직후 프로필/닉네임 보강
            await ensureNicknameInStorage(accessToken, effectiveEmail, storage);

            // 컨텍스트 업데이트
            login(effectiveEmail);

            navigate("/");
        } catch (err) {
            console.error("OTP 성공 후 처리 오류", err);
            setLoginFailed(true);
        }
    };

    // 🆕 OTP 화면에서 뒤로가기
    const handleOtpBack = () => {
        setShowOtpForm(false);
        setPendingId("");
        setMaskedEmail("");
    };

    // 🆕 OTP 화면 표시 중이면 OtpForm 렌더링
    if (showOtpForm) {
        return (
            <OtpForm
                pendingId={pendingId}
                maskedEmail={maskedEmail}
                onSuccess={handleOtpSuccess}
                onBack={handleOtpBack}
            />
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center bg-white dark:bg-black">
            <Link to="/">
                <img src={getStaticUrl("assets/logo.png")} alt="logo" className="w-36 mb-10 mx-auto" />
            </Link>

            <div className="space-y-2">
                <LoginInput
                    email={email}
                    password={password}
                    setEmail={setEmail}
                    setPassword={setPassword}
                    isError={loginFailed}
                />
                <LoginButton onClick={handleLogin} isActive={isActive} />
                <KeepLoginCheck checked={keepLogin} onChange={setKeepLogin} />
            </div>

            <div className="space-y-6">
                <LoginActions isError={loginFailed} />
                <SNSLogin />
                <RecentLogin />
            </div>
        </div>
    );
};

export default LoginForm;
