export type MessageType = "GENERAL" | "EMOJI" | "PROJECT_PROPOSAL" | "JOB_OFFER" | "SYSTEM";

export type Message = {
    id: number;
    title: string;
    content: string;
    createdAt: string;
    sender: string;
    isRead: boolean;
    unreadCount?: number;

    /** 서버 연동 메타 */
    roomId?: number | null;
    senderId?: number | null;
    receiverId?: number | null;

    /** 확장 */
    type?: MessageType;
    payload?: string | null; // 서버는 json 문자열, 프런트는 JSON.parse해서 씀
};
