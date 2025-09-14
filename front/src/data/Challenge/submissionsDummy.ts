// src/data/Challenge/submissionsDummy.ts
export type UserInitial = string;

export type CommentItem = {
    id: number;
    authorInitial: UserInitial;
    authorName: string;
    authorRole?: string;
    content: string;
    createdAt: string;
};

export type CodeSubmissionCard = {
    id: number;
    authorInitial: UserInitial;
    authorName: string;
    authorRole: string;
    title: string;
    desc: string;
    snippet?: string;
    likes: number;
    views: number;
    comments: number;
};

export type PortfolioProjectCard = {
    id: number;
    authorInitial: UserInitial;
    authorName: string;
    teamName?: string;
    authorRole: string;
    title: string;
    summary: string;
    demoUrl?: string;
    repoUrl?: string;
    likes: number;
    views: number;
    comments: number;
};

const codeSubmissionsByChallenge: Record<number, CodeSubmissionCard[]> = {
    1: [
        {
            id: 101,
            authorInitial: "L",
            authorName: "이민지",
            authorRole: "프론트엔드 개발자",
            title: "첫 자리는 0 제외 + 자릿수 극대화",
            desc: "첫 자리 0 금지 + 최소 비용 자릿수 계산 아이디어 정리.",
            snippet:
                "min_cost = min(p[1:]) if n > 1 else float('inf')\nlength = m // min_cost\nif length == 0:\n    print(0)",
            likes: 4,
            views: 120,
            comments: 1,
        },
        {
            id: 102,
            authorInitial: "J",
            authorName: "정세현",
            authorRole: "백엔드 개발자",
            title: "그리디 + 가장 비싼 자리 교체 최적화",
            desc: "그리디로 비싼 자리부터 교체해 최대 수 구성. 엣지 케이스 포함.",
            snippet:
                "def solve():\n  max_digit = -1\n  for i in range(n):\n    if m >= p[i] and (i != 0 or length > 0):\n      max_digit = max(max_digit, i)\n  # ...",
            likes: 5,
            views: 100,
            comments: 0,
        },
        {
            id: 103,
            authorInitial: "L",
            authorName: "이정주",
            authorRole: "백엔드 개발자",
            title: "적은 돈으로 자릿수 최대 확보",
            desc: "가장 싼 숫자로 길이를 먼저 확보 후 큰 수로 치환.",
            snippet:
                "def solve():\n  cheapest = min(range(n), key=lambda x: p[x])\n  length = m // p[cheapest]\n  if length == 0: ...",
            likes: 8,
            views: 250,
            comments: 0,
        },
    ],
};

const portfolioProjectsByChallenge: Record<number, PortfolioProjectCard[]> = {
    2: [
        {
            id: 201,
            authorInitial: "A",
            authorName: "홍시연",
            teamName: "레트로감성조",
            authorRole: "디자인/UI",
            title: "레트로 타이포 블로그",
            summary: "VHS 그레인 + CRT 스캔라인. 도트 폰트/네온 팔레트.",
            demoUrl: "#",
            repoUrl: "#",
            likes: 12,
            views: 300,
            comments: 10,
        },
        {
            id: 202,
            authorInitial: "B",
            authorName: "백미현",
            authorRole: "프론트엔드",
            title: "Pixel Diary",
            summary: "픽셀 아이콘과 8bit 전환 애니메이션.",
            demoUrl: "#",
            repoUrl: "#",
            likes: 9,
            views: 210,
            comments: 8,
        },
    ],
};

const codeCommentsBySubmission: Record<number, CommentItem[]> = {
    101: [
        {
            id: 1,
            authorInitial: "J",
            authorName: "이병건",
            authorRole: "백엔드 개발자",
            content: "접근 깔끔! 빈 입력 엣지케이스 추가해보면 더 좋을 듯.",
            createdAt: "2025-05-15 12:08",
        },
    ],
    102: [],
    103: [],
};

const portfolioCommentsByProject: Record<number, CommentItem[]> = {
    201: [],
    202: [],
};

/* ---------- 기본 조회 헬퍼 ---------- */
export const getCodeSubmissions = (challengeId: number) =>
    codeSubmissionsByChallenge[challengeId] ?? [];
export const getPortfolioProjects = (challengeId: number) =>
    portfolioProjectsByChallenge[challengeId] ?? [];
export const getCodeComments = (submissionId: number) =>
    codeCommentsBySubmission[submissionId] ?? [];
export const getPortfolioComments = (projectId: number) =>
    portfolioCommentsByProject[projectId] ?? [];

