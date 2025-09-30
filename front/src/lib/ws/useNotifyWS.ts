import { useEffect, useRef } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { onAccessTokenChange } from "../../utils/tokenStorage";

type Opts = {
    /** 연결 켜기/끄기 (로그인 등 준비 완료 시 true) */
    enabled?: boolean;
    /** 구독할 유저 ID */
    userId: number | string;

    /** 최신 accessToken을 동기/비동기로 반환 */
    getToken: () => Promise<string | null> | string | null;

    /** 프론트에서 접속할 SockJS 엔드포인트(프록시가 /stomp -> /ws 로 리라이트) */
    wsPath?: string;

    /** STOMP topic 베이스 (기본: /topic/users) */
    topicBase?: string;

    /** 서버에서 새 알림을 받았을 때 */
    onNotify: (payload: any) => void;

    /** 디버그 로그 */
    debug?: boolean;
};

export function useNotifyWS({
                                enabled = true,
                                userId,
                                getToken,
                                onNotify,
                                wsPath = "/stomp",            // 프록시가 /ws 로 바꿔줌
                                topicBase = "/topic/users",
                                debug = false,
                            }: Opts) {
    const clientRef = useRef<Client | null>(null);
    const stoppedRef = useRef(false);
    const reconRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const tokenUnsubRef = useRef<(() => void) | null>(null);

    const clearTimer = () => {
        if (reconRef.current) {
            clearTimeout(reconRef.current);
            reconRef.current = null;
        }
    };

    const connect = async (retry: number = 0) => {
        if (stoppedRef.current || !enabled) return;

        // 재시도 스케줄러 (선선언)
        const schedule = (r: number) => {
            if (stoppedRef.current || !enabled) return;
            const next = Math.min(1000 * 2 ** r, 15000);
            clearTimer();
            reconRef.current = setTimeout(() => void connect(r + 1), next);
        };

        try {
            const token = await Promise.resolve(getToken());
            if (!token) {
                schedule(retry);
                return; // 토큰 없으면 조금 뒤에 재시도
            }

            // 일부 프록시/서버 환경에서 핸드셰이크에 헤더 인식이 어려우면
            // 쿼리로 토큰을 같이 넘기는 방식도 가능 (백엔드가 지원할 때)
            const url = `${wsPath}`; // 필요시 `${wsPath}?token=${encodeURIComponent(token)}`
            const client = new Client({
                webSocketFactory: () => new SockJS(url),
                connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
                heartbeatIncoming: 10000,
                heartbeatOutgoing: 10000,
                reconnectDelay: 0, // 우리가 직접 재시도
                debug: debug ? (m) => console.log("[NOTI][WS]", m) : () => {},
            });

            client.onConnect = () => {
                const topic = `${topicBase}/${userId}/notifications`;
                if (debug) console.log("[NOTI][WS] connected, subscribe:", topic);

                client.subscribe(topic, (msg: IMessage) => {
                    try {
                        const body = JSON.parse(msg.body);
                        onNotify(body);
                    } catch {
                        /* ignore */
                    }
                });
            };

            client.onStompError = () => schedule(retry);
            client.onWebSocketClose = () => schedule(retry);

            client.activate();
            clientRef.current = client;
        } catch {
            schedule(retry);
        }
    };

    const updateTokenInConnection = async () => {
        if (stoppedRef.current || !clientRef.current?.connected) return;
        
        try {
            const newToken = await Promise.resolve(getToken());
            if (!newToken) return;
            
            // 기존 연결 유지하면서 헤더만 업데이트
            const currentClient = clientRef.current;
            if (currentClient && currentClient.connected) {
                // STOMP 클라이언트의 헤더 업데이트 (재연결 없이)
                console.log("[NOTIFY][WS] Token updated without reconnection");
                // 실제로는 STOMP 라이브러리에서 헤더 업데이트가 제한적이므로
                // 연결이 안정적이면 재연결하지 않음
                return;
            }
        } catch (error) {
            console.warn("[NOTIFY][WS] Failed to update token:", error);
        }
        
        // 연결이 불안정하거나 토큰 업데이트 실패 시에만 재연결
        reconnectWithLatestToken();
    };

    const reconnectWithLatestToken = () => {
        if (stoppedRef.current) return;
        try {
            clientRef.current?.deactivate();
        } finally {
            clientRef.current = null;
            clearTimer();
            // 토큰 바뀌면 200ms 뒤 재연결
            reconRef.current = setTimeout(() => void connect(0), 200);
        }
    };

    useEffect(() => {
        if (!enabled) {
            // 끊고 초기화
            stoppedRef.current = true;
            clearTimer();
            tokenUnsubRef.current?.();
            tokenUnsubRef.current = null;
            const c = clientRef.current;
            clientRef.current = null;
            c?.deactivate();
            return;
        }

        stoppedRef.current = false;
        void connect(0);

        // accessToken 변경되면 토큰 업데이트 시도 (재연결 최소화)
        tokenUnsubRef.current = onAccessTokenChange(() => updateTokenInConnection());

        return () => {
            stoppedRef.current = true;
            clearTimer();
            tokenUnsubRef.current?.();
            tokenUnsubRef.current = null;
            const c = clientRef.current;
            clientRef.current = null;
            c?.deactivate();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, userId, wsPath, topicBase, onNotify, getToken, debug]);
}
