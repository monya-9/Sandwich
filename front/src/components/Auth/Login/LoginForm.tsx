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
import { clearAllUserData } from "../../../utils/tokenStorage";

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
                email: serverEmail,
            } = res.data || {};

            // ✅ 3. 토큰은 httpOnly 쿠키로 자동 설정됨 (localStorage 저장 안 함)
            // setToken(accessToken, keepLogin);  // 제거
            // setRefreshToken(refreshToken ?? null, keepLogin);  // 제거

            // ✅ 4. 새 사용자 정보 저장
            const effectiveEmail = serverEmail || email;
            localStorage.setItem("userEmail", effectiveEmail);
            
            // ✅ 최근 로그인 방법 저장 (이메일 로그인)
            localStorage.setItem("lastLoginMethod", "local");

            // ✅ 5. 로그인 직후 프로필/닉네임 보강 (쿠키에서 자동으로 토큰 전송됨)
            await api.get("/users/me").then(me => {
                const display = me.data.nickname || me.data.profileName || me.data.username || "";
                if (display) {
                    localStorage.setItem("userNickname", display);
                }
            }).catch(() => {});

            // ✅ 6. 컨텍스트 업데이트
            login(effectiveEmail);

            setLoginFailed(false);
            navigate("/");
        } catch (err) {
            console.error("로그인 오류", err);
            setLoginFailed(true);
        }
    };

    // 🆕 OTP 인증 성공 처리 (쿠키 전용)
    const handleOtpSuccess = async () => {
        try {
            // ✅ 토큰은 httpOnly 쿠키로 자동 설정됨 (localStorage 저장 안 함)
            
            // 사용자 정보 저장
            const effectiveEmail = email;
            localStorage.setItem("userEmail", effectiveEmail);
            
            // 최근 로그인 방법 저장 (이메일 로그인)
            localStorage.setItem("lastLoginMethod", "local");

            // 로그인 직후 프로필/닉네임 보강 (쿠키에서 자동으로 토큰 전송됨)
            await api.get("/users/me").then(me => {
                const display = me.data.nickname || me.data.profileName || me.data.username || "";
                if (display) {
                    localStorage.setItem("userNickname", display);
                }
            }).catch(() => {});

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
