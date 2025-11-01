import React, {useState} from "react";
import { Eye, EyeOff } from "lucide-react";


interface Props {
    email: string;
    password: string;
    setEmail: (val: string) => void;
    setPassword: (val: string) => void;
    isError: boolean;
}

const LoginInput = ({ email, password, setEmail, setPassword, isError }: Props) => {
    const commonInputStyle = `px-3 py-2 bg-white dark:bg-gray-800 text-black dark:text-white w-[330px] rounded border focus:outline-none focus:ring-2`;
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="mx-auto space-y-4 my-4">
            <div className="text-left">
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">이메일 주소</label>
                <input
                    type="email"
                    value={email}
                    placeholder="이메일 입력"
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${commonInputStyle} ${
                        isError
                            ? "border-red-500 focus:ring-red-200"
                            : "border-gray-300 dark:border-gray-600 focus:ring-green-200 focus:border-green-500"
                    }`}
                />
            </div>
            <div className="text-left relative">
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">비밀번호</label>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        placeholder="비밀번호 입력"
                        onChange={(e) => setPassword(e.target.value)}
                        className={`${commonInputStyle} pr-10 ${
                            isError
                                ? "border-red-500 focus:ring-red-200"
                                : "border-gray-300 dark:border-gray-600 focus:ring-green-200 focus:border-green-500"
                        }`}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
                    >
                        {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginInput;
