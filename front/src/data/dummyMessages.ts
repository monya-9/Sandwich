import { Message } from '../types/Message';

const isoOffset = (ms: number) => new Date(Date.now() - ms).toISOString();

export const dummyMessages: Message[] = [
    {
        id: 1,
        title: '환영합니다!',
        content:
            'Sandwich에 오신 것을 환영합니다. 궁금한 점이 있으면 언제든 메시지 주세요!',
        createdAt: isoOffset(5 * 60 * 1000), // 5분 전
        sender: '관리자',
        isRead: false,
    },
    {
        id: 2,
        title: '프로젝트 협업 제안',
        content:
            '안녕하세요. 포트폴리오가 너무 맘에 들어서 연락 드려요.\n\n' +
            '제가 지금 7월부터 10월까지 3개월 간 프로젝트를 하나 하려고 하는데,\n\n' +
            '혹시 프런트엔드로 같이 참여해주실 수 있으실까요?',
        createdAt: isoOffset(60 * 60 * 1000), // 1시간 전
        sender: 'devminsu',
        isRead: false,
    },
    {
        id: 3,
        title: '채용 제안',
        content: '정식 채용 제안 드립니다. 관심 있으실까요?',
        createdAt: isoOffset(26 * 60 * 60 * 1000), // 26시간 전 ≈ 1일 전
        sender: 'careerHR',
        isRead: true,
    },
    {
        id: 4,
        title: '디자인 의뢰',
        content: '디자인 작업이 필요해서 연락드렸습니다.',
        createdAt: isoOffset(2 * 24 * 60 * 60 * 1000), // 2일 전
        sender: 'dsgn_peach',
        isRead: false,
    },
    {
        id: 5,
        title: '디자인 의뢰',
        content: '포트폴리오가 맘에 들어서요. 간단히 통화 가능하실까요?',
        createdAt: isoOffset(2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 2일+4시간 전
        sender: 'Uevminsu',
        isRead: false,
    },
];
