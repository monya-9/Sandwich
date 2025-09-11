export type NotificationType =
    | 'comment:community'
    | 'like:community'
    | 'comment:challenge'
    | 'like:challenge'
    | 'follow'
    | 'system';

export interface Notification {
    id: number;
    message: string;
    createdAt: string;    // ISO
    sender: string;
    isRead: boolean;
    thumbnail?: string;
    type?: NotificationType; // ← 추가 (옵션)
}