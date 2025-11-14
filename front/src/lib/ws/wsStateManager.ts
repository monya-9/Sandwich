// WebSocket 연결 상태와 구독 상태를 전역으로 관리하는 유틸
// FCM 푸시 알림이 표시되어야 하는지 판단할 때 사용

import { Client } from "@stomp/stompjs";

type WsClientInfo = {
    client: Client;
    userId: number | string;
    subscribedTopics: Set<string>; // 구독 중인 토픽 목록
    connected: boolean;
};

// 전역 WebSocket 클라이언트 저장소
// userId를 키로 사용 (알림용, 메시지용 각각 별도 관리 가능)
const clients = new Map<string | number, WsClientInfo>();

/**
 * WebSocket 클라이언트 등록
 * @param userId 사용자 ID (키로 사용)
 * @param client STOMP 클라이언트
 * @returns true면 등록 성공, false면 이미 다른 클라이언트가 연결 중
 */
export function registerWsClient(userId: number | string, client: Client): boolean {
    const existing = clients.get(userId);
    if (existing) {
        // 이미 다른 클라이언트가 연결되어 있고 활성 상태면 새 클라이언트 거부
        if (existing.client.connected || existing.client.active) {
            // 기존 클라이언트를 유지하고 새 클라이언트는 정리
            try {
                client.deactivate();
            } catch {
                // ignore
            }
            return false; // 등록 실패 - 기존 연결 유지
        }
        // 기존 클라이언트가 비활성 상태면 교체
        try {
            existing.client.deactivate();
        } catch {
            // ignore
        }
    }
    
    clients.set(userId, {
        client,
        userId,
        subscribedTopics: new Set(),
        connected: client.connected || false,
    });
    return true; // 등록 성공
}

/**
 * WebSocket 클라이언트 해제
 * @param userId 사용자 ID
 * @param client 특정 클라이언트만 해제하려면 전달 (없으면 모두 해제)
 */
export function unregisterWsClient(userId: number | string, client?: Client) {
    const info = clients.get(userId);
    if (!info) return;
    
    // 특정 클라이언트가 지정되었고, 등록된 클라이언트와 다르면 해제하지 않음
    if (client && info.client !== client) {
        return; // 다른 클라이언트이므로 해제하지 않음
    }
    
    try {
        info.client.deactivate();
    } catch {
        // ignore
    }
    clients.delete(userId);
}

/**
 * 특정 토픽 구독 등록
 */
export function registerSubscription(userId: number | string, topic: string) {
    const info = clients.get(userId);
    if (info) {
        info.subscribedTopics.add(topic);
        info.connected = info.client?.connected || false;
    }
}

/**
 * 특정 토픽 구독 해제
 */
export function unregisterSubscription(userId: number | string, topic: string) {
    const info = clients.get(userId);
    if (info) {
        info.subscribedTopics.delete(topic);
    }
}

/**
 * 사용자가 온라인이고 특정 토픽을 구독 중인지 확인
 * @param userId 사용자 ID
 * @param topic 확인할 토픽 (예: /topic/users/123/notifications 또는 /topic/rooms/456)
 * @returns true면 온라인이고 구독 중이므로 푸시 생략해야 함
 */
export function isOnlineAndSubscribed(userId: number | string, topic: string): boolean {
    const info = clients.get(userId);
    if (!info) return false;
    
    // 연결 상태 확인 (실시간으로 체크)
    const isOnline = info.client?.connected || false;
    if (!isOnline) return false;
    
    // 토픽 구독 여부 확인
    const isSubscribed = info.subscribedTopics.has(topic);
    return isSubscribed;
}

/**
 * 특정 userId의 WebSocket 연결 상태만 확인
 */
export function isOnline(userId: number | string): boolean {
    const info = clients.get(userId);
    if (!info) return false;
    return info.client?.connected || false;
}

/**
 * 특정 userId가 특정 토픽을 구독 중인지 확인
 */
export function isSubscribed(userId: number | string, topic: string): boolean {
    const info = clients.get(userId);
    if (!info) return false;
    return info.subscribedTopics.has(topic);
}

/**
 * 특정 roomId를 구독 중인지 확인 (메시지 방용)
 * userId와 roomId를 모두 체크
 */
export function isRoomSubscribed(userId: number | string, roomId: number | string): boolean {
    const topic = `/topic/rooms/${roomId}`;
    return isOnlineAndSubscribed(userId, topic);
}
