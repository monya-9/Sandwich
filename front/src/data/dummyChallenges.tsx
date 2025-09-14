// src/pages/challenge/dummyChallenges.ts
import type { ChallengeCardData } from "../components/challenge/ChallengeCard";

export const dummyChallenges: ChallengeCardData[] = [
    {
        id: 1,
        type: "CODE",
        title: "이번 주 코드 챌린지",
        subtitle: "🏠 최대 방 번호 만들기",
        description: (
            <div className="space-y-2 text-[13.5px] leading-6 text-neutral-800">
                <p>📣 이번 주 코드 챌린지 주제는 최대 방 번호 만들기!</p>
<p className="text-[13px]">단, 0으로 시작하면 탈락!</p>
</div>
),
ctaLabel: "참여하러 가기",
},
{
    id: 2,
        type: "PORTFOLIO",
    title: "이번 주 포트폴리오 챌린지",
    subtitle: "🍞 가장 깔끔한 로그인 화면 디자인은?!",
    description: (
    <div className="space-y-2 text-[13.5px] leading-6 text-neutral-800">
        <p>✨ 이번 챌린지는 가장 깔끔하고 미니멀한 로그인 화면입니다!</p>
<p className="text-[13px]">디자인 툴로 만든 화면 캡처 or 포트폴리오 링크를 올려주세요!</p>
</div>
),
    ctaLabel: "참여하러 가기",
},
];
