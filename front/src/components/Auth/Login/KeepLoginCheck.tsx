import React from "react";

interface Props {
    checked: boolean;
    onChange: (checked: boolean) => void;
}

const KeepLoginCheck = ({ checked, onChange }: Props) => {
    return (
        <div className="w-full flex items-center justify-start mt-2 px-[1px]">
            <input
                type="checkbox"
                id="keepLogin"
                className="accent-green-600 mr-2"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
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