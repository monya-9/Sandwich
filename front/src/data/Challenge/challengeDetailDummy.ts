// -- 공용 타입
export type ChallengeType = "CODE" | "PORTFOLIO";

export type ChallengeAction =
    | { type?: "SUBMIT"; label: string; emoji?: string; href?: string }
    | { type?: "VOTE"; label: string; emoji?: string; href?: string }
    | { type?: "URL"; label: string; emoji?: string; href: string };

export type CodeExample = {
    title: string;
    input: string;
    outputTitle: string;
    output: string;
};

export type ChallengeDetailCommon = {
    id: number;
    type: ChallengeType;
    title: string;
    actions: ChallengeAction[];
    description: string;
    judgeNotes: string[];
    submitGuide: string[];
};

export type CodeChallengeDetail = ChallengeDetailCommon & {
    type: "CODE";
    inputSpec: string;
    outputSpec: string;
    examples: CodeExample[];
    // 코드형 전용(신규)
    schedule?: { label: string; date: string }[];
    rewards?: { rank: string; credit: string; krw: string; note: string }[];
    submitExample?: { repoUrl?: string; demoUrl?: string; desc?: string; language?: string; entrypoint?: string };
    aiScoring?: { label: string; weight: number }[]; // 1-5. AI 자동 채점 기준
};

export type PortfolioChallengeDetail = ChallengeDetailCommon & {
    type: "PORTFOLIO";
    // 포트폴리오형 전용 섹션들
    schedule: { label: string; date: string }[];
    votingCriteria: string[]; // 투표 기준 라벨
    rewards: { rank: string; credit: string; krw: string; note: string }[];
    teamExample?: { name: string; members: string; roles?: string };
    submitExample?: { repoUrl?: string; demoUrl?: string; desc?: string };
};

export type AnyChallengeDetail = CodeChallengeDetail | PortfolioChallengeDetail;

/* =========================
 *  id:1  코드 챌린지 더미
 * ========================= */
export const challengeDetail: CodeChallengeDetail = {
    id: 1,
    type: "CODE",
    title: "코드 챌린지: 🧮 예산으로 만드는 최대 방 번호",
    actions: [
        { type: "SUBMIT", label: "코드 제출하러 가기", href: "#", emoji: "📥" },
        { type: "VOTE", label: "지금 코드 투표하러 가기", href: "#", emoji: "✅" },
    ],
    description: `이번 주간 코드 챌린지는 “예산으로 만들 수 있는 최대 방 번호” 문제입니다.
입력으로 각 숫자(0~N-1)의 가격과 당신의 예산 M이 주어집니다. 숫자는 자유롭게 반복 구매할 수 있지만 ‘0’으로 시작하는 번호는 허용되지 않습니다(단, 한 자리만 만들 수 있다면 0 가능).

✅ 운영 안내
- 주기: 매주 진행 (월요일 시작 ~ 일요일 마감)
- 제출: GitHub 링크 또는 코드 블록 제출
- 채점: 샌드박스에서 테스트 케이스 자동 실행(통과 수/시간/메모리 참고)
- 순위: 자동 점수 + 커뮤니티 투표(가독성/창의 로직)에 의해 결정`,
    inputSpec: `N
P0 P1 ... P(N-1)
M

N: 사용할 수 있는 숫자 개수 (1 ≤ N ≤ 10)
Pi: 숫자 i의 가격 (1 ≤ Pi ≤ 50)
M: 가지고 있는 돈 (1 ≤ M ≤ 500)`,
    outputSpec: `예산 내에서 만들 수 있는 가장 큰 방 번호를 출력하세요.`,
    examples: [
        {
            title: "입력 1",
            input: `3
6 7 8
21`,
            outputTitle: "출력 1",
            output: "210",
        },
        {
            title: "입력 2",
            input: `4
1 5 3 2
1`,
            outputTitle: "출력 2",
            output: "0",
        },
        {
            title: "입력 3",
            input: `10
1 1 1 1 1 1 1 1 1 1
50`,
            outputTitle: "출력 3",
            output:
                "99999999999999999999999999999999999999999999999999",
        },
    ],
    // 공정/가이드
    judgeNotes: [
        "자리 수를 먼저 최대화한 뒤 각 자리에서 가능한 가장 큰 수를 고르는 전략(그리디+보정) 제시",
        "선행 0 금지(한 자리 예외) 등 엣지케이스 처리",
        "복잡도/가독성/테스트 통과율(성능) 가산점",
        "창의적인 접근(DP/증명/튜닝) 환영",
    ],
    submitGuide: [
        "챌린지 시작: 월요일 00:00 (KST) ~ 문제 제출 마감: 일요일 23:59",
        "AI 자동 채점 → 점수/코멘트 반영(수 분 소요)",
        "커뮤니티 투표 점수와 합산되어 최종 순위 결정, 보상은 크레딧으로 자동 지급",
    ],
    // 신규 섹션들
    schedule: [
        { label: "챌린지 시작", date: "매주 월요일" },
        { label: "문제 제출 마감", date: "매주 일요일 23:59" },
        { label: "AI 자동 채점", date: "월요일 00:00 ~ 03:00" },
        { label: "결과 발표", date: "월요일 10:00" },
    ],
    rewards: [
        { rank: "🥇 1등", credit: "10,000 크레딧", krw: "₩10,000", note: "Pro 1개월 무료" },
        { rank: "🥈 2등", credit: "5,000 크레딧", krw: "₩5,000", note: "Standard 무료" },
        { rank: "🥉 3등", credit: "3,000 크레딧", krw: "₩3,000", note: "유료 기능 이용권" },
        { rank: "🎖 참가자 전원", credit: "500 크레딧", krw: "₩500", note: "참가 보상" },
    ],
    submitExample: {
        repoUrl: "https://github.com/hong-dev/max-room-number",
        demoUrl: "https://max-room-number.example.com", // 없으면 생략 가능
        language: "node",
        entrypoint: "npm start",
        desc:
            "Node.js로 풀이 제출. 그리디로 자릿수 최대 확보 후 자리별 대체 로직 적용.\n" +
            "유닛테스트 케이스 20개 포함, 엣지(예산=1, N=1) 처리.",
    },
    aiScoring: [
        { label: "기능 요구사항 충족", weight: 40 },
        { label: "코드 품질(가독성/구조)", weight: 30 },
        { label: "알고리즘 효율성", weight: 20 },
        { label: "테스트 커버리지", weight: 10 },
    ],
};

