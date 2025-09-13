// src/types/Notification.ts

export type NotificationEvent =
    | "FOLLOW_CREATED"
    | "COMMENT_CREATED"
    | "LIKE_CREATED"
    | "SYSTEM"
    | "SYSTEM_NOTICE"
    | string;

export type RawNotification = {
    id: number;
    event: NotificationEvent;
    createdAt: string;      // ISO
    read: boolean;

    // 행위자(알림을 발생시킨 사람)
    actorId?: string | number;
    actorName?: string | null;
    actorProfileUrl?: string | null;

    // 대상(게시글/작업/프로필 등)
    targetType?: string | null;
    targetId?: string | number | null;
    targetTitle?: string | null;

    // UI 보조
    deepLink?: string | null;    // 서버가 바로 경로를 내려주는 경우 최우선
    snippet?: string | null;     // 댓글 일부, 설명 등
    title?: string | null;       // 시스템 공지 제목 등
    message?: string | null;     // 시스템 공지 본문 등

    [k: string]: unknown;
};

export type NotificationPageDTO = {
    items: RawNotification[];
    nextCursor?: string | null;
};

export type UnreadCountDTO = {
    unreadCount: number;
};

// ====== 프런트(UI) 표준 아이템 ======
export type NotifyItem = {
    id: number;
    createdAt: string;          // ISO
    read: boolean;

    title: string;              // 한 줄 요약
    body?: string;              // 부가/설명(없으면 생략)
    deepLink?: string | null;   // 클릭 시 이동
    thumbnail?: string | null;  // 썸네일(사용자 프로필 등)

    extra?: {
        actorId?: string;         // 행위자 id (문자열 권장)
        actorName?: string;       // 행위자 닉네임
        targetType?: string | null;
        targetId?: string | null;
        targetTitle?: string | null;
        snippet?: string | null;
    };
};

// ====== 유틸 ======
const toStr = (v: unknown) => (v == null ? undefined : String(v));
const nonEmpty = (s?: string | null) =>
    s && s.trim().length > 0 ? s.trim() : undefined;

const displayName = (name?: string | null, id?: string) =>
    nonEmpty(name) ?? (id ?? "누군가");

// 서버가 deepLink를 안 내려줬을 때 최소 안전 폴백
const fallbackLink = (raw: RawNotification): string => {
    // 필요시 targetType 기반 분기 추가 가능
    return "/notifications";
};

// ====== 이벤트 → UI 매핑 ======
export function toNotifyItem(raw: RawNotification): NotifyItem {
    const actorId = toStr(raw.actorId);
    const actorName = nonEmpty(raw.actorName);
    const actorThumb = nonEmpty(raw.actorProfileUrl) ?? null;
    const deepLink = raw.deepLink ?? fallbackLink(raw);

    const base: Omit<NotifyItem, "title"> = {
        id: raw.id,
        createdAt: raw.createdAt,
        read: raw.read,
        body: undefined,
        deepLink,
        thumbnail: actorThumb,
        extra: {
            actorId,
            actorName,
            targetType: raw.targetType ?? null,
            targetId: toStr(raw.targetId) ?? null,
            targetTitle: nonEmpty(raw.targetTitle) ?? null,
            snippet: nonEmpty(raw.snippet) ?? null,
        },
    };

    const who = displayName(actorName, actorId);

    switch (raw.event) {
        case "FOLLOW_CREATED":
            return { ...base, title: `${who}님이 팔로우했습니다` };

        case "COMMENT_CREATED":
            return {
                ...base,
                title: `${who}님이 댓글을 남겼습니다`,
                body: nonEmpty(raw.snippet) ?? nonEmpty(raw.targetTitle) ?? "",
            };

        case "LIKE_CREATED":
            return {
                ...base,
                title: `${who}님이 좋아요를 눌렀습니다`,
                body: nonEmpty(raw.targetTitle) ?? "",
            };

        case "SYSTEM":
        case "SYSTEM_NOTICE":
            return {
                ...base,
                title: nonEmpty(raw.title) ?? "시스템 알림",
                body: nonEmpty(raw.message) ?? "",
                thumbnail: null,
                deepLink: raw.deepLink ?? "/notifications",
            };

        default:
            return {
                ...base,
                title: nonEmpty(raw.title) ?? raw.event,
                body: nonEmpty(raw.message) ?? nonEmpty(raw.snippet) ?? "",
            };
    }
}
