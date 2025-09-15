// ✅ 대문자 유니온으로 통일
export type ChallengeType = "CODE" | "PORTFOLIO";

export type Author = {
    id: number;
    name: string;
    role: string;
};

export type Submission = {
    id: number;
    challengeId: number;
    type: ChallengeType;   // ← category 대신 type 사용
    title: string;
    snippet: string;
    likes: number;
    views: number;
    comments: number;
    author: Author;
    createdAt: string;
};

export type ChallengeMeta = {
    id: number;
    type: ChallengeType;   // ← 헤더 문구는 type에서 파생
    title: string;         // 예: "🧮 예산으로 만드는 최대 방 번호"
};

export type Comment = {
    id: number;
    submissionId: number;
    author: Author;
    content: string;
    createdAt: string;
};
