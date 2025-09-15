import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import logo from "../../../assets/logo.png";
import LoginInput from "./LoginInput";
import LoginButton from "./LoginButton";
import KeepLoginCheck from "./KeepLoginCheck";
import SNSLogin from "./SNSLogin";
import LoginActions from "./LoginActions";
import RecentLogin from "../RecentLogin";
import api from "../../../api/axiosInstance";
import { setToken } from "../../../utils/tokenStorage";
import { ensureNicknameInStorage } from "../../../utils/profile";



const LoginForm = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login } = useContext(AuthContext);
    const [loginFailed, setLoginFailed] = useState(false);

    const [keepLogin, setKeepLogin] = useState(false);
    const isActive = email.trim() !== "" && password.trim() !== "";

    const handleLogin = async () => {
        try {
            const res = await api.post("/auth/login", { email, password });
            const { accessToken, email: serverEmail } = res.data;

            // 토큰 저장 (keepLogin=true → localStorage, false → sessionStorage)
            setToken(accessToken, keepLogin);

            // 이메일 결정 + 저장
            const storage = keepLogin ? localStorage : sessionStorage;
            const effectiveEmail = (serverEmail as string) || email;
            storage.setItem("userEmail", effectiveEmail);

            // 로그인 직후 프로필/닉네임 보강 (→ /api/users/me 호출)
            await ensureNicknameInStorage(accessToken, effectiveEmail, storage);

            // 컨텍스트에 '이메일' 주입 (토큰 아님!)
            login(effectiveEmail);

            setLoginFailed(false);
            navigate("/");
        } catch (err) {
            console.error("로그인 오류", err);
            setLoginFailed(true);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
            <Link to="/">
                <img src={logo} alt="logo" className="w-36 mb-10 mx-auto" />
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
