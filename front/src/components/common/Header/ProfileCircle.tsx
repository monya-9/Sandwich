import React, { useState, useEffect } from "react";
import { UserApi } from "../../../api/userApi";

interface Props {
    email: string | null;
    name?: string;        // ✅ 추가: 표시 이름
    size?: number;
}

const ProfileCircle = ({ email, name, size = 40 }: Props) => {
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const source = (name && name.trim()) || (email || "");
    const initial = source ? source[0].toUpperCase() : "?";

    const loadProfileImage = async () => {
        try {
            const profile = await UserApi.getMe();
            setProfileImage(profile.profileImage || null);
        } catch (error) {
            // 프로필 로드 실패 시 무시
        }
    };

    useEffect(() => {
        loadProfileImage();
        
        // 프로필 이미지 업데이트 이벤트 리스너
        const handleProfileImageUpdate = () => {
            loadProfileImage();
        };
        
        window.addEventListener('profile-image-updated', handleProfileImageUpdate);
        
        return () => {
            window.removeEventListener('profile-image-updated', handleProfileImageUpdate);
        };
    }, []);

    return (
        <div
            className="rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white font-semibold flex items-center justify-center overflow-hidden"
            style={{ width: size, height: size, fontSize: size / 2 }}
        >
            {profileImage ? (
                <img 
                    src={profileImage} 
                    alt="프로필 이미지" 
                    className="w-full h-full object-cover"
                />
            ) : (
                initial
            )}
        </div>
    );
};

export default ProfileCircle;
