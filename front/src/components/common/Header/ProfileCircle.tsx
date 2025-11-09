import React, { useState, useEffect, useRef } from "react";
import { UserApi } from "../../../api/userApi";

interface Props {
    email: string | null;
    name?: string;        // ✅ 추가: 표시 이름
    size?: number;
    profileImage?: string | null; // ✅ 추가: 외부에서 전달받은 프로필 이미지
}

// 전역 캐시: 프로필 이미지를 메모리에 저장
const profileImageCache = new Map<string, string | null>();

const ProfileCircle = ({ email, name, size = 40, profileImage: propProfileImage }: Props) => {
    const cacheKey = email || "";
    // 초기 상태: prop > 캐시 > null 순서로 확인
    const getInitialImage = () => {
        if (propProfileImage !== undefined) return propProfileImage;
        if (cacheKey && profileImageCache.has(cacheKey)) {
            return profileImageCache.get(cacheKey) || null;
        }
        return null;
    };
    const [profileImage, setProfileImage] = useState<string | null>(getInitialImage());
    const source = (name && name.trim()) || (email || "");
    const initial = source ? source[0].toUpperCase() : "?";
    const hasLoadedRef = useRef(false);

    const loadProfileImage = async () => {
        // prop으로 전달받은 이미지가 있으면 사용
        if (propProfileImage !== undefined) {
            setProfileImage(propProfileImage);
            if (cacheKey) {
                profileImageCache.set(cacheKey, propProfileImage);
            }
            return;
        }

        // 캐시 확인
        if (cacheKey && profileImageCache.has(cacheKey)) {
            const cached = profileImageCache.get(cacheKey) ?? null;
            setProfileImage(cached);
            return;
        }

        // 캐시에 없으면 서버에서 로드
        try {
            const profile = await UserApi.getMe();
            const imageUrl = profile.profileImage || null;
            setProfileImage(imageUrl);
            if (cacheKey) {
                profileImageCache.set(cacheKey, imageUrl);
            }
        } catch (error) {
            // 프로필 로드 실패 시 무시
        }
    };

    useEffect(() => {
        // prop이 변경되면 즉시 업데이트
        if (propProfileImage !== undefined) {
            setProfileImage(propProfileImage);
            if (cacheKey) {
                profileImageCache.set(cacheKey, propProfileImage);
            }
            hasLoadedRef.current = true;
            return;
        }

        // prop이 없고 아직 로드하지 않았으면 로드
        if (!hasLoadedRef.current) {
            loadProfileImage();
            hasLoadedRef.current = true;
        }
        
        // 프로필 이미지 업데이트 이벤트 리스너
        const handleProfileImageUpdate = () => {
            // 캐시 무효화 후 다시 로드
            if (cacheKey) {
                profileImageCache.delete(cacheKey);
            }
            hasLoadedRef.current = false;
            loadProfileImage();
        };
        
        window.addEventListener('profile-image-updated', handleProfileImageUpdate);
        
        return () => {
            window.removeEventListener('profile-image-updated', handleProfileImageUpdate);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [propProfileImage, cacheKey]);

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