/* =============================
 *  id:2  포트폴리오 챌린지 더미
 * ============================= */
export const portfolioChallengeDetail: PortfolioChallengeDetail = {
    id: 2,
    type: "PORTFOLIO",
    title: "포트폴리오 챌린지: 🎨 레트로 감성의 개발자 블로그",
    actions: [
        { type: "SUBMIT", label: "프로젝트 제출하러 가기", emoji: "📤" },
        { type: "VOTE", label: "지금 작품 투표하러 가기", emoji: "🗳️" },
    ],
    description: `AI 모델이 자동 생성한 테마 기반의 월간 챌린지입니다.
이번 테마는 “레트로 감성의 개발자 블로그”. 80~90년대 무드를 현대적으로 재해석해 포트폴리오를 제작해 보세요.
팀/개인 모두 가능하며, 결과는 사용자 투표 100%로 결정됩니다.`,
    judgeNotes: [
        "운영 정책/공정성: 챌린지당 1표, 본인 작품 투표 불가, 투표 기간 내에만 가능",
        "UI/UX, 기술력, 창의성, 기획력의 종합 점수(별점 합산)로 순위 산정",
        "제출물은 표절/저작권을 침해하지 않도록 주의(참고 출처 표기 권장)",
    ],
    submitGuide: [
        "챌린지 기간: 매월 1일 ~ 말일",
        "투표 기간: 다음달 1일 ~ 3일",
        "결과 발표: 다음달 4일, 보상은 크레딧으로 자동 지급",
    ],
    schedule: [
        { label: "챌린지 시작", date: "10월 1일" },
        { label: "프로젝트 제출 마감", date: "10월 31일" },
        { label: "투표 기간", date: "11월 1일 ~ 3일" },
        { label: "결과 발표", date: "11월 4일" },
    ],
    votingCriteria: ["UI/UX", "기술력", "창의성", "기획력"],
    rewards: [
        { rank: "🥇 1등", credit: "10,000 크레딧", krw: "₩10,000", note: "Pro 1개월 무료" },
        { rank: "🥈 2등", credit: "5,000 크레딧", krw: "₩5,000", note: "Standard 무료" },
        { rank: "🥉 3등", credit: "3,000 크레딧", krw: "₩3,000", note: "유료 기능 이용권" },
        { rank: "🎖 참가자 전원", credit: "500 크레딧", krw: "₩500", note: "참가 보상" },
    ],
    teamExample: {
        name: "레트로감성조",
        members: "2명",
        roles: "프론트(민준), 디자인/UI(소희)",
    },
    submitExample: {
        repoUrl: "https://github.com/retro-blog-team",
        demoUrl: "https://retroblog.dev",
        desc: "Next.js + Tailwind 기반 레트로 테마 블로그. VHS 스타일 애니메이션/CRT 느낌 UI 반영.",
    },
};

/* ====================================================
 *  간단한 데이터 액세서 (API 연동 시 이 부분만 교체)
 * ==================================================== */
export function getChallengeDetail(id: number): AnyChallengeDetail {
    if (id === 2) return portfolioChallengeDetail;
    return challengeDetail; // default id:1
}
