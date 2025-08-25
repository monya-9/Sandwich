import api from "../api/axiosInstance";

/**
 * 로그인 직후 또는 앱 부팅 시 1회 호출.
 * /api/users/me 응답에서 nickname / username / profileName / email을 스토리지에 싱크.
 */
export async function ensureNicknameInStorage(
    accessToken: string,
    fallbackEmail: string,
    storage: Storage
) {
    try {
        const { data } = await api.get("/users/me", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        // 백엔드 응답 예시(가정): { email, username, nickname, profileName, ... }
        const {
            email,
            username,
            nickname,
            profileName,
        }: {
            email?: string;
            username?: string | null;
            nickname?: string | null;
            profileName?: string | null;
        } = data || {};

        // 닉네임 우선 저장(없으면 username fallback)
        const finalNick = (nickname && nickname.trim()) || (username && username.trim()) || "";
        if (finalNick) storage.setItem("userNickname", finalNick);

        if (username) storage.setItem("userUsername", username);
        if (profileName) storage.setItem("userProfileName", profileName);

        storage.setItem("userEmail", email || fallbackEmail);
    } catch {
        // 실패해도 최소 이메일은 유지
        storage.setItem("userEmail", fallbackEmail);
    }
}
