import React, { useState, useContext, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import {
    getChallengeDetail,
    type AnyChallengeDetail,
    type PortfolioChallengeDetail,
    type CodeChallengeDetail,
} from "../../data/Challenge/challengeDetailDummy";
import { SectionCard, CTAButton } from "../../components/challenge/common";
import { ChevronDown, ChevronLeft, AlertCircle } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import LoginRequiredModal from "../../components/common/modal/LoginRequiredModal";
import { 
    fetchPortfolioLeaderboard, 
    fetchCodeTopSubmitters,
    type LeaderboardEntry 
} from "../../api/challengeApi";
import { fetchMyRewards, type RewardItem } from "../../api/challenge_creditApi";
import { getVoteSummary, type VoteSummaryResponse } from "../../api/challengeApi";
import { isAdmin } from "../../utils/authz";
import { deleteChallenge } from "../../api/challengeApi";

/* ---------- Small UI ---------- */
function GreenBox({ children }: { children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border-2 border-emerald-400/70 bg-white p-4 md:p-5 text-[13.5px] leading-6 text-neutral-800">
            {children}
        </div>
    );
}
function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <div className="mb-2 flex items-center gap-2">
            <span className="text-[15px] font-bold">{children}</span>
        </div>
    );
}

/* ---------- Reusable blocks ---------- */
function ScheduleList({ items }: { items: { label: string; date: string }[] }) {
    if (!items?.length) return null;
    return (
        <div className="mb-6">
            <SectionTitle>📅 진행 일정</SectionTitle>
            <GreenBox>
                <ul className="space-y-1">
                    {items?.map((s, i) => (
                        <li key={i} className="flex items-center justify-between">
                            <span className="font-medium">{s.label}</span>
                            <span className="text-neutral-700 dark:text-neutral-200 font-medium">{s.date}</span>
                        </li>
                    ))}
                </ul>
            </GreenBox>
        </div>
    );
}

function RewardsTable({
                          rewards,
                          title = "🏆 보상",
                      }: {
    rewards?: { rank: string; credit: string; krw: string; note: string }[];
    title?: string;
}) {
    if (!rewards?.length) return null;
    return (
        <div className="mb-6">
            <SectionTitle>{title}</SectionTitle>
            <GreenBox>
                <div className="grid grid-cols-4 gap-2 text-[13px]">
                    <div className="font-semibold">순위</div>
                    <div className="font-semibold">크레딧</div>
                    <div className="font-semibold">환산</div>
                    <div className="font-semibold">의미</div>
                    {rewards?.map((r, i) => (
                        <React.Fragment key={i}>
                            <div>{r.rank}</div>
                            <div>{r.credit}</div>
                            <div>{r.krw}</div>
                            <div>{r.note}</div>
                        </React.Fragment>
                    ))}
                </div>
            </GreenBox>
        </div>
    );
}


function AIScoringList({ items }: { items?: { label: string; weight: number }[] }) {
    if (!items?.length) return null;
    return (
        <div className="mb-6">
            <SectionTitle>🤖 AI 자동 채점 기준</SectionTitle>
            <GreenBox>
                <ul className="list-disc space-y-1 pl-5 text-[13.5px] leading-7 text-neutral-800">
                    {items?.map((i, idx) => (
                        <li key={idx}>
                            {i.label}: <span className="font-medium">{i.weight}점</span>
                        </li>
                    ))}
                </ul>
            </GreenBox>
        </div>
    );
}

