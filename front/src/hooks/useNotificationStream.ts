import { useCallback, useEffect, useRef, useState } from "react";
import {
    fetchUnreadCount,
    fetchNotifications,
    markRead,
    markAllRead,
} from "../api/notifications";
import type { NotifyItem, RawNotification } from "../types/Notification";
import { toNotifyItem } from "../types/Notification";
import { useNotifyWS } from "../lib/ws/useNotifyWS";

type Options = {
    /** WebSocket 연결 활성화 (항상 true로 유지) */
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
    /** 드롭다운 열림 상태 (데이터 로드 여부 결정) */
    dropdownOpen?: boolean;
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
        dropdownOpen = false,
    } = opt;

    const [items, setItems] = useState<NotifyItem[]>([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(false);
    const [initialized, setInitialized] = useState(false); // ★ 첫 로딩 완료 여부
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [hasMore, setHasMore] = useState(true);

    // 중복 방지 (크기 제한)
    const idSet = useRef<Set<number>>(new Set());
    const MAX_ID_SET_SIZE = 1000; // 최대 ID Set 크기
    
    // ID Set 크기 제한 함수
    const cleanupIdSet = () => {
        if (idSet.current.size > MAX_ID_SET_SIZE) {
            const ids = Array.from(idSet.current);
            idSet.current.clear();
            // 최신 500개만 유지
            ids.slice(-500).forEach(id => idSet.current.add(id));
        }
    };

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

    /* ---------------- 배지(미읽음 수): enabled (httpOnly 쿠키로 자동 인증) ---------------- */
    useEffect(() => {
        let alive = true;
        (async () => {
            if (!enabled) return;
            try {
                const x = await fetchUnreadCount();
                if (alive) {
                    // 로그 제거
                    setUnread(x.unreadCount);
                }
            } catch (error) {
                console.warn("[NOTIFICATION] Failed to fetch unread count:", error);
            }
        })();
        return () => {
            alive = false;
        };
    }, [enabled]); // getToken 제거 - httpOnly 쿠키로 자동 인증

    /* ---------------- 첫 페이지 로드 함수는 인라인으로 처리됨 ---------------- */

    /* ---------------- 더 불러오기 (httpOnly 쿠키로 자동 인증) ---------------- */
    const loadMore = useCallback(async () => {
        if (!enabled || !hasMore || !cursor) return;

        setLoading(true);
        try {
            const page = await fetchNotifications({ size: pageSize, cursor });
            const dedup = page.items.filter((it) => !idSet.current!.has(it.id));
            dedup.forEach((it) => idSet.current!.add(it.id));
            cleanupIdSet(); // ID Set 크기 제한
            setItems((prev) => [...prev, ...dedup]);
            setCursor(page.nextCursor ?? undefined);
            setHasMore(Boolean(page.nextCursor));
        } catch (error) {
            console.warn("[NOTIFICATION] Failed to load more notifications:", error);
        } finally {
            setLoading(false);
        }
    }, [enabled, cursor, hasMore, pageSize]); // getToken 제거

    /* ---------------- 개별 읽음/전체 읽음 (httpOnly 쿠키로 자동 인증) ---------------- */
    const markOneRead = useCallback(
        async (id: number) => {
            if (!enabled) return;

            // 낙관적 업데이트: 즉시 UI 업데이트
            const previousItems = items;
            const previousUnread = unread;
            
            setItems((prev) => prev.map((x) => (x.id === id ? { ...x, read: true } : x)));
            setUnread((prev) => Math.max(0, prev - 1)); // 읽음 처리로 미읽음 수 감소
            
            try {
                const res = await markRead([id]);
                setUnread(res.unreadCount); // 서버 응답으로 정확한 미읽음 수 설정
            } catch (error) {
                console.warn("[NOTIFICATION] Failed to mark notification as read:", error);
                // 실패 시 롤백
                setItems(previousItems);
                setUnread(previousUnread);
            }
        },
        [enabled, items, unread] // getToken 제거
    );

    const markAll = useCallback(async () => {
        if (!enabled) return;

        // 낙관적 업데이트: 즉시 UI 업데이트
        const previousItems = items;
        const previousUnread = unread;
        
        setItems((prev) => prev.map((x) => ({ ...x, read: true })));
        setUnread(0); // 전체 읽음 처리로 미읽음 수 0으로 설정
        
        try {
            const res = await markAllRead();
            setUnread(res.unreadCount); // 서버 응답으로 정확한 미읽음 수 설정
        } catch (error) {
            console.warn("[NOTIFICATION] Failed to mark all notifications as read:", error);
            // 실패 시 롤백
            setItems(previousItems);
            setUnread(previousUnread);
        }
    }, [enabled, items, unread]); // getToken 제거

    /* ---------------- 드롭다운 열릴 때 첫 페이지 로드 (httpOnly 쿠키로 자동 인증) ---------------- */
    useEffect(() => {
        if (dropdownOpen && !initialized) {
            // loadFirst 함수를 직접 호출하지 않고 인라인으로 처리
            (async () => {
                if (!enabled || !dropdownOpen) return;

                setLoading(true);
                try {
                    const page = await fetchNotifications({ size: pageSize });
                    
                    // 서버 데이터의 ID들을 idSet에 추가 (WebSocket 중복 방지용)
                    page.items.forEach((it) => idSet.current!.add(it.id));
                    cleanupIdSet(); // ID Set 크기 제한
                    
                    setItems(page.items);
                    setCursor(page.nextCursor ?? undefined);
                    setHasMore(Boolean(page.nextCursor));
                } catch (error) {
                    console.error("[NOTIFICATION] Failed to load notifications:", error);
                    
                    // 에러 타입 체크
                    const errorDetails = error instanceof Error ? {
                        message: error.message,
                        status: (error as any).response?.status,
                        data: (error as any).response?.data
                    } : {
                        message: String(error),
                        status: undefined,
                        data: undefined
                    };
                    
                    console.error("[NOTIFICATION] Error details:", errorDetails);
                    
                    // 서버 에러 시 임시 더미 데이터 표시 (개발용)
                    if (errorDetails.status === 500) {
                        console.warn("[NOTIFICATION] Server error detected, showing dummy data");
                        const dummyItems = [{
                            id: 999,
                            event: "LIKE_CREATED",
                            title: "새 좋아요가 도착했어요",
                            body: "회원님의 project에 좋아요가 눌렸습니다",
                            deepLink: "/projects/1",
                            read: false,
                            resource: { type: "PROJECT", id: 1 },
                            actorNickname: "진진니",
                            createdAt: new Date().toISOString(),
                            extra: {
                                actorName: "진진니",
                                actorEmail: "test@example.com",
                                profileImageUrl: null
                            }
                        }];
                        setItems(dummyItems);
                        setCursor(undefined);
                        setHasMore(false);
                    } else {
                        // 다른 에러 시 빈 배열로 설정
                        setItems([]);
                        setCursor(undefined);
                        setHasMore(false);
                    }
                } finally {
                    setInitialized(true); // ★ 초기 로딩 종료 표시
                    setLoading(false);
                }
            })();
        }
    }, [dropdownOpen, initialized, enabled, pageSize]); // getToken 제거

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
            if (!id || idSet.current!.has(id)) {
                return; // 중복 또는 ID 없음 - 조용히 무시
            }
            idSet.current!.add(id);
            cleanupIdSet(); // ID Set 크기 제한
            
            // WebSocket 알림을 NotifyItem으로 변환
            try {
                const notifyItem = toNotifyItem(payload as RawNotification);
                setItems((prev) => [notifyItem, ...prev]);
                setUnread((u) => u + 1);
            } catch (error) {
                console.warn("[NOTIFICATION] Failed to convert WebSocket payload:", error);
                // 변환 실패 시 원본 데이터로 처리
                setItems((prev) => [payload as NotifyItem, ...prev]);
                setUnread((u) => u + 1);
            }
        },
    });

    return {
        items,
        unread,
        loading,
        initialized, // ★ 추가
        hasMore,
        loadMore,
        markOneRead,
        markAll,
        setUnread,
        setItems,
    };
}
