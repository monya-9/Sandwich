// src/types/Notification.ts
export type NotificationEvent =
    | "FOLLOW_CREATED"
    | "COMMENT_CREATED"
    | "LIKE_CREATED"
    | "SYSTEM"
    | "SYSTEM_NOTICE"
    | "COLLECTION_SAVED"
    | "MESSAGE_CREATED"
    | string;

export type RawNotification = {
    id: number;
    event: NotificationEvent;
    createdAt: string;      // ISO-8601
    read: boolean;

    // (선택) 배우 정보
    actorId?: string | number;
    actorName?: string | null;
    actorEmail?: string | null;
    actorProfileUrl?: string | null;
    profileImageUrl?: string | null;
    actorProfileImage?: string | null;

    // (선택) 대상
    targetType?: string | null;
    targetId?: string | number | null;
    targetTitle?: string | null;

    // (선택) UI 부가
    deepLink?: string | null;
    snippet?: string | null;
    title?: string | null;
    message?: string | null;

    // 서버가 리소스 정보를 같이 보낼 때 (예: USER, PROJECT 등)
    resource?: { type: string; id: number | string; title?: string | null } | null;

    [k: string]: unknown;
};

export type NotificationPageDTO = {
    items: RawNotification[];
    nextCursor?: string | null;
};

export type UnreadCountDTO = { unreadCount: number };
export type UnreadUpdateDTO = { updated?: number; unreadCount: number };

// ====== 프런트(UI) 표준 아이템 ======
export type NotifyItem = {
    id: number;
    createdAt: string;          // ISO
    read: boolean;

    title: string;              // 한 줄 요약
    body?: string;              // 부가(없으면 생략)
    deepLink?: string | null;   // 클릭 이동
    thumbnail?: string | null;  // 썸네일(프로필 등)

    extra?: {
        actorId?: string;
        actorName?: string;
        actorEmail?: string | null;
        profileImageUrl?: string | null;
        targetType?: string | null;
        targetId?: string | null;
        targetTitle?: string | null;
        snippet?: string | null;
    };
};

// ---------- utils ----------
const toStr = (v: unknown) => (v == null ? undefined : String(v));
const nonEmpty = (s?: string | null) => (s && s.trim() ? s.trim() : undefined);
const pick = (src: any, keys: string[]): string | undefined => {
    for (const k of keys) {
        const v = src?.[k];
        if (v != null && String(v).trim() !== "") return String(v);
    }
    return undefined;
};
const emailLocal = (email?: string | null) =>
    nonEmpty(email) ? nonEmpty(email!.split("@")[0]) : undefined;

const displayName = ({
                         nickname,
                         email,
                         id,
                         fallback,
                     }: {
    nickname?: string;
    email?: string | null;
    id?: string;
    fallback?: string;
}) =>
    nonEmpty(nickname) ?? emailLocal(email) ?? nonEmpty(id) ?? fallback ?? "사용자";

const ensureActorPrefix = (msg: string, actor: string) => {
    const t = (msg || "").trim();
    if (!t) return t;
    if (t.includes(actor)) return t;
    if (/(님[이가은는]|이|가)\s/.test(t)) return t;
    return `${actor}님이 ${t}`;
};

const fallbackLink = (_: RawNotification) => "/notifications";
const isNumericOnly = (s?: string) => !!s && /^\d+$/.test(s);

