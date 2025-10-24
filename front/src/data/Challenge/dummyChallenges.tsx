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
        const backendChallenges = await fetchChallenges(0, 100); // 충분히 많이 가져와서 필터링
        
        // 백엔드에서 가져온 챌린지 중 CODE와 PORTFOLIO 타입 찾기
        // 최신(created/start 기준) 챌린지 우선: content가 정렬되어 있지 않을 수 있어 시작일/생성일 기준으로 최신을 선택
        const challenges = backendChallenges.content || [] as any[];
        const isAllowed = (t: "CODE" | "PORTFOLIO", status: any) => {
            const s = String(status || '').toUpperCase();
            return t === 'CODE' ? s === 'OPEN' : (s === 'OPEN' || s === 'VOTING');
        };
        const byLatestRegistered = (type: "CODE" | "PORTFOLIO") =>
            [...challenges]
                .filter(c => {
                    // 타입과 상태 체크 - OPEN/VOTING 상태면 날짜 체크 없이 통과
                    if (c.type !== type) {
                        return false;
                    }
                    
                    // 상태가 허용되는지 확인 (OPEN/VOTING)
                    if (!isAllowed(type, c.status)) {
                        return false;
                    }
                    
                    // 상태가 OPEN/VOTING이면 날짜와 관계없이 표시 (관리자가 수동으로 관리하는 경우 고려)
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
        
        // 디버깅: 선택된 챌린지 확인
        console.log('🔍 [DEBUG] 현재 챌린지 선택 결과:');
        console.log('  - CODE 챌린지:', codeChallenge ? `ID: ${codeChallenge.id}, 제목: ${codeChallenge.title}, 상태: ${codeChallenge.status}` : '없음');
        console.log('  - PORTFOLIO 챌린지:', portfolioChallenge ? `ID: ${portfolioChallenge.id}, 제목: ${portfolioChallenge.title}, 상태: ${portfolioChallenge.status}` : '없음');
        console.log('  - 전체 챌린지 수:', challenges.length);
        console.log('  - PORTFOLIO 타입 챌린지들:', challenges.filter(c => c.type === 'PORTFOLIO').map(c => ({ id: c.id, title: c.title, status: c.status })));
        
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

        const codeUse = (codeDetail && isAllowed('CODE', codeDetail.status)) ? codeDetail : null;
        const portfolioUse = (portfolioDetail && isAllowed('PORTFOLIO', portfolioDetail.status)) ? portfolioDetail : null;
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

        // 상태 배지 계산 함수
        const badgeOf = (c: any): { text: string; klass: string } | null => {
            if (!c) return null;
            const now = new Date();
            const type = String(c.type || '').toUpperCase();
            const parse = (v?: string) => v ? new Date(v) : null;
            const endAt = parse(c.endAt as any);
            const voteStart = parse(c.voteStartAt as any);
            const voteEnd = parse(c.voteEndAt as any);
            if (type === 'PORTFOLIO') {
                if (voteEnd && now > voteEnd) return { text: '종료', klass: 'border-neutral-300 text-neutral-600' };
                if (voteStart && now >= voteStart) return { text: '투표중', klass: 'border-purple-300 text-purple-700 bg-purple-50' };
                if (endAt && now >= endAt) return { text: '투표대기', klass: 'border-amber-300 text-amber-700 bg-amber-50' };
                return { text: '진행중', klass: 'border-emerald-300 text-emerald-700 bg-emerald-50' };
            }
            // CODE
            if (endAt && now > endAt) return { text: '종료', klass: 'border-neutral-300 text-neutral-600' };
            return { text: '진행중', klass: 'border-emerald-300 text-emerald-700 bg-emerald-50' };
        };

        const result: ChallengeCardData[] = [];
        
        // CODE 챌린지 추가 (백엔드 데이터가 있을 때만)
        if (codeChallenge?.id) {
            result.push({
                id: codeChallenge.id,
                type: "CODE",
                title: "이번 주 코드 챌린지",
                subtitle: (codeUse?.title || weeklyData?.title) as string,
                description: (
                    <div className="space-y-2 text-[13.5px] leading-6 text-neutral-800">
                        <p className="text-[13px]">조건: 자동 채점 지원 · 제출은 챌린지당 1회</p>
                    </div>
                ),
                ctaLabel: "참여하러 가기",
                adminEditHref: `/admin/challenges/${codeChallenge.id}`,
                listHref: "/challenge?type=CODE",
                summary: codeRule.summary || codeRule.md || codeUse?.summary || weeklyData?.summary || 'AI가 생성한 주간 코드 챌린지입니다.',
                must: Array.isArray(codeRule.must) && codeRule.must.length > 0 ? codeRule.must : weeklyData?.must,
                startDate: codeChallenge.startAt ? new Date(codeChallenge.startAt).toLocaleDateString('ko-KR') : undefined,
                expireAtMs: codeChallenge.endAt ? new Date(codeChallenge.endAt as any).getTime() : undefined,
                ...(badgeOf(codeChallenge) ? { statusBadge: badgeOf(codeChallenge)!.text, statusBadgeClass: badgeOf(codeChallenge)!.klass } : {}),
            });
        }
        
        // PORTFOLIO 챌린지 추가 (백엔드 데이터가 있을 때만)
        if (portfolioChallenge?.id) {
            result.push({
                id: portfolioChallenge.id,
                type: "PORTFOLIO", 
                title: "이번 달 포트폴리오 챌린지",
                subtitle: `${monthlyData?.emoji || ''} ${portfolioUse?.title || monthlyData?.title}`.trim(),
                description: (
                    <div className="space-y-3 text-[13.5px] leading-6 text-neutral-800">
                        <p className="text-[13px]">조건: 팀/개인 참여 가능 · 투표로 순위 결정 · 제출은 챌린지당 1회</p>
                    </div>
                ),
                ctaLabel: "참여하러 가기",
                adminEditHref: `/admin/challenges/${portfolioChallenge.id}`,
                listHref: "/challenge?type=PORTFOLIO",
                summary: portfolioRule.summary || portfolioRule.md || portfolioUse?.summary || monthlyData?.description || 'AI가 생성한 테마 기반의 월간 챌린지입니다.',
                must: Array.isArray(portfolioRule.must) && portfolioRule.must.length > 0 ? portfolioRule.must : monthlyData?.mustHave,
                startDate: portfolioChallenge.startAt ? new Date(portfolioChallenge.startAt).toLocaleDateString('ko-KR') : undefined,
                expireAtMs: (() => {
                    const raw = (portfolioChallenge.voteEndAt || portfolioChallenge.endAt) as any;
                    return raw ? new Date(raw).getTime() : undefined;
                })(),
                ...(badgeOf(portfolioChallenge) ? { statusBadge: badgeOf(portfolioChallenge)!.text, statusBadgeClass: badgeOf(portfolioChallenge)!.klass } : {}),
            });
        }
        
        // 챌린지가 하나도 없으면 더미 데이터 반환
        return result.length > 0 ? result : dummyChallenges;
    } catch (error) {
        console.error('챌린지 데이터 로딩 실패:', error);
        return dummyChallenges; // 에러 시 기본 더미 데이터 반환
    }
}

