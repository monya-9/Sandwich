// src/api/notifications.ts
import api from "./axiosInstance";
import type {
    NotificationPageDTO,
    UnreadCountDTO,
    NotifyItem,
    RawNotification,
} from "../types/Notification";
import { toNotifyItem } from "../types/Notification";

/* ────────────────────────────────────────────────────────────
 * 유저 미니 정보 조회(캐시 + 후보 경로 시도)
 * ──────────────────────────────────────────────────────────── */

type UserMini = {
    nickname?: string;
    username?: string;
    userName?: string;
    displayName?: string;
    email?: string;
    profileImage?: string;
    profileImageUrl?: string;
    avatarUrl?: string;
    photoUrl?: string;
};

const userMiniCache = new Map<string, UserMini | null>();
const MAX_CACHE_SIZE = 100; // 최대 캐시 크기

// 캐시 크기 제한 함수
function cleanupCache() {
    if (userMiniCache.size > MAX_CACHE_SIZE) {
        const entries = Array.from(userMiniCache.entries());
        userMiniCache.clear();
        // 최신 50개만 유지
        entries.slice(-50).forEach(([key, value]) => {
            userMiniCache.set(key, value);
        });
    }
}

const CANDIDATE_USER_PATHS = (id: string) => [
    `users/${id}`,     // 프로젝트에 맞게 여기만 실제 경로로 바꿔줘
    `profiles/${id}`,
    `members/${id}`,
    `user/${id}`,
    `profile/${id}`,
];

async function tryGet<T = any>(path: string): Promise<T | null> {
    try {
        const { data } = await api.get<T>(path);
        return data;
    } catch {
        return null;
    }
}

async function fetchUserMini(userId: string | number): Promise<UserMini | null> {
    const key = String(userId);
    if (userMiniCache.has(key)) return userMiniCache.get(key)!;

    for (const p of CANDIDATE_USER_PATHS(key)) {
        const got = await tryGet<UserMini>(p);
        if (got) {
            userMiniCache.set(key, got);
            cleanupCache(); // 캐시 크기 제한
            return got;
        }
    }
    userMiniCache.set(key, null);
    cleanupCache(); // 캐시 크기 제한
    return null;
}

const firstNonEmpty = (...vals: Array<unknown>): string | undefined => {
    for (const v of vals) {
        if (v == null) continue;
        const s = String(v).trim();
        if (s) return s;
    }
    return undefined;
};

const nameFromMini = (m: UserMini | null | undefined): string | undefined => {
    if (!m) return undefined;
    const emailLocal =
        typeof m.email === "string" && m.email.includes("@")
            ? m.email.split("@")[0]
            : m.email;
    return firstNonEmpty(m.nickname, m.displayName, m.username, m.userName, emailLocal);
};

const avatarFromMini = (m: UserMini | null | undefined): string | undefined => {
    if (!m) return undefined;
    return firstNonEmpty(
        m.profileImageUrl,
        m.profileImage,
        m.avatarUrl,
        m.photoUrl
    );
};

const ensureActorPrefix = (msg: string, actor: string) => {
    const t = (msg || "").trim();
    if (!t) return t;
    if (t.includes(actor)) return t;
    if (/(님[이가은는]|이|가)\s/.test(t)) return t;
    return `${actor}님이 ${t}`;
};

const toStr = (v: unknown) => (v == null ? undefined : String(v));

/* ────────────────────────────────────────────────────────────
 * API
 * ──────────────────────────────────────────────────────────── */

/** 알림 목록 페이징 조회 (+ 행위자 정보 수화) */
export async function fetchNotifications(opt: { size?: number; cursor?: string } = {}) {
    const { size = 20, cursor } = opt;
    
    // baseURL이 "/api"이므로 선행 슬래시 없이!
    const { data } = await api.get<NotificationPageDTO>("notifications", {
        params: { size, cursor },
    });
    
    // 로그 제거 - 깔끔한 콘솔을 위해

    const raws: RawNotification[] = data.items || [];
    const items: NotifyItem[] = raws.map(toNotifyItem); // ★ toNotifyItem 함수로 변환하여 extra 필드 생성

    // 수화 대상: actorName이 비었거나 "누군가"인데, resource.type === "USER" 인 경우
    const targets: Array<{ idx: number; userId: string }> = [];
    raws.forEach((raw, idx) => {
        const res: any = (raw as any).resource;
        const userId = res?.type === "USER" ? toStr(res.id) : undefined;
        const actorName = items[idx].extra?.actorName;
        if (userId && (!actorName || actorName === "누군가")) {
            targets.push({ idx, userId });
        }
    });

    if (targets.length) {
        const uniqueIds = Array.from(new Set(targets.map((t) => t.userId)));
        const miniMap = new Map<string, UserMini | null>();

        // 병렬 조회(캐시 적용)
        await Promise.all(
            uniqueIds.map(async (uid) => {
                const mini = await fetchUserMini(uid);
                miniMap.set(uid, mini);
            })
        );

        // 매핑 보강
        for (const { idx, userId } of targets) {
            const mini = miniMap.get(userId);
            if (!mini) continue;

            const name = nameFromMini(mini) || "사용자";
            const avatar = avatarFromMini(mini) || null;
            const email = mini?.email ?? null;

            const it = items[idx];

            // extra 보강
            it.extra = {
                ...it.extra,
                actorName: name,
                actorEmail: email,
                profileImageUrl: avatar,
            };

            // 썸네일 없으면 보강
            if (!it.thumbnail && avatar) it.thumbnail = avatar;

            // 제목을 FCM 스타일로 보정 (중복 방지)
            it.title = ensureActorPrefix(it.title, name);
        }
    }

    return {
        items,
        nextCursor: data.nextCursor ?? undefined,
    };
}

/** 미읽음 수 조회 */
export async function fetchUnreadCount() {
    const { data } = await api.get<UnreadCountDTO>("notifications/unread-count");
    return data;
}

/** 개별/복수 읽음 처리 (PATCH) */
export async function markRead(ids: number[]) {
    const { data } = await api.patch<UnreadCountDTO>("notifications/read", { ids });
    return data;
}

/** 모두 읽음 처리 (POST) */
export async function markAllRead() {
    const { data } = await api.post<UnreadCountDTO>("notifications/read-all");
    return data;
}
