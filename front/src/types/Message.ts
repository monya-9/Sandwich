export interface Message {
    id: number;
    title: string;
    /** 목록/상세에 쓰는 실제 메시지 본문 */
    content: string;
    /** ISO 문자열 (예: 2025-08-11T03:12:00.000Z) */
    createdAt: string;
    sender: string;
    isRead: boolean;
}