/* ---------- 추가/갱신 (목록 즉시 반영) ---------- */
export function addCodeSubmission(
    challengeId: number,
    payload: {
        title: string;
        desc?: string;
        snippet?: string;
        authorInitial?: UserInitial;
        authorName?: string;
        authorRole?: string;
    }
) {
    const list = (codeSubmissionsByChallenge[challengeId] ||= []);
    const nextId = Math.max(0, ...list.map((x) => x.id)) + 1;
    const item: CodeSubmissionCard = {
        id: nextId,
        authorInitial: payload.authorInitial || "L",
        authorName: payload.authorName || "허은진",
        authorRole: payload.authorRole || "프론트엔드 개발자",
        title: payload.title,
        desc: payload.desc || "등록폼에서 제출된 설명입니다.",
        snippet: payload.snippet,
        likes: 0,
        views: 0,
        comments: 0,
    };
    list.unshift(item);
    return item;
}

export function addPortfolioProject(
    challengeId: number,
    payload: {
        title: string;
        summary?: string;
        demoUrl?: string;
        repoUrl?: string;
        authorInitial?: UserInitial;
        authorName?: string;
        teamName?: string;
        authorRole?: string;
    }
) {
    const list = (portfolioProjectsByChallenge[challengeId] ||= []);
    const nextId = Math.max(0, ...list.map((x) => x.id)) + 1;
    const item: PortfolioProjectCard = {
        id: nextId,
        authorInitial: payload.authorInitial || "P",
        authorName: payload.authorName || "허은진",
        teamName: payload.teamName,
        authorRole: payload.authorRole || "포트폴리오",
        title: payload.title,
        summary: payload.summary || "등록폼에서 제출된 프로젝트입니다.",
        demoUrl: payload.demoUrl,
        repoUrl: payload.repoUrl,
        likes: 0,
        views: 0,
        comments: 0,
    };
    list.unshift(item);
    portfolioCommentsByProject[item.id] ||= [];
    return item;
}

/* ---------- 좋아요/조회수/댓글 더미 동작 ---------- */
export function toggleLikeCode(challengeId: number, sId: number, inc: boolean) {
    const list = codeSubmissionsByChallenge[challengeId];
    const t = list?.find((x) => x.id === sId);
    if (t) {
        t.likes += inc ? 1 : -1;
        if (t.likes < 0) t.likes = 0;
    }
}

export function toggleLikePortfolio(
    challengeId: number,
    pId: number,
    inc: boolean
) {
    const list = portfolioProjectsByChallenge[challengeId];
    const t = list?.find((x) => x.id === pId);
    if (t) {
        t.likes += inc ? 1 : -1;
        if (t.likes < 0) t.likes = 0;
    }
}

export function incViewCode(challengeId: number, sId: number) {
    const t = codeSubmissionsByChallenge[challengeId]?.find((x) => x.id === sId);
    if (t) t.views += 1;
}
export function incViewPortfolio(challengeId: number, pId: number) {
    const t = portfolioProjectsByChallenge[challengeId]?.find((x) => x.id === pId);
    if (t) t.views += 1;
}

export function addCodeComment(sId: number, content: string) {
    const list = (codeCommentsBySubmission[sId] ||= []);
    const next = {
        id: Math.max(0, ...list.map((x) => x.id)) + 1,
        authorInitial: "L",
        authorName: "이정주",
        authorRole: "프론트엔드",
        content,
        createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
    };
    list.push(next);
    // 댓글 수 합산
    for (const cid of Object.keys(codeSubmissionsByChallenge)) {
        const hit = codeSubmissionsByChallenge[+cid].find((x) => x.id === sId);
        if (hit) {
            hit.comments += 1;
            break;
        }
    }
    return next;
}

export function addPortfolioComment(pId: number, content: string) {
    const list = (portfolioCommentsByProject[pId] ||= []);
    const next = {
        id: Math.max(0, ...list.map((x) => x.id)) + 1,
        authorInitial: "H",
        authorName: "허은진",
        authorRole: "프런트엔드",
        content,
        createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
    };
    list.push(next);
    // 댓글 수 합산
    for (const cid of Object.keys(portfolioProjectsByChallenge)) {
        const hit = portfolioProjectsByChallenge[+cid].find((x) => x.id === pId);
        if (hit) {
            hit.comments += 1;
            break;
        }
    }
    return next;
}

/* ---------- (데모용) 포트폴리오 투표: 중복 허용 ---------- */
// 서버가 없으니 그냥 성공만 반환. 저장/중복제한 없음.
export type PortfolioVotePayload = {
    projectId: number;
    ux: number;
    tech: number;
    creativity: number;
    planning: number;
};
export function submitPortfolioVoteDemo(_challengeId: number, _payload: PortfolioVotePayload) {
    // no-op (중복 허용)
    return { ok: true };
}
