// src/utils/profile.ts
import api from "../api/axiosInstance";

type MeResponse = {
    id: number;                 // ★ userId
    email?: string;
    username?: string | null;
    nickname?: string | null;
    profileName?: string | null;
    profileSlug?: string | null; // 프로필 URL용 슬러그
};

/**
 * 로그인 직후 또는 앱 부팅 시 1회 호출.
 * /api/users/me 응답에서 id / nickname / username / profileName / email을 스토리지에 싱크.
 */
export async function ensureNicknameInStorage(
    accessToken: string,
    fallbackEmail: string,
    storage: Storage
) {
    try {
        const { data } = await api.get<MeResponse>("/users/me", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        const { id, email, username, nickname, profileName, profileSlug } = data || ({} as MeResponse);

        // ★ userId 저장 (알림 WS 구독에 필요)
        if (typeof id === "number" && Number.isFinite(id)) {
            storage.setItem("userId", String(id));
        }

        // 닉네임 우선(없으면 username 대체)
        const finalNick = (nickname ?? "").trim() || (username ?? "").trim();
        if (finalNick) storage.setItem("userNickname", finalNick);

        if (username) storage.setItem("userUsername", username);
        if (profileName) storage.setItem("userProfileName", profileName);
        // ✅ profileSlug 저장
        if (profileSlug) storage.setItem("profileUrlSlug", profileSlug);

        storage.setItem("userEmail", email || fallbackEmail);
    } catch {
        // 실패해도 최소 이메일은 유지
        storage.setItem("userEmail", fallbackEmail);
    }
}
