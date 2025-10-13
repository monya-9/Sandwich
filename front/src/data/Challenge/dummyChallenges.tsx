import type { ChallengeCardData } from "../../components/challenge/ChallengeCard";

// 기본 더미 데이터
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

// AI API에서 동적으로 가져오는 챌린지 데이터
export async function getDynamicChallenges(): Promise<ChallengeCardData[]> {
    try {
        const [monthlyData, weeklyData, backendChallenges] = await Promise.all([
            import('../../api/monthlyChallenge').then(m => m.fetchMonthlyChallenge()),
            import('../../api/weeklyChallenge').then(w => w.fetchWeeklyLatest()),
            import('../../api/challengeApi').then(c => c.fetchChallenges(0, 10)) // 최신 10개 챌린지 가져오기
        ]);
        
        // 백엔드에서 가져온 챌린지 중 CODE와 PORTFOLIO 타입 찾기
        const codeChallenge = backendChallenges.content?.find(c => c.type === "CODE");
        const portfolioChallenge = backendChallenges.content?.find(c => c.type === "PORTFOLIO");
        
        return [
            {
                id: codeChallenge?.id || 1, // 백엔드 ID 사용, 없으면 기본값
                type: "CODE",
                title: "이번 주 코드 챌린지",
                subtitle: weeklyData.title,
                description: (
                    <div className="space-y-2 text-[13.5px] leading-6 text-neutral-800">
                        <p>📣 {weeklyData.summary || 'AI가 생성한 주간 코드 챌린지입니다.'}</p>
                        <p className="text-[13px]">조건: 자동 채점 지원 · 중복 제출 가능</p>
                        {weeklyData.must && weeklyData.must.length > 0 && (
                            <div className="py-1">
                                <p className="text-[12px] text-neutral-600">
                                    📋 <b>필수 요구사항:</b> {weeklyData.must.slice(0, 3).join(', ')}
                                    {weeklyData.must.length > 3 && ` 외 ${weeklyData.must.length - 3}개`}
                                </p>
                            </div>
                        )}
                    </div>
                ),
                ctaLabel: "참여하러 가기",
            },
            {
                id: portfolioChallenge?.id || 2, // 백엔드 ID 사용, 없으면 기본값
                type: "PORTFOLIO",
                title: "이번 달 포트폴리오 챌린지",
                subtitle: `${monthlyData.emoji} ${monthlyData.title}`,
                description: (
                    <div className="space-y-3 text-[13.5px] leading-6 text-neutral-800">
                        <p>✨ {monthlyData.description || 'AI가 생성한 테마 기반의 월간 챌린지입니다.'}</p>
                        <p className="text-[13px] py-1">👥 팀/개인 모두 가능 · 결과는 <b>커뮤니티 투표 100%</b></p>
                        {monthlyData.mustHave && monthlyData.mustHave.length > 0 && (
                            <div className="py-1">
                                <p className="text-[12px] text-neutral-600">
                                    📋 <b>필수 요구사항:</b> {monthlyData.mustHave.slice(0, 3).join(', ')}
                                    {monthlyData.mustHave.length > 3 && ` 외 ${monthlyData.mustHave.length - 3}개`}
                                </p>
                            </div>
                        )}
                    </div>
                ),
                ctaLabel: "참여하러 가기",
            },
        ];
    } catch (error) {
        console.error('챌린지 데이터 로딩 실패:', error);
        return dummyChallenges; // 에러 시 기본 더미 데이터 반환
    }
}
