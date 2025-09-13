// src/hooks/useNotificationStream.ts
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
    /** WS 연결 on/off (보통 userId 확보되면 true) */
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
        enabled,
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
     * 상태 초기화: WS 비활성화 시 목록 초기화
     * (API 호출 조건은 토큰 유무로 따로 분기)
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
     * 배지(미읽음 수) 첫 조회: "토큰만" 있으면 호출
     * -------------------------------- */
    useEffect(() => {
        let alive = true;
        (async () => {
            const token = await resolveToken(getToken);
            if (!token) return;
            try {
                const x = await fetchUnreadCount();
                if (alive) setUnread(x.unreadCount);
            } catch {
                /* ignore */
            }
        })();
        return () => {
            alive = false;
        };
    }, [getToken]);

    /* --------------------------------
     * 첫 페이지 로드: "토큰만" 있으면 가능
     * -------------------------------- */
    const loadFirst = useCallback(async () => {
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
            // 네트워크 에러는 조용히 무시 (오버레이 방지)
        } finally {
            setLoading(false);
        }
    }, [getToken, pageSize]);

    /* --------------------------------
     * 더 불러오기: "토큰만" 있으면 가능
     * -------------------------------- */
    const loadMore = useCallback(async () => {
        if (!hasMore || !cursor) return;
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
    }, [getToken, cursor, hasMore, pageSize]);

    /* --------------------------------
     * 개별 읽음 처리: "토큰만" 있으면 가능
     * -------------------------------- */
    const markOneRead = useCallback(
        async (id: number) => {
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
        [getToken]
    );

    /* --------------------------------
     * 모두 읽음: "토큰만" 있으면 가능
     * -------------------------------- */
    const markAll = useCallback(async () => {
        const token = await resolveToken(getToken);
        if (!token) return;

        setItems((prev) => prev.map((x) => ({ ...x, read: true })));
        try {
            const res = await markAllRead();
            setUnread(res.unreadCount);
        } catch {
            /* ignore */
        }
    }, [getToken]);

    /* --------------------------------
     * WebSocket(STOMP) 구독: enabled 일 때만
     * -------------------------------- */
    useNotifyWS({
        enabled,
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
