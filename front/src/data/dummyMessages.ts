import { Message } from "../types/Message";

const isoOffset = (ms: number) => new Date(Date.now() - ms).toISOString();

export const dummyMessages: Message[] = [
    {
        id: 1,
        title: "환영합니다!",
        content:
            "Sandwich에 오신 것을 환영합니다. 궁금한 점이 있으면 언제든 메시지 주세요!",
        createdAt: isoOffset(5 * 60 * 1000), // 5분 전
        sender: "관리자",
        isRead: false,
        unreadCount: 1,
    },
    {
        id: 2,
        title: "프로젝트 협업 제안",
        content:
            "안녕하세요. 포트폴리오가 너무 맘에 들어서 연락 드려요.\n\n" +
            "제가 지금 7월부터 10월까지 3개월 간 프로젝트를 하나 하려고 하는데,\n\n" +
            "혹시 프런트엔드로 같이 참여해주실 수 있으실까요?",
        createdAt: isoOffset(60 * 60 * 1000), // 1시간 전
        sender: "devminsu",
        isRead: false,
        unreadCount: 3,
    },
    {
        id: 3,
        title: "채용 제안",
        content: "정식 채용 제안 드립니다. 관심 있으실까요?",
        createdAt: isoOffset(26 * 60 * 60 * 1000), // 26시간 전 ≈ 1일 전
        sender: "careerHR",
        isRead: true,
        unreadCount: 0,
    },
    {
        id: 4,
        title: "디자인 의뢰",
        content: "디자인 작업이 필요해서 연락드렸습니다.",
        createdAt: isoOffset(2 * 24 * 60 * 60 * 1000), // 2일 전
        sender: "dsgn_peach",
        isRead: false,
        unreadCount: 2,
    },
    {
        id: 5,
        title: "디자인 의뢰",
        content: "포트폴리오가 맘에 들어서요. 간단히 통화 가능하실까요?",
        createdAt: isoOffset(2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 2일+4시간 전
        sender: "Uevminsu",
        isRead: false,
        unreadCount: 1,
    },
    {
        id: 6,
        title: "HR 문의",
        content:
            "안녕하세요, 채용 프로세스와 과제 전형 관련해 몇 가지 안내드립니다.",
        createdAt: isoOffset(3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 3일+2시간 전
        sender: "hr_kim",
        isRead: true,
        unreadCount: 0,
    },
    {
        id: 7,
        title: "프로덕트 피드백 요청",
        content:
            "신규 온보딩 플로우를 만들고 있는데, UX 관점에서 간단히 피드백 부탁드려도 될까요?",
        createdAt: isoOffset(4 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), // 4일+6시간 전
        sender: "product_jane",
        isRead: false,
        unreadCount: 5,
    },
    {
        id: 8,
        title: "클라우드 비용 알림",
        content:
            "이번 달 예상 비용이 임계치를 초과했습니다. 대시보드에서 확인 부탁드립니다.",
        createdAt: isoOffset(5 * 24 * 60 * 60 * 1000), // 5일 전
        sender: "cloud_ops",
        isRead: true,
        unreadCount: 0,
    },
    {
        id: 9,
        title: "리크루터 연락",
        content:
            "포지션이 오픈되어 연락드립니다. 커리어 관심 있으시면 짧게 통화 가능하실까요?",
        createdAt: isoOffset(6 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // 6일+1시간 전
        sender: "recruiter_lee",
        isRead: false,
        unreadCount: 12, // 99+도 가능
    },
    {
        id: 10,
        title: "프로젝트 킥오프",
        content:
            "이번 주 금요일 14시에 킥오프 미팅 예정입니다. 안건 정리해서 공유드릴게요.",
        createdAt: isoOffset(7 * 24 * 60 * 60 * 1000), // 7일 전
        sender: "pm_sora",
        isRead: true,
        unreadCount: 0,
    },
];
