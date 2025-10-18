import type { ChallengeCardData } from "../../components/challenge/ChallengeCard";
import { fetchChallenges, fetchChallengeDetail } from '../../api/challengeApi';
import { fetchMonthlyChallenge } from '../../api/monthlyChallenge';
import { fetchWeeklyLatest } from '../../api/weeklyChallenge';

// 기본 더미 데이터 (백엔드 ID와 충돌 방지를 위해 높은 숫자 사용)
export const dummyChallenges: ChallengeCardData[] = [
    {
        id: 11100,  // 🔥 높은 ID로 변경
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
        id: 22200,  // 🔥 높은 ID로 변경
        type: "PORTFOLIO",
        title: "이번 달 포트폴리오 챌린지",
        subtitle: "🎨 레트로 감성의 개발자 블로그",
        description: (
            <div className="space-y-2 text-[13.5px] leading-6 text-neutral-800">
                <p>✨ 80~90년대 무드를 현대적으로 재해석한<b>레트로 테마 포트폴리오</b>를 만들어보세요.</p>
                <p className="text-[13px]">팀/개인 모두 가능 · 결과는 <b>커뮤니티 투표 100%</b></p>
            </div>
        ),
        ctaLabel: "참여하러 가기",
    },
];

// 백엔드 데이터 기반으로 현재 챌린지 가져오기
export async function getDynamicChallenges(): Promise<ChallengeCardData[]> {
    try {
        // 1. 백엔드 챌린지 데이터 가져오기 (우선순위)
        const backendChallenges = await fetchChallenges(0, 20); // 더 많이 가져와서 필터링
        
        // 백엔드에서 가져온 챌린지 중 CODE와 PORTFOLIO 타입 찾기
        // 최신(created/start 기준) 챌린지 우선: content가 정렬되어 있지 않을 수 있어 시작일/생성일 기준으로 최신을 선택
        const challenges = backendChallenges.content || [] as any[];
        const ALLOWED = new Set(['OPEN', 'VOTING']); // ENDED 제외하여 현재 활성 챌린지만 표시
        const byLatestRegistered = (type: "CODE" | "PORTFOLIO") =>
            [...challenges]
                .filter(c => {
                    // 타입과 상태 체크
                    if (c.type !== type || !ALLOWED.has(String(c.status || '').toUpperCase())) {
                        return false;
                    }
                    
                    // 날짜 체크: 현재 날짜가 시작일과 종료일 사이에 있어야 함
                    const now = new Date();
                    const startAt = c.startAt ? new Date(c.startAt as any) : null;
                    const endAt = c.endAt ? new Date(c.endAt as any) : null;
                    
                    // 시작일이 있고 현재가 시작일보다 이전이면 제외
                    if (startAt && now < startAt) {
                        return false;
                    }
                    
                    // 종료일이 있고 현재가 종료일보다 이후면 제외
                    if (endAt && now > endAt) {
                        return false;
                    }
                    
                    return true;
                })
                // 등록 최신 우선: id 내림차순, 보조로 시작일(desc)
                .sort((a, b) => {
                    const idDiff = (Number(b.id) || 0) - (Number(a.id) || 0);
                    if (idDiff !== 0) return idDiff;
                    const bt = b.startAt ? new Date(b.startAt as any).getTime() : 0;
                    const at = a.startAt ? new Date(a.startAt as any).getTime() : 0;
                    return bt - at;
                })[0];
        const codeChallenge = byLatestRegistered("CODE");
        const portfolioChallenge = byLatestRegistered("PORTFOLIO");
        
        // 최신 단건 상세를 불러와 카드 내용을 백엔드 기준으로 구성
        const [codeDetail, portfolioDetail] = await Promise.all([
            codeChallenge?.id ? fetchChallengeDetail(codeChallenge.id) : Promise.resolve(null),
            portfolioChallenge?.id ? fetchChallengeDetail(portfolioChallenge.id) : Promise.resolve(null),
        ]);

        // helpers
        const parseRule = (raw: any): any => {
            try {
                if (!raw) return {};
                return typeof raw === 'string' ? JSON.parse(raw) : raw;
            } catch {
                return {};
            }
        };

        const codeUse = (codeDetail && ALLOWED.has(String(codeDetail.status || '').toUpperCase())) ? codeDetail : null;
        const portfolioUse = (portfolioDetail && ALLOWED.has(String(portfolioDetail.status || '').toUpperCase())) ? portfolioDetail : null;
        const codeRule = parseRule(codeUse?.ruleJson);
        const portfolioRule = parseRule(portfolioUse?.ruleJson);

        // AI API는 백엔드 데이터가 부족할 때만 보조적으로 사용
        let weeklyData = null;
        let monthlyData = null;
        
        if (!codeChallenge || !portfolioChallenge) {
            const [monthlyAI, weeklyAI] = await Promise.all([
                fetchMonthlyChallenge().catch(() => null),
                fetchWeeklyLatest().catch(() => null),
            ]);
            weeklyData = weeklyAI;
            monthlyData = monthlyAI;
        }

        return [
            {
                id: codeChallenge?.id || 1, // 백엔드 ID 사용, 없으면 기본값
                type: "CODE",
                title: "이번 주 코드 챌린지",
                subtitle: (codeUse?.title || weeklyData?.title) as string,
                description: (
                    <div className="space-y-2 text-[13.5px] leading-6 text-neutral-800">
                        <p className="text-[13px]">조건: 자동 채점 지원 · 중복 제출 가능</p>
                    </div>
                ),
                ctaLabel: "참여하러 가기",
                adminEditHref: codeChallenge?.id ? `/admin/challenges/${codeChallenge.id}` : undefined,
                listHref: "/challenge?type=CODE",
                // 🔥 새로 추가: 문제 요약 정보
                summary: codeRule.summary || codeRule.md || codeUse?.summary || weeklyData?.summary || 'AI가 생성한 주간 코드 챌린지입니다.',
                must: Array.isArray(codeRule.must) && codeRule.must.length > 0 ? codeRule.must : weeklyData?.must,
                startDate: codeChallenge?.startAt ? new Date(codeChallenge.startAt).toLocaleDateString('ko-KR') : undefined,
            },
            {
                id: portfolioChallenge?.id || 2, // 백엔드 ID 사용, 없으면 기본값
                type: "PORTFOLIO", 
                title: "이번 달 포트폴리오 챌린지",
                subtitle: `${monthlyData?.emoji || ''} ${portfolioUse?.title || monthlyData?.title}`.trim(),
                description: (
                    <div className="space-y-3 text-[13.5px] leading-6 text-neutral-800">
                        <p className="text-[13px]">조건: 팀/개인 참여 가능 · 투표로 순위 결정</p>
                    </div>
                ),
                ctaLabel: "참여하러 가기",
                adminEditHref: portfolioChallenge?.id ? `/admin/challenges/${portfolioChallenge.id}` : undefined,
                listHref: "/challenge?type=PORTFOLIO",
                // 🔥 새로 추가: 문제 요약 정보
                summary: portfolioRule.summary || portfolioRule.md || portfolioUse?.summary || monthlyData?.description || 'AI가 생성한 테마 기반의 월간 챌린지입니다.',
                must: Array.isArray(portfolioRule.must) && portfolioRule.must.length > 0 ? portfolioRule.must : monthlyData?.mustHave,
                startDate: portfolioChallenge?.startAt ? new Date(portfolioChallenge.startAt).toLocaleDateString('ko-KR') : undefined,
            },
        ];
    } catch (error) {
        console.error('챌린지 데이터 로딩 실패:', error);
        return dummyChallenges; // 에러 시 기본 더미 데이터 반환
    }
}