/* ---------- TOP Winners Component ---------- */
function TopWinners({ type, challengeId }: { type: "CODE" | "PORTFOLIO", challengeId: number }) {
    const [winners, setWinners] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWinners = async () => {
            try {
                setLoading(true);
                let leaderboardData;
                
                if (type === "PORTFOLIO") {
                    leaderboardData = await fetchPortfolioLeaderboard(challengeId, 3);
                } else {
                    leaderboardData = await fetchCodeTopSubmitters(challengeId, 3);
                }
                
                setWinners(leaderboardData.entries.slice(0, 3)); // 상위 3명만
                setError(null);
            } catch (err) {
                setError("우승자 정보를 불러올 수 없습니다.");
            } finally {
                setLoading(false);
            }
        };

        fetchWinners();
    }, [type, challengeId]);

    const getMedalIcon = (rank: number) => {
        switch(rank) {
            case 1: return "🥇";
            case 2: return "🥈"; 
            case 3: return "🥉";
            default: return "🏅";
        }
    };

    if (loading) {
        return (
            <div className="mb-6">
                <h2 className="text-xl font-bold mb-4 text-center">
                    지난 {type === "CODE" ? "코드" : "포트폴리오"} 챌린지 TOP Winners
                </h2>
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <div className="flex justify-center items-center py-8">
                        <div className="text-gray-500">우승자 정보를 불러오는 중...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mb-6">
                <h2 className="text-xl font-bold mb-4 text-center">
                    지난 {type === "CODE" ? "코드" : "포트폴리오"} 챌린지 TOP Winners
                </h2>
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <div className="flex justify-center items-center py-8">
                        <div className="text-gray-500">{error}</div>
                    </div>
                </div>
            </div>
        );
    }

    // 데이터가 없을 때 더미 우승자 카드 표시
    if (winners.length === 0) {
        const dummyWinners = [
            { rank: 2, userName: "2등", teamName: "팀", userInitial: "2", credits: 5000 },
            { rank: 1, userName: "1등", teamName: "팀", userInitial: "1", credits: 10000 },
            { rank: 3, userName: "3등", teamName: "팀", userInitial: "3", credits: 3000 }
        ];

        return (
            <div className="mb-6">
                <h2 className="text-xl font-bold mb-4 text-center">
                    지난 {type === "CODE" ? "코드" : "포트폴리오"} 챌린지 TOP Winners
                </h2>
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <div className="flex justify-between items-start w-full">
                        {dummyWinners.map((winner) => (
                            <div key={winner.rank} className="flex-1 flex justify-center">
                                <div className="text-center">
                                    {/* 메달 아이콘 */}
                                    <div className="mb-2 text-3xl">
                                        {getMedalIcon(winner.rank)}
                                    </div>
                                    
                                    {/* 이니셜 */}
                                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-2 mx-auto">
                                        <span className="font-bold text-lg text-gray-500">{winner.userInitial}</span>
                                    </div>
                                    
                                    {/* 이름과 팀 이름 */}
                                    <div className="font-semibold text-gray-500 mb-1 break-words text-sm">
                                        {winner.userName} • {winner.teamName}
                                    </div>
                                    
                                    {/* 점수 */}
                                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-sm font-medium">
                                        {winner.credits.toLocaleString()}C
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // 1등을 가운데 배치하기 위해 2-1-3 순서로 정렬
    const orderedWinners = [
        winners.find(w => w.rank === 2),
        winners.find(w => w.rank === 1), 
        winners.find(w => w.rank === 3)
    ].filter(Boolean) as LeaderboardEntry[];

    return (
        <div className="mb-6">
            <h2 className="text-xl font-bold mb-4 text-center">
                지난 {type === "CODE" ? "코드" : "포트폴리오"} 챌린지 TOP Winners
            </h2>
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex justify-between items-start w-full">
                    {orderedWinners.map((winner) => (
                        <div key={winner.userId} className="flex-1 flex justify-center">
                            <div className="text-center">
                                {/* 메달 아이콘 */}
                                <div className="mb-2 text-3xl">
                                    {getMedalIcon(winner.rank)}
                                </div>
                                
                                {/* 이니셜 */}
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2 mx-auto">
                                    <span className="font-bold text-lg text-gray-700">{winner.userInitial}</span>
                                </div>
                                
                                {/* 이름과 팀 이름 */}
                                <div className="font-semibold text-gray-800 mb-1 break-words text-sm">
                                    {winner.teamName ? `${winner.userName} • ${winner.teamName}` : winner.userName}
                                </div>
                                
                                {/* 크레딧 또는 점수 */}
                                <div className="bg-gray-800 text-white px-3 py-1 rounded-full text-sm">
                                    {winner.credits ? `${winner.credits.toLocaleString()} 크레딧` : 
                                     winner.totalScore ? `${winner.totalScore.toFixed(2)}점` : 
                                     `${winner.voteCount || 0}표`}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ---------- Helpers: 라벨/경로 ---------- */
function primaryHref(type: "CODE" | "PORTFOLIO", id: number) {
    return type === "CODE" ? `/challenge/code/${id}/submit` : `/challenge/portfolio/${id}/submit`;
}
function secondaryHref(type: "CODE" | "PORTFOLIO", id: number) {
    return type === "CODE" ? `/challenge/code/${id}/submissions` : `/challenge/portfolio/${id}/vote`;
}
function primaryLabel(type: "CODE" | "PORTFOLIO") {
    return type === "CODE" ? "코드 제출하기" : "포트폴리오 제출하기";
}
function secondaryLabel(
    type: "CODE" | "PORTFOLIO",
    _challengeStatus?: string | null,
    derivedStage?: "SUBMISSION_OPEN" | "VOTE_WAITING" | "VOTING" | "ENDED" | null
) {
    if (type === "CODE") return "제출물 보기";
    if (type === "PORTFOLIO") {
        // 포트폴리오: 투표 가능한 시기에만 '투표하러 가기', 그 외엔 항상 '제출물 확인하러 가기'
        return derivedStage === "VOTING" ? "투표하러 가기" : "제출물 확인하러 가기";
    }
    return "제출물 확인하러 가기";
}

/* ---------- Page ---------- */
export default function ChallengeDetailPage() {
    const params = useParams();
    const location = useLocation();
    const id = Number(params.id || 1);
    
    // URL에서 타입 추출: /challenge/code/:id 또는 /challenge/portfolio/:id
    const getTypeFromPath = (pathname: string): "CODE" | "PORTFOLIO" => {
        if (pathname.includes('/challenge/portfolio/')) return "PORTFOLIO";
        if (pathname.includes('/challenge/code/')) return "CODE";
        return "CODE"; // 기본값
    };
    
    const type = getTypeFromPath(location.pathname);
    
    // AI 데이터만 표시하도록 null로 초기화
    const [data, setData] = useState<AnyChallengeDetail | null>(null);
    const [loading, setLoading] = useState(true); // 초기에는 로딩 상태
    const [error, setError] = useState<string | null>(null);
    const [mustHave, setMustHave] = useState<string[]>([]);
    const [challengeStatus, setChallengeStatus] = useState<string | null>(null);
    const [timeline, setTimeline] = useState<{ startAt?: string; endAt?: string; voteStartAt?: string; voteEndAt?: string }>({});

    const [open, setOpen] = useState(true);
    const [loginModalOpen, setLoginModalOpen] = useState(false);
    // 보상 수령 기능 제거됨
    const admin = isAdmin();
    const [voteSummary, setVoteSummary] = useState<VoteSummaryResponse>([]);

    const navigate = useNavigate();
    const { isLoggedIn } = useContext(AuthContext);

    useEffect(() => {
        setLoading(true);
        setError(null);
        
        // 1. 백엔드에서 챌린지 상세 정보 가져오기
        import('../../api/challengeApi').then(({ fetchChallengeDetail }) => {
            fetchChallengeDetail(id)
                .then((backendChallenge) => {
                    
                    // ruleJson 파싱: 문자열일 수 있음 (현재 사용하지 않음)
                    // let rule: any = {};
                    // try {
                    //     const raw = backendChallenge?.ruleJson;
                    //     rule = typeof raw === 'string' ? JSON.parse(raw) : (raw || {});
                    // } catch {}

                    // 🚨 타입 불일치 체크 및 리디렉션
                    if (backendChallenge.type !== type) {
                        const correctPath = backendChallenge.type === "CODE" 
                            ? `/challenge/code/${id}` 
                            : `/challenge/portfolio/${id}`;
                        console.warn(`타입 불일치 감지: URL=${type}, 백엔드=${backendChallenge.type}. ${correctPath}로 리디렉션합니다.`);
                        navigate(correctPath, { replace: true });
                        return;
                    }
                    
                    // 2. 챌린지 타입에 따라 AI 데이터 가져오기
                    if (backendChallenge.type === "PORTFOLIO") {
                        // 포트폴리오 챌린지 - 백엔드 데이터 우선 사용
                        
                        // ruleJson 파싱 먼저 수행
                        let ruleData: any = null;
                        let backendDescription: string | null = null;
                        
                        if (backendChallenge.ruleJson) {
                            try {
                                ruleData = typeof backendChallenge.ruleJson === 'string' 
                                    ? JSON.parse(backendChallenge.ruleJson) 
                                    : backendChallenge.ruleJson;
                                
                                // 백엔드 설명 우선순위: summary > md > null
                                backendDescription = ruleData.summary || ruleData.md;
                                
                                setMustHave(ruleData.must || ruleData.mustHave || []);
                            } catch (e) {
                                setMustHave([]);
                            }
                        }
                        
                        // 더미 데이터를 기반으로 하되 백엔드 데이터로 업데이트
                        const baseData = getChallengeDetail(id) as PortfolioChallengeDetail;
                        const backendBasedData = {
                            ...baseData,
                            id: backendChallenge.id,
                            title: `포트폴리오 챌린지: ${backendChallenge.title}`, // 백엔드 제목 사용
                            subtitle: backendChallenge.title, // 원본 제목 
                            description: backendDescription || baseData.description, // 파싱된 백엔드 설명 사용
                            startAt: backendChallenge.startAt,
                            endAt: backendChallenge.endAt,
                            status: backendChallenge.status,
                        };
                        
                        setData(backendBasedData);
                        setChallengeStatus(backendChallenge.status);
                        setTimeline({
                            startAt: backendChallenge.startAt,
                            endAt: backendChallenge.endAt,
                            voteStartAt: backendChallenge.voteStartAt,
                            voteEndAt: backendChallenge.voteEndAt,
                        });
                        
                        // AI 데이터는 보조적으로만 사용 (설명이 없을 때만)
                        if (!backendDescription) {
                            import('../../api/monthlyChallenge').then(({ fetchMonthlyChallenge }) => {
                                fetchMonthlyChallenge()
                                    .then((monthlyData) => {
                                        setData(prev => prev ? {
                                            ...prev,
                                            description: monthlyData.description || prev.description,
                                        } : prev);
                                        if (!ruleData?.must && !ruleData?.mustHave) {
                                            setMustHave(monthlyData.mustHave || []);
                                        }
                                    })
                                    .catch((err) => {
                                        // AI 데이터 로딩 실패는 무시
                                    });
                            });
                        }
                        
                        setError(null);
                        setLoading(false);
                    } else if (backendChallenge.type === "CODE") {
                        // 코드 챌린지 - 백엔드 데이터 우선 사용
                        
                        // ruleJson 파싱 먼저 수행
                        let ruleData: any = null;
                        let backendDescription: string | null = null;
                        
                        if (backendChallenge.ruleJson) {
                            try {
                                ruleData = typeof backendChallenge.ruleJson === 'string' 
                                    ? JSON.parse(backendChallenge.ruleJson) 
                                    : backendChallenge.ruleJson;
                                
                                // 백엔드 설명 우선순위: summary > md > null
                                backendDescription = ruleData.summary || ruleData.md;
                                
                                setMustHave(ruleData.must || []);
                            } catch (e) {
                                setMustHave([]);
                            }
                        }
                        
                        // 더미 데이터를 기반으로 하되 백엔드 데이터로 업데이트
                        const baseData = getChallengeDetail(id) as CodeChallengeDetail;
                        const backendBasedData = {
                            ...baseData,
                            id: backendChallenge.id,
                            title: `코드 챌린지: ${backendChallenge.title}`, // 백엔드 제목 사용
                            subtitle: backendChallenge.title, // 원본 제목 
                            description: backendDescription || baseData.description, // 파싱된 백엔드 설명 사용
                            startAt: backendChallenge.startAt,
                            endAt: backendChallenge.endAt,
                            status: backendChallenge.status,
                        };
                        
                        setData(backendBasedData);
                        setChallengeStatus(backendChallenge.status);
                        setTimeline({
                            startAt: backendChallenge.startAt,
                            endAt: backendChallenge.endAt,
                            voteStartAt: backendChallenge.voteStartAt,
                            voteEndAt: backendChallenge.voteEndAt,
                        });
                        
                        setError(null);
                        setLoading(false);
                    }
                })
                .catch((err) => {
                    setError('챌린지 정보를 불러오는 중 오류가 발생했습니다.');
                    setData(null);
                    setLoading(false); // 실패 시에도 로딩 완료
                });
        });
    }, [id, navigate, type]); // data 의존성 제거로 무한 루프 방지

    // 보상 수령 기능 제거됨

    const goPrimary = () => {
        if (!data) return;
        const href = primaryHref(type, id);
        if (!isLoggedIn) return setLoginModalOpen(true);
        navigate(href);
    };
    const goSecondary = () => {
        if (!data) return;
        const href = secondaryHref(type, id);
        const needsLogin = type === "PORTFOLIO";
        if (needsLogin && !isLoggedIn) return setLoginModalOpen(true);
        navigate(href);
    };

    const onBack = () => {
        navigate("/challenge");
    };
    // 관리자 전용 투표 요약 로드
    useEffect(() => {
        const loadSummary = async () => {
            if (!admin || type !== "PORTFOLIO") return;
            try {
                const summary = await getVoteSummary(id);
                setVoteSummary(summary);
            } catch {
                setVoteSummary([]);
            }
        };
        loadSummary();
    }, [admin, id, type]);

    // ---- Derived stage helpers (portfolio) ----
    const parseTs = (v?: string) => {
        if (!v) return null;
        const s = v.includes('T') ? v : v.replace(' ', 'T');
        const d = new Date(s);
        return isNaN(d.getTime()) ? null : d;
    };
    const derivedStage: "SUBMISSION_OPEN" | "VOTE_WAITING" | "VOTING" | "ENDED" | null = React.useMemo(() => {
        if (type !== "PORTFOLIO") return null;
        const now = new Date();
        const endAt = parseTs(timeline.endAt);
        const vStart = parseTs(timeline.voteStartAt);
        const vEnd = parseTs(timeline.voteEndAt);
        if (vEnd && now > vEnd) return "ENDED";
        if (vStart && now >= vStart) return "VOTING";
        if (endAt && now >= endAt) return "VOTE_WAITING";
        return "SUBMISSION_OPEN";
    }, [type, timeline.endAt, timeline.voteStartAt, timeline.voteEndAt]);

    return (
        <div className="mx-auto w-full max-w-screen-xl px-4 py-6 md:px-6 md:py-10">
            <LoginRequiredModal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
            
            {loading ? (
                /* 로딩 상태 - 전체 화면 */
                <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-3 text-neutral-600 mb-4">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-emerald-500"></div>
                            <span className="text-lg font-medium">AI 챌린지 정보를 불러오는 중...</span>
                        </div>
                        <p className="text-sm text-neutral-500">잠시만 기다려주세요</p>
                    </div>
                </div>
            ) : data ? (
                <>
                    {/* 에러 상태 */}
                    {error && (
                        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
                            <div className="flex items-center gap-2 text-red-700">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-sm">{error}</span>
                            </div>
                        </div>
                    )}

            {/* 헤더 */}
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={onBack}
                        aria-label="뒤로가기"
                        className="mr-1 inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-[22px] font-extrabold tracking-[-0.01em] text-neutral-900 md:text-[24px] flex items-center gap-2">
                        <span>{data.title}</span>
                        {(() => {
                            const labelAndClass = () => {
                                if (type === "PORTFOLIO") {
                                    if (derivedStage === "ENDED") return { t: "종료", c: "border-neutral-300 text-neutral-600" };
                                    if (derivedStage === "VOTING") return { t: "투표중", c: "border-purple-300 text-purple-700 bg-purple-50" };
                                    if (derivedStage === "VOTE_WAITING") return { t: "투표대기", c: "border-amber-300 text-amber-700 bg-amber-50" };
                                    return { t: "진행중", c: "border-emerald-300 text-emerald-700 bg-emerald-50" };
                                }
                                if (challengeStatus === "ENDED") return { t: "종료", c: "border-neutral-300 text-neutral-600" };
                                return { t: "진행중", c: "border-emerald-300 text-emerald-700 bg-emerald-50" };
                            };
                            const v = labelAndClass();
                            return (
                                <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[12px] font-medium ${v.c}`}>
                                    {v.t}
                                </span>
                            );
                        })()}
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setOpen((v) => !v)}
                        className="inline-flex items-center gap-1 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-[12.5px] hover:bg-neutral-50"
                    >
                        상세 {open ? "접기" : "펼치기"} <ChevronDown className={`h-4 w-4 ${open ? "rotate-180" : ""}`} />
                    </button>
                </div>
            </div>

            {/* 상단 CTA */}
            <div className="mb-4 flex flex-wrap gap-2">
                {/* 포트폴리오: 제출 기간에만 제출 버튼 표시 (관리자 제외) */}
                {(type === "PORTFOLIO" ? derivedStage === "SUBMISSION_OPEN" : challengeStatus !== "ENDED") && !admin && (
                    <button
                        onClick={goPrimary}
                        className="inline-flex items-center gap-1 rounded-xl border border-neutral-300 bg-white px-3 py-1.5 text-[13px] font-semibold hover:bg-neutral-50 dark:bg-neutral-800 dark:text-white dark:border-neutral-600 dark:hover:bg-neutral-700"
                    >
                        <span>{type === "CODE" ? "📥" : "📤"}</span> {primaryLabel(type)} →
                    </button>
                )}

                {/* 보상 수령 기능 제거됨 */}

                <button
                    onClick={goSecondary}
                    className="inline-flex items-center gap-1 rounded-xl border border-neutral-300 bg-white px-3 py-1.5 text-[13px] font-semibold hover:bg-neutral-50 dark:bg-neutral-800 dark:text-white dark:border-neutral-600 dark:hover:bg-neutral-700"
                >
                    <span>{type === "CODE" ? "🗂️" : (derivedStage === "VOTING" ? "🗳️" : "🗂️")}</span> {secondaryLabel(type, challengeStatus, derivedStage)} →
                </button>
            </div>

            {/* 관리자 전용 투표 현황은 투표 목록 페이지에서만 표시 */}

            {/* 안내 배지: 포트폴리오 투표 대기 */}
            {type === "PORTFOLIO" && derivedStage === "VOTE_WAITING" && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
                    제출 마감 · 투표 대기 중입니다. 제출물만 확인할 수 있어요.
                </div>
            )}

            {/* TOP Winners - 종료된 포트폴리오 챌린지만 */}
            {challengeStatus === "ENDED" && type === "PORTFOLIO" && data?.id && <TopWinners type={type} challengeId={data.id} />}

            {/* 본문 */}
            {open && (
                <SectionCard className="!px-6 !py-5 md:!px-8 md:!py-6" outerClassName="mt-2">
                    {/* 설명 헤더 + 관리자 액션을 같은 선상에 배치 */}
                    <div className="mb-6">
                        <div className="mb-2 flex items-center justify-between">
                            <SectionTitle>{type === "CODE" ? "📘 문제 설명" : "📘 챌린지 설명"}</SectionTitle>
                            {admin && (
                                <div className="flex items-center gap-2">
                                    <Link
                                        to={`/admin/challenges/${id}`}
                                        className="inline-flex items-center gap-1 rounded-xl border border-neutral-300 bg-white px-3 py-1.5 text-[13px] font-semibold hover:bg-neutral-50"
                                    >
                                        챌린지 수정
                                    </Link>
                                    <button
                                        onClick={async () => {
                                            const ok = window.confirm("이 챌린지를 삭제하시겠습니까? 되돌릴 수 없습니다.");
                                            if (!ok) return;
                                            try {
                                                await deleteChallenge(id, { force: true });
                                                navigate("/challenge", { replace: true });
                                            } catch (e) {
                                                alert("삭제 중 오류가 발생했습니다.");
                                            }
                                        }}
                                        className="inline-flex items-center gap-1 rounded-xl border border-red-300 bg-white px-3 py-1.5 text-[13px] font-semibold text-red-600 hover:bg-red-50"
                                    >
                                        챌린지 삭제
                                    </button>
                                </div>
                            )}
                        </div>
                        <p className="whitespace-pre-line text-[13.5px] leading-7 text-neutral-800 dark:text-neutral-100">{data.description}</p>
                    </div>

                    {/* 필수 조건 (모든 챌린지 타입) */}
                    {mustHave.length > 0 && (
                        <div className="mb-6">
                            <SectionTitle>📋 필수 조건</SectionTitle>
                            <div className="space-y-2">
                    {mustHave?.map((requirement, index) => (
                        <div key={index} className="flex items-start gap-2">
                            <div className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0"></div>
                                        <span className="text-[13.5px] leading-6 text-neutral-800 dark:text-neutral-100">{requirement}</span>
                        </div>
                    ))}
                            </div>
                        </div>
                    )}

                    {/* 유형별 */}
                    {type === "CODE" ? (
                        <>
                            <ScheduleList items={(data as CodeChallengeDetail).schedule || []} />
                            <AIScoringList items={(data as CodeChallengeDetail).aiScoring || []} />
                            <RewardsTable rewards={(data as CodeChallengeDetail).rewards || []} />
                            
                            {/* 코드 챌린지 제출 예시 */}
                            <div className="mb-6">
                                <SectionTitle>📦 제출 예시</SectionTitle>
                                <GreenBox>
                                    <div className="space-y-1 text-[13.5px] leading-7">
                                        <div>
                                            <span className="font-semibold">GitHub: </span>
                                            https://github.com/hong-dev/max-room-number
                                        </div>
                                        <div>
                                            <span className="font-semibold">데모 URL: </span>
                                            https://max-room-number.example.com
                                        </div>
                                        <div>
                                            <span className="font-semibold">언어: </span>
                                            node
                                        </div>
                                        <div>
                                            <span className="font-semibold">엔트리포인트: </span>
                                            npm start
                                        </div>
                                        <div className="whitespace-pre-line">Node.js로 풀이 제출. 그리디로 자릿수 최대 확보 후 자리별 대체 로직 적용.
유닛테스트 케이스 20개 포함, 엣지(예산=1, N=1) 처리.</div>
                                    </div>
                                </GreenBox>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* 진행 일정: 고정 문구로 노출 */}
                            <ScheduleList
                                items={[
                                    { label: '챌린지 기간', date: '매월 1일 ~ 말일' },
                                    { label: '투표 기간', date: '다음달 1일 ~ 3일' },
                                    { label: '결과 발표', date: '다음달 4일, 보상은 크레딧으로 자동 지급' },
                                ]}
                            />
                            {/* 투표 기준: 고정 문구로 노출 */}
                            <div className="mb-6">
                                <SectionTitle>🗳️ 투표 기준</SectionTitle>
                                <GreenBox>
                                    <ul className="list-disc space-y-1 pl-5 text-[13.5px] leading-7 text-neutral-800">
                                        <li>UI/UX (1~5점)</li>
                                        <li>기술력 (1~5점)</li>
                                        <li>창의성(1~5점)</li>
                                        <li>기획력(1~5점)</li>
                                    </ul>
                                </GreenBox>
                            </div>
                            <RewardsTable rewards={(data as PortfolioChallengeDetail).rewards || []} />
                            
                            {/* 포트폴리오 챌린지 제출 예시 */}
                            <div className="mb-6">
                                <SectionTitle>📦 제출 예시</SectionTitle>
                                <GreenBox>
                                    <div className="space-y-1 text-[13.5px] leading-7">
                                        <div>
                                            <span className="font-semibold">GitHub: </span>
                                            https://github.com/retro-blog-team
                                        </div>
                                        <div>
                                            <span className="font-semibold">데모 URL: </span>
                                            https://retroblog.dev
                                        </div>
                                        <div className="whitespace-pre-line">Next.js + Tailwind 기반 레트로 테마 블로그. VHS 스타일 애니메이션/CRT 느낌 UI 반영.</div>
                                    </div>
                                </GreenBox>
                            </div>
                            {(data as PortfolioChallengeDetail).teamExample && (
                                <div className="mb-6">
                                    <SectionTitle>👥 팀 정보 예시</SectionTitle>
                                    <GreenBox>
                                        <div className="text-[13.5px] leading-7">
                                            <div>
                                                <span className="font-semibold">팀 이름: </span>
                                                {(data as PortfolioChallengeDetail).teamExample?.name}
                                            </div>
                                            <div>
                                                <span className="font-semibold">구성: </span>
                                                {(data as PortfolioChallengeDetail).teamExample?.members}
                                            </div>
                                            {(data as PortfolioChallengeDetail).teamExample?.roles && (
                                                <div>
                                                    <span className="font-semibold">역할: </span>
                                                    {(data as PortfolioChallengeDetail).teamExample?.roles}
                                                </div>
                                            )}
                                        </div>
                                    </GreenBox>
                                </div>
                            )}
                        </>
                    )}

                    {/* 공통 - 하드코딩된 안내문구 */}
                    {type === "CODE" ? (
                        <>
                            {/* 코드 챌린지 - 심사 기준 */}
                            <div className="mb-6">
                                <SectionTitle>💡 심사 기준</SectionTitle>
                                <ul className="list-disc space-y-1 pl-5 text-[13.5px] leading-7 text-neutral-800">
                                    <li>자리 수를 먼저 최대화한 뒤 각 자리에서 가능한 가장 큰 수를 고르는 전략(그리디+보정) 제시</li>
                                    <li>선행 0 금지(한 자리 예외) 등 엣지케이스 처리</li>
                                    <li>복잡도/가독성/테스트 통과율(성능) 가산점</li>
                                    <li>창의적인 접근(DP/증명/튜닝) 환영</li>
                                </ul>
                            </div>

                            {/* 코드 챌린지 - 안내 */}
                            <div>
                                <SectionTitle>📣 안내</SectionTitle>
                                <ul className="list-disc space-y-1 pl-5 text-[13.5px] leading-7 text-neutral-800">
                                    <li>챌린지 시작: 월요일 00:00 (KST) ~ 문제 제출 마감: 일요일 23:59</li>
                                    <li>AI 자동 채점 → 점수/코멘트 반영(수 분 소요)</li>
                                    {/* 포트폴리오 전용 문구 제거: 코드 챌린지에는 투표 점수 합산/자동 지급 안내 미표시 */}
                                </ul>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* 포트폴리오 챌린지 - 운영/공정성 */}
                            <div className="mb-6">
                                <SectionTitle>🛡 운영/공정성</SectionTitle>
                                <ul className="list-disc space-y-1 pl-5 text-[13.5px] leading-7 text-neutral-800">
                                    <li>운영 정책/공정성: 챌린지당 1표, 본인 작품 투표 불가, 투표 기간 내에만 가능</li>
                                    <li>UI/UX, 기술력, 창의성, 기획력의 종합 점수(별점 합산)로 순위 산정</li>
                                    <li>제출물은 표절/저작권을 침해하지 않도록 주의(참고 출처 표기 권장)</li>
                                </ul>
                            </div>

                            {/* 포트폴리오 챌린지 - 안내 */}
                            <div>
                                <SectionTitle>📣 안내</SectionTitle>
                                <ul className="list-disc space-y-1 pl-5 text-[13.5px] leading-7 text-neutral-800">
                                    <li>챌린지 기간: 매월 1일 ~ 말일</li>
                                    <li>투표 기간: 다음달 1일 ~ 3일</li>
                                    <li>결과 발표: 다음달 4일, 보상은 크레딧으로 자동 지급</li>
                                </ul>
                            </div>
                        </>
                    )}
                </SectionCard>
            )}

                    {/* 하단 고정 CTA */}
                    <div className="sticky bottom-4 mt-6 flex justify-end">
                        <div className="flex items-center gap-2 rounded-full border px-2 py-2 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-white/70 supports-[backdrop-filter]:dark:bg-neutral-900/40 border-neutral-200 bg-white dark:bg-neutral-800">
                            {/* 포트폴리오: 제출 기간에만 제출 버튼 표시 (관리자 제외) */}
                            {(type === "PORTFOLIO" ? derivedStage === "SUBMISSION_OPEN" : challengeStatus !== "ENDED") && !admin && (
                                <CTAButton as="button" onClick={goPrimary}>
                                    {primaryLabel(type)}
                                </CTAButton>
                            )}
                            <CTAButton as="button" onClick={goSecondary}>
                                {secondaryLabel(type, challengeStatus, derivedStage)}
                            </CTAButton>
                        </div>
                    </div>
                </>
            ) : (
                /* 데이터가 없을 때 */
                <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-3 text-neutral-600 mb-4">
                            <AlertCircle className="h-6 w-6 text-red-500" />
                            <span className="text-lg font-medium">챌린지 정보를 불러올 수 없습니다</span>
                        </div>
                        <p className="text-sm text-neutral-500">잠시 후 다시 시도해주세요</p>
                    </div>
                </div>
            )}

            {/* 보상 수령 기능 제거됨 */}
        </div>
    );
}
