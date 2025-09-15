import { useEffect, useRef } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { onAccessTokenChange } from "../../utils/tokenStorage";

type Opts = {
    /** 연결 켜기/끄기 */
    enabled?: boolean;
    /** 구독할 유저 ID (falsy면 연결 안 함) */
    userId: number | string;

    /** 최신 accessToken 반환 */
    getToken: () => Promise<string | null> | string | null;

    /** 프론트에서 접속할 SockJS 엔드포인트 */
    wsPath?: string;

    /** STOMP topic base (기본: /topic/users) */
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
                                wsPath = "/stomp",
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
        // 사용자가 없거나 꺼져 있으면 연결하지 않음
        if (stoppedRef.current || !enabled || !userId) return;

        // 이미 활성화된 클라이언트가 있으면 재사용
        if (clientRef.current && clientRef.current.active) return;

        // 재시도 스케줄러
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
                return;
            }

            const url = `${wsPath}`; // 필요 시 서버가 허용하면 ?token= 로도 가능
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
                if (debug) console.log("[NOTI][WS] connected → subscribe:", topic);

                client.subscribe(topic, (msg: IMessage) => {
                    try {
                        const body = JSON.parse(msg.body);
                        onNotify(body);
                    } catch {
                        /* ignore */
                    }
                });
            };

            // 연결/소켓 종료 시 지연 재시도
            client.onStompError = () => schedule(retry);
            client.onWebSocketClose = () => schedule(retry);

            client.activate();
            clientRef.current = client;
        } catch {
            schedule(retry);
        }
    };

    const hardDeactivate = async () => {
        clearTimer();
        const c = clientRef.current;
        clientRef.current = null;
        if (c) {
            try {
                // deactivate는 Promise 반환; 중복 close 방지
                await c.deactivate();
            } catch {
                /* ignore */
            }
        }
    };

    const reconnectWithLatestToken = () => {
        if (stoppedRef.current) return;
        // 토큰 바뀌면 안전하게 재연결
        void hardDeactivate().finally(() => {
            reconRef.current = setTimeout(() => void connect(0), 200);
        });
    };

    useEffect(() => {
        if (!enabled || !userId) {
            // 끊고 초기화
            stoppedRef.current = true;
            tokenUnsubRef.current?.();
            tokenUnsubRef.current = null;
            void hardDeactivate();
            return;
        }

        stoppedRef.current = false;
        void connect(0);

        // accessToken 변경되면 최신 토큰으로 재연결
        tokenUnsubRef.current = onAccessTokenChange(() => reconnectWithLatestToken());

        return () => {
            stoppedRef.current = true;
            tokenUnsubRef.current?.();
            tokenUnsubRef.current = null;
            void hardDeactivate();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, userId, wsPath, topicBase, onNotify, getToken, debug]);
}
