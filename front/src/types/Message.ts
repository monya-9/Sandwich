export interface Message {
    id: number;
    title: string;
    /** 목록/상세에 쓰는 실제 메시지 본문 */
    content: string;
    createdAt: string;
    sender: string;
    isRead: boolean;

    /** 안읽은 개수 (옵션) — 표시용 배지 숫자 */
    unreadCount?: number;

    /** (옵션) 아바타 이미지 경로 */
    avatarUrl?: string;
}
