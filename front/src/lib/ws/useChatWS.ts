// src/lib/ws/useChatWS.ts
import { useEffect, useRef } from "react";
import { Client, IMessage } from "@stomp/stompjs";
// 문제가 계속이면 아래 라인으로 교체:
// import SockJS from "sockjs-client/dist/sockjs";
import SockJS from "sockjs-client";
import { onAccessTokenChange } from "../../utils/tokenStorage";

type Opts = {
    roomId: number;
    /** 최신 accessToken을 반환 (동기/비동기 모두 허용) */
    getToken: () => Promise<string | null> | string | null;
    onRecv: (payload: any) => void;
    onReadAll?: (payload: any) => void;
};

/**
 * - 마운트 시 연결
 * - 소켓 끊김 자동 재연결
 * - accessToken이 갱신되면 즉시 재연결하여 최신 토큰 반영
 */
export function useChatWS({ roomId, getToken, onRecv, onReadAll }: Opts) {
    const clientRef = useRef<Client | null>(null);
    const stoppedRef = useRef(false);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const tokenUnsubRef = useRef<(() => void) | null>(null);

    // 안전한 타이머 정리
    const clearReconnectTimer = () => {
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
    };

    // 연결 수행
    const performConnect = async (retry = 0) => {
        if (stoppedRef.current) return;

        try {
            const token = await Promise.resolve(getToken());
            const client = new Client({
                webSocketFactory: () => new SockJS("/ws/chat"),
                connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
                heartbeatIncoming: 10000,
                heartbeatOutgoing: 10000,
                reconnectDelay: 0, // 커스텀 재시도 로직 사용
                debug: () => {},
            });

            client.onConnect = () => {
                // 구독
                client.subscribe(`/topic/rooms/${roomId}`, (msg: IMessage) => {
                    try {
                        const body = JSON.parse(msg.body);
                        if (body?.event === "READ_ALL") onReadAll?.(body);
                        else onRecv(body);
                    } catch {
                        // ignore
                    }
                });
            };

            client.onStompError = () => {
                if (!stoppedRef.current) {
                    const next = Math.min(1000 * 2 ** retry, 15000);
                    clearReconnectTimer();
                    reconnectTimerRef.current = setTimeout(() => performConnect(retry + 1), next);
                }
            };

            client.onWebSocketClose = () => {
                if (!stoppedRef.current) {
                    const next = Math.min(1000 * 2 ** retry, 15000);
                    clearReconnectTimer();
                    reconnectTimerRef.current = setTimeout(() => performConnect(retry + 1), next);
                }
            };

            client.activate();
            clientRef.current = client;
        } catch {
            if (!stoppedRef.current) {
                const next = Math.min(1000 * 2 ** retry, 15000);
                clearReconnectTimer();
                reconnectTimerRef.current = setTimeout(() => performConnect(retry + 1), next);
            }
        }
    };

    // 토큰 변경 → 안전하게 재연결
    const reconnectWithLatestToken = () => {
        if (stoppedRef.current) return;
        try {
            clientRef.current?.deactivate();
        } finally {
            clientRef.current = null;
            clearReconnectTimer();
            // 토큰 변경 즉시 재연결 (디바운스 200ms)
            reconnectTimerRef.current = setTimeout(() => performConnect(0), 200);
        }
    };

    useEffect(() => {
        stoppedRef.current = false;

        // 최초 연결
        performConnect(0);

        // 토큰 변경 구독 → 재연결
        tokenUnsubRef.current = onAccessTokenChange(() => {
            reconnectWithLatestToken();
        });

        return () => {
            stoppedRef.current = true;
            clearReconnectTimer();
            tokenUnsubRef.current?.();
            tokenUnsubRef.current = null;

            const c = clientRef.current;
            clientRef.current = null;
            c?.deactivate();
        };
        // roomId, getToken, onRecv, onReadAll 변경 시에도 연결을 갱신
    }, [roomId, getToken, onRecv, onReadAll]);
}
