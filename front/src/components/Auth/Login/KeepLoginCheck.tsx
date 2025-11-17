// src/components/KeepLoginCheck.tsx
import React, { useState } from "react";

interface Props {
    /** 컨트롤드로 쓰고 싶을 때 전달 (생략하면 내부 state 사용) */
    checked?: boolean;

    defaultChecked?: boolean;
    onChange: (checked: boolean) => void;
}

const KeepLoginCheck: React.FC<Props> = ({
                                             checked,
                                             defaultChecked = true,
                                             onChange,
                                         }) => {
    const isControlled = checked !== undefined;
    const [internal, setInternal] = useState<boolean>(defaultChecked);
    const value = isControlled ? (checked as boolean) : internal;

    return (
        <div className="w-full flex items-center justify-start mt-2 px-[1px]">
            <input
                type="checkbox"
                id="keepLogin"
                className="accent-green-600 mr-2"
                checked={value}
                onChange={(e) => {
                    if (!isControlled) setInternal(e.target.checked);
                    onChange(e.target.checked);
                }}
            />
            <label
                htmlFor="keepLogin"
                className="cursor-pointer select-none text-sm text-gray-700 dark:text-white"
            >
                로그인 유지
            </label>
        </div>
    );
};

export default KeepLoginCheck;

