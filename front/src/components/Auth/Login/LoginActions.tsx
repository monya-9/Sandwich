import React from "react";
import { useNavigate } from "react-router-dom";

interface Props {
    isError: boolean;
}

const LoginActions = ({ isError }: Props) => {
    const navigate = useNavigate();

    return (
        <>
            {isError && (
                <p className="text-sm text-red-600 mt-2 text-center">
                    아이디 또는 비밀번호를 잘못 입력했습니다.
                    <br />
                    입력하신 내용을 다시 확인해주세요.
                </p>
            )}

            <div className="flex justify-center items-center text-xs text-gray-500 dark:text-white mt-2">
                <span
                    onClick={() => navigate("/join")}
                    className="cursor-pointer text-gray-500 dark:text-white hover:text-green-600 font-medium"
                >
                    회원가입하기
                </span>
            </div>
        </>
    );
};

export default LoginActions;
