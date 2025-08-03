import React from 'react';

interface Props {
    email: string | null; // ✅ null 허용
    size?: number;
}

const ProfileCircle = ({ email, size = 40 }: Props) => {
    const initial = email ? email[0].toUpperCase() : '?';

    return (
        <div
            className="rounded-full bg-gray-200 text-gray-700 font-semibold flex items-center justify-center"
            style={{ width: size, height: size, fontSize: size / 2 }}
        >
            {initial}
        </div>
    );
};

export default ProfileCircle;
