import type { NotifyItem } from "../types/Notification";

const now = Date.now();
const iso = (msAgo: number) => new Date(now - msAgo).toISOString();

export const dummyNotifications: NotifyItem[] = [
    {
        id: 1001,
        title: "새 댓글",
        body: "jeonghoon_dev: 와 멋진 작업이에요!",
        createdAt: iso(3 * 60 * 1000),
        read: false,
        deepLink: "/community/123",
        thumbnail: null,
    },
    {
        id: 1002,
        title: "새 좋아요",
        body: "ghdtldusp님이 회원님의 글을 좋아합니다.",
        createdAt: iso(20 * 60 * 1000),
        read: false,
        deepLink: "/community/456",
        thumbnail: null,
    },
    {
        id: 1003,
        title: "시스템 공지",
        body: "9/18(수) 02:00~03:00 점검 예정",
        createdAt: iso(3 * 60 * 60 * 1000),
        read: true,
        deepLink: "/notifications",
        thumbnail: null,
    },
    {
        id: 1004,
        title: "새 팔로우",
        body: "ui_hyun님이 회원님을 팔로우하기 시작했어요.",
        createdAt: iso(40 * 60 * 1000),
        read: false,
        deepLink: "/profile/ui_hyun",
        thumbnail: null,
    },
];
