export type WinnerEntry = {
    rank: 1 | 2 | 3;
    userInitial?: string; // 이니셜 (optional, 실제 이름에서 자동 추출)
    name?: string;       // 개인 이름 (optional, userId로 조회)
    teamName?: string;   // 포트폴리오의 경우 팀명 옵션
    credits?: number;    // 크레딧(숫자)
    score?: number;      // 점수 (코드 챌린지용)
    profileImageUrl?: string; // 프로필 이미지 URL
    userId?: number;     // 사용자 ID (실제 DB 사용자 ID)
};

export const codeWinners: WinnerEntry[] = [
    { 
        rank: 1, 
        score: 95.5,
        userId: 70
    },
    { 
        rank: 2, 
        score: 89.2,
        userId: 64
    },
    { 
        rank: 3, 
        score: 76.8,
        userId: 60
    },
];

export const portfolioWinners: WinnerEntry[] = [
    { 
        rank: 1, 
        score: 98.7,
        userId: 50
    },
    { 
        rank: 2, 
        score: 92.4,
        userId: 57
    },
    { 
        rank: 3, 
        score: 85.3,
        userId: 65
    },
];
