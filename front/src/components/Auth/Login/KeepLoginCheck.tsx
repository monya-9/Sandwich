import React from "react";

const KeepLoginCheck = () => {
    return (
        <div className="w-full flex items-center justify-start mt-2 px-[1px]">
            <input
                type="checkbox"
                id="keepLogin"
                className="accent-green-600 mr-2"
            />
            <label
                htmlFor="keepLogin"
                className="cursor-pointer select-none text-sm text-gray-700"
            >
                로그인 유지
            </label>
        </div>
    );
};

export default KeepLoginCheck;
