import React from "react";
import { Link } from "react-router-dom";
import logo from "../../../../assets/logo.png";
import SNSButtonGroup from "./SNSButtonGroup";
import RecentLogin from "../../RecentLogin";


interface JoinIntroProps {
    onNext: () => void;
}

const JoinIntro = ({ onNext }: JoinIntroProps) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
            <Link to="/">
                <img src={logo} alt="Sandwich Logo" className="w-36 mb-10" />
            </Link>

            <h1 className="text-xl font-semibold mb-2">반가워요 👋</h1>
            <p className="text-gray-600 mb-8">아직 샌드위치 회원이 아니시군요</p>

            <div className="w-full max-w-xs">
                <p className="text-sm text-gray-500 mb-6">SNS로 간편하게 시작하기</p>
                <SNSButtonGroup />
                <RecentLogin />


                {/* 👉 이메일로 가입 */}
                <div className="flex items-center justify-center mb-6">
                    <hr className="flex-grow border-t border-gray-300" />
                    <span className="mx-2 text-sm text-gray-400">또는</span>
                    <hr className="flex-grow border-t border-gray-300" />
                </div>

                <button
                    onClick={onNext}
                    className="w-full bg-green-700 hover:bg-green-800 text-white font-medium py-2 rounded-md transition-colors"
                >
                    이메일로 가입하기
                </button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
                이미 샌드위치 계정이 있으신가요?{" "}
                <Link to="/login" className="text-green-700 hover:underline font-medium">
                    로그인하기
                </Link>
            </p>
        </div>
    );
};

export default JoinIntro;