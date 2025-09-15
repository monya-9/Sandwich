import type { ChallengeCardData } from "../../components/challenge/ChallengeCard";

export const dummyChallenges: ChallengeCardData[] = [
    {
        id: 1,
        type: "CODE",
        title: "이번 주 코드 챌린지",
        subtitle: "🧮 예산으로 만드는 최대 방 번호",
        description: (
            <div className="space-y-2 text-[13.5px] leading-6 text-neutral-800">
                <p>📣 숫자 스티커 가격과 예산 M으로 만들 수 있는 <b>가장 큰 방 번호</b>를 구해보자!</p>
                <p className="text-[13px]">조건: 0으로 시작 불가(단, 한 자리면 0 가능) · 자동 채점 지원</p>
            </div>
        ),
        ctaLabel: "참여하러 가기",
    },
    {
        id: 2,
        type: "PORTFOLIO",
        title: "이번 달 포트폴리오 챌린지",
        subtitle: "🎨 레트로 감성의 개발자 블로그",
        description: (
            <div className="space-y-2 text-[13.5px] leading-6 text-neutral-800">
                <p>✨ 80~90년대 무드를 현대적으로 재해석한 <b>레트로 테마 포트폴리오</b>를 만들어보세요.</p>
                <p className="text-[13px]">팀/개인 모두 가능 · 결과는 <b>커뮤니티 투표 100%</b></p>
            </div>
        ),
        ctaLabel: "참여하러 가기",
    },
];
