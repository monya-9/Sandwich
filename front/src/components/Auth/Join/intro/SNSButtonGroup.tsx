// components/Auth/Intro/SNSButtonGroup.tsx
import React from "react";
import githubIcon from "../../../../assets/icons/github.png";
import googleIcon from "../../../../assets/icons/Google.png";
import SNSButton from "./SNSButton";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";

const SNSButtonGroup = () => {
    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const res = await axios.post("http://localhost:8080/login/oauth2/code/google", {
                    provider: "google",
                    accessToken: tokenResponse.access_token,
                });

                const { accessToken, refreshToken } = res.data;
                localStorage.setItem("accessToken", accessToken);
                localStorage.setItem("refreshToken", refreshToken);

                window.location.href = "/";
            } catch (err) {
                alert("로그인 실패");
                console.error(err);
            }
        },
        onError: () => {
            alert("구글 로그인 실패");
        },
    });

    const handleGithubLogin = () => {
        const clientId = "Ov23licZJKijI30IC9YA";
        const redirectUri = "http://localhost:8080/login/oauth2/code/github";
        const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=read:user user:email`;

        const width = 600;
        const height = 500;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        window.open(
            githubAuthUrl,
            "_blank",
            `width=${width},height=${height},left=${left},top=${top}`
        );
    };

    return (
        <div className="flex justify-center items-center gap-4 mb-12">
            <SNSButton
                icon={githubIcon}
                text="깃허브"
                onClick={handleGithubLogin}
            />
            <div className="text-gray-300 text-xl">|</div>
            <SNSButton
                icon={googleIcon}
                text="구글"
                onClick={() => googleLogin()}
            />
        </div>
    );
};

export default SNSButtonGroup;
