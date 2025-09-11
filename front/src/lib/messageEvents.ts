// src/lib/messageEvents.ts
const EVT_REFRESH = "messages:refresh";

export type MessageRefreshDetail = {
    roomId?: number;
    reason?: "sent" | "recv" | "read" | "delete";
};

/** 범용 리프레시 이벤트 */
export function emitMessagesRefresh(detail?: MessageRefreshDetail) {
    window.dispatchEvent(new CustomEvent<MessageRefreshDetail>(EVT_REFRESH, { detail }));
}

/** 범용 구독기 (해제 함수 반환) */
export function onMessagesRefresh(handler: (d: MessageRefreshDetail) => void) {
    const fn = (e: Event) => handler((e as CustomEvent<MessageRefreshDetail>).detail ?? {});
    window.addEventListener(EVT_REFRESH, fn);
    return () => window.removeEventListener(EVT_REFRESH, fn);
}

/* ========= 편의 헬퍼 (추가) ========= */

/** 특정 방 읽음 처리 신호 발행 */
export function emitMessageRead(roomId: number) {
    emitMessagesRefresh({ roomId, reason: "read" });
}

/** 읽음 신호만 구독 (필요한 곳에서 가볍게 사용) */
export function onMessageRead(handler: (roomId: number) => void) {
    return onMessagesRefresh((d) => {
        if (d.reason === "read" && typeof d.roomId === "number") {
            handler(d.roomId);
        }
    });
}
