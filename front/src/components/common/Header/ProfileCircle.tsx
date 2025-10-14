import React from "react";

interface Props {
    email: string | null;
    name?: string;        // ✅ 추가: 표시 이름
    size?: number;
}

const ProfileCircle = ({ email, name, size = 40 }: Props) => {
    const source = (name && name.trim()) || (email || "");
    const initial = source ? source[0].toUpperCase() : "?";

    return (
        <div
            className="rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white font-semibold flex items-center justify-center"
            style={{ width: size, height: size, fontSize: size / 2 }}
        >
            {initial}
        </div>
    );
};

export default ProfileCircle;
