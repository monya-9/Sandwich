// src/lib/messageEvents.ts
const EVT_REFRESH = "messages:refresh";

export type MessageRefreshDetail = {
    roomId?: number;
    reason?: "sent" | "recv" | "read" | "delete";
};

export function emitMessagesRefresh(detail?: MessageRefreshDetail) {
    window.dispatchEvent(new CustomEvent<MessageRefreshDetail>(EVT_REFRESH, { detail }));
}

export function onMessagesRefresh(handler: (d: MessageRefreshDetail) => void) {
    const fn = (e: Event) => handler((e as CustomEvent<MessageRefreshDetail>).detail ?? {});
    window.addEventListener(EVT_REFRESH, fn);
    return () => window.removeEventListener(EVT_REFRESH, fn);
}