// 🆕 지난 챌린지 데이터 가져오기 (지난 대결 보기용)
export async function getPastChallenges(): Promise<ChallengeCardData[]> {
    try {
        const backendChallenges = await fetchChallenges(0, 100); // 최대 100개까지 가져오기
        
        if (!backendChallenges.content || backendChallenges.content.length === 0) {
            return [];
        }

        // ENDED 상태 챌린지만 필터링 (OPEN, VOTING 상태는 현재 챌린지이므로 제외)
        const pastChallenges = backendChallenges.content
            .filter(c => {
                const status = String(c.status || '').toUpperCase();
                
                // OPEN이나 VOTING 상태면 현재 진행 중인 챌린지이므로 제외
                if (status === 'OPEN' || status === 'VOTING') {
                    return false;
                }
                
                const type = String(c.type || '').toUpperCase();
                const now = new Date();
                const endAtRaw = type === 'PORTFOLIO' ? (c.voteEndAt || c.endAt) : c.endAt;
                const endAt = endAtRaw ? new Date(endAtRaw as any) : null;
                // 상태가 ENDED이거나, 마감 기준 시간이 지났으면 지난 챌린지로 이동
                return c.status === 'ENDED' || (endAt && now > endAt);
            })
            .sort((a, b) => {
                // 종료일 기준으로 최신순 정렬
                // 포트폴리오: 투표 종료일(voteEndAt) 우선, 없으면 제출 종료일(endAt), 없으면 시작일(startAt)
                // 코드: 제출 종료일(endAt) 우선, 없으면 시작일(startAt)
                const aType = String(a.type || '').toUpperCase();
                const bType = String(b.type || '').toUpperCase();
                
                const getEndDate = (challenge: any) => {
                    if (challenge.type === 'PORTFOLIO') {
                        // 포트폴리오는 투표 종료일을 우선으로 사용
                        return challenge.voteEndAt || challenge.endAt || challenge.startAt;
                    } else {
                        // 코드는 제출 종료일을 사용
                        return challenge.endAt || challenge.startAt;
                    }
                };
                
                const aEndKey = getEndDate(a);
                const bEndKey = getEndDate(b);
                const aEndDate = new Date(aEndKey).getTime();
                const bEndDate = new Date(bEndKey).getTime();
                return bEndDate - aEndDate;
            }); // 제한 없이 모든 종료된 챌린지 표시

        return pastChallenges.map(challenge => {
            // 포트폴리오는 투표 종료일, 코드는 제출 종료일을 표시
            const isCode = challenge.type === "CODE";
            const endDate = isCode 
                ? new Date(challenge.endAt || challenge.startAt)
                : new Date(challenge.voteEndAt || challenge.endAt || challenge.startAt);
            const statusBadge = '종료';
            const statusBadgeClass = 'border-neutral-300 bg-neutral-50 text-neutral-600';
            
            return {
                id: challenge.id,
                type: challenge.type,
                title: `${isCode ? '코드' : '포트폴리오'} 챌린지`,
                subtitle: challenge.title || (isCode ? '코딩 챌린지' : '포트폴리오 챌린지'),
                description: (
                    <div className="space-y-2 text-[13.5px] leading-6 text-neutral-600">
                        <p>📅 {endDate.toLocaleDateString('ko-KR')} 종료</p>
                    </div>
                ),
                ctaLabel: "자세히 보기",
                adminEditHref: `/admin/challenges/${challenge.id}`,
                statusBadge,
                statusBadgeClass,
            };
        });
    } catch (error) {
        console.error('지난 챌린지 데이터 로딩 실패:', error);
        return [];
    }
}