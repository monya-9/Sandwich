export type WinnerEntry = {
    rank: 1 | 2 | 3;
    userInitial: string;
    name: string;        // 개인 이름
    teamName?: string;   // 포트폴리오의 경우 팀명 옵션
    credits: number;     // 크레딧(숫자)
};

export const codeWinners: WinnerEntry[] = [
    { rank: 1, userInitial: "J", name: "조미연", credits: 10000 },
    { rank: 2, userInitial: "H", name: "홍시열", credits: 5000 },
    { rank: 3, userInitial: "L", name: "이주종", credits: 1000 },
];

export const portfolioWinners: WinnerEntry[] = [
    { rank: 1, userInitial: "J", name: "김현미", teamName: "어썸", credits: 10000 },
    { rank: 2, userInitial: "H", name: "김서연", credits: 5000 },
    { rank: 3, userInitial: "L", name: "박정수", credits: 1000 },
];
