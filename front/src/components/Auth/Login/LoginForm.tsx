// src/components/Auth/Login/LoginForm.tsx
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
            const { accessToken } = res.data;

            // ✅ 토큰 저장 (localStorage or sessionStorage)
            setToken(accessToken, keepLogin);

            login();
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
