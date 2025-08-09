export interface Notification {
    id: number;
    message: string;
    time: string;
    sender: string;
    isRead: boolean;
    thumbnail?: string;
}
