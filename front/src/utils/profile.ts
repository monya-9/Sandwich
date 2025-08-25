// src/utils/profile.ts
import api from "../api/axiosInstance";

/** 프로필에서 닉네임(or 유저명) 읽어 저장하고, 최종 닉네임을 반환 */
export async function ensureNicknameInStorage(
    accessToken: string,
    fallbackEmail: string,
    storage: Storage
): Promise<string> {
    let finalNick = "";

    try {
        const { data } = await api.get("/users/me", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        // 서버가 nickname 대신 username만 줄 수도 있음
        const nickRaw = (data?.nickname ?? data?.username ?? "").toString().trim();
        finalNick = nickRaw || (fallbackEmail ? fallbackEmail.split("@")[0] : "");
    } catch {
        finalNick = fallbackEmail ? fallbackEmail.split("@")[0] : "";
    }

    if (finalNick) storage.setItem("userNickname", finalNick);
    return finalNick;
}
