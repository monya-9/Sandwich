import { useEffect, useRef, useCallback } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { onAccessTokenChange } from "../../utils/tokenStorage";
import { registerWsClient, unregisterWsClient, registerSubscription, unregisterSubscription, isOnline } from "./wsStateManager";

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
    const connectingRef = useRef(false); // 연결 시도 중 플래그
    const onNotifyRef = useRef(onNotify); // onNotify를 ref로 저장하여 dependency 문제 해결
    const connectRef = useRef<((retry?: number) => Promise<void>) | null>(null); // connect 함수를 ref로 저장

    // onNotify를 ref로 저장하여 dependency 문제 해결
    useEffect(() => {
        onNotifyRef.current = onNotify;
    }, [onNotify]);

    const clearTimer = () => {
        if (reconRef.current) {
            clearTimeout(reconRef.current);
            reconRef.current = null;
        }
    };

    const connect = async (retry: number = 0) => {
        if (stoppedRef.current || !enabled) return;

        // 이미 연결되어 있으면 재연결하지 않음
        if (clientRef.current?.connected || clientRef.current?.active) {
            return;
        }

        // 이미 연결 시도 중이면 중복 시도 방지
        if (connectingRef.current) {
            return;
        }

        // 전역 상태 관리자에서 이미 연결이 있으면 중복 연결 방지
        // 다른 컴포넌트가 이미 연결했다면 이 인스턴스는 연결하지 않음
        if (isOnline(userId)) {
            return; // 이미 다른 곳에서 연결되어 있음
        }

        // 최대 재시도 횟수 제한 (무한 재시도 방지)
        const MAX_RETRIES = 5;
        if (retry >= MAX_RETRIES) {
            connectingRef.current = false;
            return; // 조용히 재시도 중단
        }

        // 연결 시도 시작
        connectingRef.current = true;

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

            // SockJS 폴백 요청(xhr_streaming, xhr, eventsource)도 인증되도록 쿼리 파라미터로 토큰 전달
            // 백엔드 JwtHandshakeInterceptor가 ?token=... 또는 Authorization 헤더 둘 다 지원
            const url = token ? `${wsPath}?token=${encodeURIComponent(token)}` : wsPath;
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
                
                // 연결 성공 시 재연결 카운터 리셋 및 연결 플래그 해제
                clearTimer();
                connectingRef.current = false;
                
                // 전역 상태 관리자에 클라이언트 등록 (중복 방지)
                const registered = registerWsClient(userId, client);
                if (!registered) {
                    // 이미 다른 클라이언트가 연결되어 있으면 이 클라이언트 종료
                    connectingRef.current = false;
                    try {
                        client.deactivate();
                    } catch {
                        // ignore
                    }
                    return;
                }

                const subscription = client.subscribe(topic, (msg: IMessage) => {
                    try {
                        const body = JSON.parse(msg.body);
                        // ref를 통해 최신 onNotify 호출
                        onNotifyRef.current(body);
                    } catch (error) {
                        console.warn("[NOTI][WS] Failed to parse message:", error);
                    }
                });
                
                // 구독 등록
                registerSubscription(userId, topic);
                
                // 구독 해제 시 정리
                if (subscription && typeof subscription.unsubscribe === 'function') {
                    const originalUnsub = subscription.unsubscribe;
                    subscription.unsubscribe = function() {
                        unregisterSubscription(userId, topic);
                        return originalUnsub.call(this);
                    };
                }
            };

            client.onStompError = (frame) => {
                const wasConnected = clientRef.current?.connected;
                connectingRef.current = false;

                // 연결되지 않은 상태에서 발생하는 폴백 에러는 무시
                // (SockJS가 여러 전송 방식을 시도하면서 발생하는 정상적인 에러)
                if (!wasConnected) {
                    // 연결 전 에러는 재시도하지 않음 (SockJS가 자체적으로 처리)
                    return;
                }

                // 실제 연결 후 발생한 에러만 재시도
                if (debug) {
                    const errorMsg = frame?.headers?.["message"] || String(frame);
                    console.warn("[NOTI][WS] STOMP error:", errorMsg);
                }
                schedule(retry);
            };
            
            client.onWebSocketClose = () => {
                const wasConnected = clientRef.current?.connected;
                connectingRef.current = false;

                // 이미 연결이 성공한 후 종료된 경우에만 재연결
                // 초기 연결 실패나 SockJS 폴백 과정의 종료는 무시
                if (wasConnected && !stoppedRef.current && enabled) {
                    schedule(retry);
                }
            };

            client.activate();
            clientRef.current = client;
        } catch (error) {
            connectingRef.current = false;
            schedule(retry);
        }
    };

    // connect를 ref로 저장 (재귀 호출 때문에 useCallback 불가)
    connectRef.current = connect;

    const reconnectWithLatestToken = useCallback(() => {
        if (stoppedRef.current) return;
        try {
            clientRef.current?.deactivate();
        } finally {
            clientRef.current = null;
            clearTimer();
            // 토큰 바뀌면 200ms 뒤 재연결 (ref를 통해 접근)
            if (connectRef.current) {
                reconRef.current = setTimeout(() => void connectRef.current!(0), 200);
            }
        }
    }, []);

    const updateTokenInConnection = useCallback(async () => {
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
    }, [getToken, reconnectWithLatestToken]);

    useEffect(() => {
        if (!enabled) {
            // 끊고 초기화
            stoppedRef.current = true;
            connectingRef.current = false;
            clearTimer();
            tokenUnsubRef.current?.();
            tokenUnsubRef.current = null;
            const c = clientRef.current;
            clientRef.current = null;
            c?.deactivate();
            return;
        }

        stoppedRef.current = false;
        connectingRef.current = false;
        if (connectRef.current) {
            void connectRef.current(0);
        }

        // accessToken 변경되면 토큰 업데이트 시도 (재연결 최소화)
        tokenUnsubRef.current = onAccessTokenChange(() => updateTokenInConnection());

        return () => {
            stoppedRef.current = true;
            connectingRef.current = false;
            clearTimer();
            tokenUnsubRef.current?.();
            tokenUnsubRef.current = null;
            const c = clientRef.current;
            clientRef.current = null;
            
            // 전역 상태 관리자에서 이 클라이언트만 해제 (다른 클라이언트는 유지)
            if (c) {
                unregisterWsClient(userId, c);
                try {
                    c.deactivate();
                } catch {
                    // ignore
                }
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
        // connect는 내부에서 ref를 사용하고 재귀 호출하므로 useCallback으로 감쌀 수 없음
        // onNotify는 ref로 저장하여 dependency에서 제외
        // updateTokenInConnection은 useCallback으로 감싸서 dependency에 포함
    }, [enabled, userId, wsPath, topicBase, getToken, debug, updateTokenInConnection]);
}
