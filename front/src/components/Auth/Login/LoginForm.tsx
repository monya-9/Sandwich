import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import logo from "../../../assets/logo.png";
import LoginInput from "./LoginInput";
import LoginButton from "./LoginButton";
import KeepLoginCheck from "./KeepLoginCheck";
import SNSLogin from "./SNSLogin";
import LoginActions from "./LoginActions";

const LoginForm = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login } = useContext(AuthContext);
    const [loginFailed, setLoginFailed] = useState(false);

    const isActive = email.trim() !== "" && password.trim() !== "";

    const handleLogin = async () => {
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem("accessToken", data.accessToken);
                login();
                setLoginFailed(false); // 성공 시 초기화
                alert("로그인 성공");
                navigate("/");
            } else {
                setLoginFailed(true); // 로그인 실패 시
            }
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

                <KeepLoginCheck />
            </div>
            <div className="space-y-6">
                <LoginActions isError={loginFailed} />
                <SNSLogin />
            </div>
        </div>
    );
};

export default LoginForm;
