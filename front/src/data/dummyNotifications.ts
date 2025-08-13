// src/data/notifications.ts
import type { Notification } from '../types/Notification';

const now = Date.now();

export const dummyNotifications: Notification[] = [
    // 커뮤니티: 댓글
    {
        id: 1,
        type: 'comment:community',
        message: 'jeonghoon_dev님이 커뮤니티 글에 댓글을 남겼습니다.',
        createdAt: new Date(now - 3 * 60 * 1000).toISOString(), // 3분 전
        sender: 'jeonghoon_dev',
        isRead: false,
    },
    // 커뮤니티: 좋아요
    {
        id: 2,
        type: 'like:community',
        message: 'ghdtldusp님이 커뮤니티 글을 좋아합니다.',
        createdAt: new Date(now - 20 * 60 * 1000).toISOString(), // 20분 전
        sender: 'ghdtldusp',
        isRead: false,
    },
    // 포트폴리오 좋아요(시스템/일반 알림으로 처리)
    {
        id: 3,
        type: 'system',
        message: 'minji_dev님이 포트폴리오에 좋아요를 눌렀습니다.',
        createdAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(), // 3시간 전
        sender: 'minji_dev',
        isRead: true,
    },
    // 디자인 문의(시스템)
    {
        id: 4,
        type: 'system',
        message: '디자인 관련 문의가 도착했습니다.',
        createdAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(), // 어제
        sender: 'clientX',
        isRead: true,
    },
    // 챌린지: 댓글
    {
        id: 5,
        type: 'comment:challenge',
        message: 'ray_kim님이 챌린지 작업에 댓글을 남겼습니다.',
        createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2일 전
        sender: 'ray_kim',
        isRead: false,
    },
    // 챌린지: 좋아요
    {
        id: 6,
        type: 'like:challenge',
        message: 'design_peach님이 챌린지 작업을 좋아합니다.',
        createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5일 전
        sender: 'design_peach',
        isRead: true,
    },
    // 팔로우
    {
        id: 7,
        type: 'follow',
        message: 'ui_hyun님이 회원님을 팔로우하기 시작했습니다.',
        createdAt: new Date(now - 40 * 60 * 1000).toISOString(), // 40분 전
        sender: 'ui_hyun',
        isRead: false,
    },
];
