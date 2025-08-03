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
            // 백엔드 응답 스키마에 맞춰 키 이름 확인(예: accessToken/refreshToken)
            const { accessToken } = res.data;

            // 토큰 저장 (keepLogin=true면 localStorage, false면 sessionStorage 사용한다고 가정)
            setToken(accessToken, keepLogin);

            // 컨텍스트에 로그인 상태 반영
            // AuthContext가 login(token) 시그니처라면 아래처럼:
            login(accessToken);

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
