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
    /** 드롭다운 열렸을 때 true */
    enabled: boolean;
    /** WS 구독용 사용자 ID (없으면 WS 스킵) */
    userId: number | string | null | undefined;
    /** SockJS 경로 */
    wsUrl: string;
    /** STOMP topic base */
    topicBase?: string;
    /** 페이지 크기 */
    pageSize?: number;
    /** 최신 토큰 제공자 */
    getToken?: () => Promise<string | null> | string | null;
    /** 콘솔 디버그 */
    debug?: boolean;
    /** 닫힐 때 캐시를 비울지 여부(기본 false = 유지) */
    resetOnDisable?: boolean;
};

/** string | null | Promise<string|null> -> Promise<string|null> */
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
        resetOnDisable = false,
    } = opt;

    const [items, setItems] = useState<NotifyItem[]>([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(false);
    const [initialized, setInitialized] = useState(false); // ★ 첫 로딩 완료 여부
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [hasMore, setHasMore] = useState(true);

    // 중복 방지
    const idSet = useRef<Set<number>>(new Set());

    /* ---------------- 비활성화 시: WS만 끊고 캐시는 기본 유지 ---------------- */
    useEffect(() => {
        if (!enabled) {
            setLoading(false);
            if (resetOnDisable) {
                setItems([]);
                setUnread(0);
                setCursor(undefined);
                setHasMore(true);
                setInitialized(false);
                idSet.current.clear();
            }
        }
    }, [enabled, resetOnDisable]);

    /* ---------------- 배지(미읽음 수): enabled && token ---------------- */
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
        return () => {
            alive = false;
        };
    }, [enabled, getToken]);

    /* ---------------- 첫 페이지 로드 ---------------- */
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
            /* ignore */
        } finally {
            setInitialized(true); // ★ 초기 로딩 종료 표시
            setLoading(false);
        }
    }, [enabled, getToken, pageSize]);

    /* ---------------- 더 불러오기 ---------------- */
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

    /* ---------------- 개별 읽음/전체 읽음 ---------------- */
    const markOneRead = useCallback(
        async (id: number) => {
            if (!enabled) return;
            const token = await resolveToken(getToken);
            if (!token) return;

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

    /* ---------------- WS 구독: enabled && userId ---------------- */
    useNotifyWS({
        enabled: Boolean(enabled && userId),
        userId: userId ?? 0,
        getToken: getToken ?? (() => null),
        wsPath: wsUrl,
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
        initialized, // ★ 추가
        hasMore,
        loadFirst,
        loadMore,
        markOneRead,
        markAll,
        setUnread,
        setItems,
    };
}