// ---------- mapper ----------
export function toNotifyItem(raw: RawNotification): NotifyItem {
    const ex: any = (raw as any).extra ?? {};
    const res: any = (raw as any).resource ?? (ex.resource ?? null);

    // actorId 없으면 resource(USER) id로 폴백
    const actorId =
        toStr(raw.actorId) ?? toStr(ex.actorId) ?? (res?.type === "USER" ? toStr(res?.id) : undefined);

    const nickname =
        nonEmpty(raw.actorName) ??
        pick(raw, ["actorNickname", "nickname", "userNickname", "username", "userName", "displayName"]) ??
        pick(ex, ["actorNickname", "nickname", "userNickname", "username", "userName", "displayName"]);

    const actorEmail =
        nonEmpty(raw.actorEmail) ??
        pick(raw, ["email", "userEmail", "senderEmail", "actorEmail"]) ??
        pick(ex, ["email", "userEmail", "senderEmail", "actorEmail"]);

    const thumb =
        nonEmpty(raw.actorProfileUrl) ??
        nonEmpty(raw.profileImageUrl) ??
        nonEmpty(raw.actorProfileImage) ??
        nonEmpty(ex.profileImageUrl) ??
        nonEmpty(ex.actorProfileImage) ??
        null;

    const whoRaw = displayName({
        nickname,
        email: actorEmail ?? null,
        id: actorId,
        fallback: "누군가",
    });

    // ‘누군가’거나 숫자만인 이름은 배우 없음으로 처리
    const hasActor = !!whoRaw && whoRaw !== "누군가" && !isNumericOnly(whoRaw);

    const deepLink = raw.deepLink ?? ex.deepLink ?? fallbackLink(raw);

    const base: Omit<NotifyItem, "title"> = {
        id: raw.id,
        createdAt: raw.createdAt,
        read: raw.read,
        body: undefined,
        deepLink,
        thumbnail: thumb ?? null,
        extra: {
            actorId: toStr(actorId),
            actorName: whoRaw,
            actorEmail: actorEmail ?? null,
            profileImageUrl: thumb ?? null,
            targetType: raw.targetType ?? ex.targetType ?? null,
            targetId: toStr(raw.targetId ?? ex.targetId) ?? null,
            targetTitle: nonEmpty(raw.targetTitle ?? ex.targetTitle) ?? null,
            snippet: nonEmpty(raw.snippet ?? ex.snippet) ?? null,
        },
    };

    const sysTitle = nonEmpty(raw.title ?? ex.title);
    const sysBody = nonEmpty(raw.message ?? ex.message);

    let title = "";
    let body = "";

    switch (raw.event) {
        case "FOLLOW_CREATED":
            title = hasActor ? `${whoRaw}님이 팔로우했습니다` : "누군가님이 팔로우했습니다";
            body = "";
            break;

        case "COMMENT_CREATED":
            title = hasActor ? `${whoRaw}님이 댓글을 남겼습니다` : "누군가님이 댓글을 남겼습니다";
            body =
                nonEmpty(raw.snippet ?? ex.snippet) ??
                nonEmpty(raw.targetTitle ?? ex.targetTitle) ??
                "";
            break;

        case "LIKE_CREATED":
            title = hasActor ? `${whoRaw}님이 좋아요를 눌렀습니다` : "누군가님이 좋아요를 눌렀습니다";
            body = nonEmpty(raw.targetTitle ?? ex.targetTitle) ?? "";
            break;

        case "COLLECTION_SAVED": {
            const col = nonEmpty(ex.collectionName);
            title = hasActor
                ? `${whoRaw}님이 컬렉션에 저장했습니다`
                : sysTitle ?? (col ? `${col}에 저장되었습니다` : "컬렉션에 저장되었습니다");
            body = nonEmpty(ex.targetTitle) ?? "";
            break;
        }

        case "MESSAGE_CREATED": {
            const sender = nonEmpty(ex.senderName);
            const who2 = hasActor ? whoRaw : sender;
            title = who2 ? `${who2}님이 메시지를 보냈습니다` : sysTitle ?? "새 메시지가 도착했습니다";
            body = nonEmpty(ex.snippet) ?? "";
            break;
        }

        case "SYSTEM":
        case "SYSTEM_NOTICE":
            title = sysTitle ?? "시스템 알림";
            body = sysBody ?? "";
            break;

        default: {
            const candidate =
                sysTitle ??
                nonEmpty(raw.snippet ?? ex.snippet) ??
                nonEmpty(raw.message ?? ex.message) ??
                raw.event;
            title = ensureActorPrefix(candidate, hasActor ? whoRaw : "누군가");
            body =
                nonEmpty(raw.message ?? ex.message) ??
                nonEmpty(raw.snippet ?? ex.snippet) ??
                "";
        }
    }

    // title/body 중복이면 body 제거
    if (nonEmpty(body) && nonEmpty(title) && body!.trim() === title!.trim()) {
        body = "";
    }

    return { ...base, title, body };
}
