import { useCallback, useEffect, useRef, useState } from "react";
import {
    fetchUnreadCount,
    fetchNotifications,
    markRead,
    markAllRead,
} from "../api/notifications";
import type { NotifyItem } from "../types/Notification";
import { useNotifyWS } from "../lib/ws/useNotifyWS";

type Options = {
    /** 드롭다운이 열렸을 때만 true 로 넘겨줘야 함 */
    enabled: boolean;

    /** WS 구독용 사용자 식별자 */
    userId: number | string | null | undefined;

    /** 프론트에서 접속할 SockJS 경로 (ex. "/stomp") */
    wsUrl: string;

    /** STOMP topic base (기본 "/topic/users") */
    topicBase?: string;

    /** 페이지 크기 (기본 20) */
    pageSize?: number;

    /** 최신 accessToken 반환자 (string 또는 Promise<string|null>) */
    getToken?: () => Promise<string | null> | string | null;

    /** 콘솔 디버그 */
    debug?: boolean;
};

/** string | null | Promise<string|null> 를 항상 Promise<string|null> 로 */
async function resolveToken(getToken?: Options["getToken"]): Promise<string | null> {
    try {
        if (!getToken) return null;
        return await Promise.resolve(getToken());
    } catch {
        return null;
    }
}

export function useNotificationStream(opt: Options) {
    const {
        enabled,                 // ★ 드롭다운 열림 여부
        userId,
        wsUrl,
        topicBase = "/topic/users",
        pageSize = 20,
        getToken,
        debug = false,
    } = opt;

    const [items, setItems] = useState<NotifyItem[]>([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(false);
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [hasMore, setHasMore] = useState(true);

    // 중복 방지
    const idSet = useRef<Set<number>>(new Set());

    /* --------------------------------
     * 상태 초기화: 비활성화 시 목록/상태 초기화
     * -------------------------------- */
    useEffect(() => {
        if (!enabled) {
            setItems([]);
            setUnread(0);
            setLoading(false);
            setCursor(undefined);
            setHasMore(true);
            idSet.current.clear();
        }
    }, [enabled]);

    /* --------------------------------
     * 배지(미읽음 수) 첫 조회
     *  - ✅ enabled 일 때만 호출하도록 수정
     * -------------------------------- */
    useEffect(() => {
        let alive = true;
        (async () => {
            if (!enabled) return;
            const token = await resolveToken(getToken);
            if (!token) return;
            try {
                const x = await fetchUnreadCount();
                if (alive) setUnread(x.unreadCount);
            } catch {
                /* ignore */
            }
        })();
        return () => { alive = false; };
    }, [enabled, getToken]);

    /* --------------------------------
     * 첫 페이지 로드: "enabled && token" 일 때만
     * -------------------------------- */
    const loadFirst = useCallback(async () => {
        if (!enabled) return;
        const token = await resolveToken(getToken);
        if (!token) return;

        setLoading(true);
        try {
            const page = await fetchNotifications({ size: pageSize });
            const dedup = page.items.filter((it) => !idSet.current!.has(it.id));
            dedup.forEach((it) => idSet.current!.add(it.id));
            setItems(dedup);
            setCursor(page.nextCursor ?? undefined);
            setHasMore(Boolean(page.nextCursor));
        } catch {
            // 조용히 무시
        } finally {
            setLoading(false);
        }
    }, [enabled, getToken, pageSize]);

    /* --------------------------------
     * 더 불러오기: "enabled && token" 일 때만
     * -------------------------------- */
    const loadMore = useCallback(async () => {
        if (!enabled || !hasMore || !cursor) return;
        const token = await resolveToken(getToken);
        if (!token) return;

        setLoading(true);
        try {
            const page = await fetchNotifications({ size: pageSize, cursor });
            const dedup = page.items.filter((it) => !idSet.current!.has(it.id));
            dedup.forEach((it) => idSet.current!.add(it.id));
            setItems((prev) => [...prev, ...dedup]);
            setCursor(page.nextCursor ?? undefined);
            setHasMore(Boolean(page.nextCursor));
        } catch {
            /* ignore */
        } finally {
            setLoading(false);
        }
    }, [enabled, getToken, cursor, hasMore, pageSize]);

    /* --------------------------------
     * 개별 읽음 처리: enabled && token 일 때만
     * -------------------------------- */
    const markOneRead = useCallback(
        async (id: number) => {
            if (!enabled) return;
            const token = await resolveToken(getToken);
            if (!token) return;

            // UI 즉시 반영(낙관적)
            setItems((prev) => prev.map((x) => (x.id === id ? { ...x, read: true } : x)));
            try {
                const res = await markRead([id]);
                setUnread(res.unreadCount);
            } catch {
                /* ignore */
            }
        },
        [enabled, getToken]
    );

    /* --------------------------------
     * 모두 읽음: enabled && token 일 때만
     * -------------------------------- */
    const markAll = useCallback(async () => {
        if (!enabled) return;
        const token = await resolveToken(getToken);
        if (!token) return;

        setItems((prev) => prev.map((x) => ({ ...x, read: true })));
        try {
            const res = await markAllRead();
            setUnread(res.unreadCount);
        } catch {
            /* ignore */
        }
    }, [enabled, getToken]);

    /* --------------------------------
     * WebSocket(STOMP) 구독
     *  - ✅ enabled 일 때만
     *  - ✅ userId 없으면(0/''/null) WS 스킵
     * -------------------------------- */
    useNotifyWS({
        enabled: Boolean(enabled && userId), // ★
        userId: userId ?? 0,
        getToken: getToken ?? (() => null),
        wsPath: wsUrl, // "/stomp"
        topicBase,
        debug,
        onNotify: (payload: any) => {
            if (!payload) return;
            const id = Number(payload?.id);
            if (!id || idSet.current!.has(id)) return;
            idSet.current!.add(id);
            setItems((prev) => [payload as NotifyItem, ...prev]);
            setUnread((u) => u + 1);
        },
    });

    return {
        items,
        unread,
        loading,
        hasMore,
        loadFirst,
        loadMore,
        markOneRead,
        markAll,
        setUnread,
        setItems,
    };
}