// 🆕 지난 챌린지 데이터 가져오기 (지난 대결 보기용)
export async function getPastChallenges(): Promise<ChallengeCardData[]> {
    try {
        const backendChallenges = await fetchChallenges(0, 50); // 많이 가져와서 과거 챌린지 찾기
        
        if (!backendChallenges.content || backendChallenges.content.length === 0) {
            return [];
        }

        // ENDED 상태 챌린지만 필터링
        const pastChallenges = backendChallenges.content
            .filter(c => c.status === "ENDED")
            .sort((a, b) => {
                // 종료일 기준으로 최신순 정렬 (endAt이 없으면 startAt 사용)
                const aEndDate = new Date(a.endAt || a.startAt).getTime();
                const bEndDate = new Date(b.endAt || b.startAt).getTime();
                return bEndDate - aEndDate;
            })
            .slice(0, 8); // 최대 8개만

        return pastChallenges.map(challenge => {
            const endDate = new Date(challenge.endAt || challenge.startAt);
            const isCode = challenge.type === "CODE";
            
            return {
                id: challenge.id,
                type: challenge.type,
                title: `${isCode ? '코드' : '포트폴리오'} 챌린지`,
                subtitle: challenge.title || (isCode ? '코딩 챌린지' : '포트폴리오 챌린지'),
                description: (
                    <div className="space-y-2 text-[13.5px] leading-6 text-neutral-600">
                        <p>📅 {endDate.toLocaleDateString('ko-KR')} 종료</p>
                        <p className="text-[12px] text-gray-500">✅ 종료된 챌린지</p>
                    </div>
                ),
                ctaLabel: "자세히 보기",
            };
        });
    } catch (error) {
        console.error('지난 챌린지 데이터 로딩 실패:', error);
        return [];
    }
}