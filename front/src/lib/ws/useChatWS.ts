// src/lib/ws/useChatWS.ts
import { useEffect, useRef } from "react";
import { Client, IMessage } from "@stomp/stompjs";
// 문제가 계속이면 아래 라인으로 교체:
// import SockJS from "sockjs-client/dist/sockjs";
import SockJS from "sockjs-client";

type Opts = {
    roomId: number;
    getToken: () => Promise<string | null> | string | null;
    onRecv: (payload: any) => void;
    onReadAll?: (payload: any) => void;
};

export function useChatWS({ roomId, getToken, onRecv, onReadAll }: Opts) {
    const clientRef = useRef<Client | null>(null);
    const stoppedRef = useRef(false);

    useEffect(() => {
        stoppedRef.current = false;

        const connect = async (retry = 0) => {
            const token = await Promise.resolve(getToken());
            const client = new Client({
                webSocketFactory: () => new SockJS("/ws/chat"),
                connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
                heartbeatIncoming: 10000,
                heartbeatOutgoing: 10000,
                reconnectDelay: 0,
                debug: () => {},
            });

            client.onConnect = () => {
                client.subscribe(`/topic/rooms/${roomId}`, (msg: IMessage) => {
                    try {
                        const body = JSON.parse(msg.body);
                        if (body?.event === "READ_ALL") onReadAll?.(body);
                        else onRecv(body);
                    } catch {}
                });
            };

            client.onStompError = () => {
                if (!stoppedRef.current) setTimeout(() => connect(Math.min(retry + 1, 5)), 400 * (retry + 1));
            };
            client.onWebSocketClose = () => {
                if (!stoppedRef.current) {
                    const delay = Math.min(1000 * 2 ** retry, 15000);
                    setTimeout(() => connect(retry + 1), delay);
                }
            };

            client.activate();
            clientRef.current = client;
        };

        connect();

        return () => {
            stoppedRef.current = true;
            clientRef.current?.deactivate();
            clientRef.current = null;
        };
    }, [roomId, getToken, onRecv, onReadAll]);
}
