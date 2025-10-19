// src/pages/challenge/ChallengeListPage.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { dummyChallenges, getDynamicChallenges, getPastChallenges } from "../../data/Challenge/dummyChallenges";
import ChallengeCard from "../../components/challenge/ChallengeCard";
import { StatusBadge, Countdown, SectionCard } from "../../components/challenge/common";
import WinnersSection from "../../components/challenge/WinnersSection";
import RewardClaimModal from "../../components/challenge/RewardClaimModal";
import { fetchMyRewards, type RewardItem } from "../../api/challenge_creditApi";
import { isAdmin } from "../../utils/authz";
import type { ChallengeCardData } from "../../components/challenge/ChallengeCard";
import { adminFetchChallenges, fetchChallengeDetail, type ChallengeListResponse, type ChallengeListItem, type ChallengeType, type ChallengeStatus } from "../../api/challengeApi";

import { ChevronLeft, ChevronRight, Gift } from "lucide-react";

export default function ChallengeListPage() {
    const navigate = useNavigate();
    const [challenges, setChallenges] = useState<ChallengeCardData[]>(dummyChallenges);
    const [pastChallenges, setPastChallenges] = useState<ChallengeCardData[]>([]);
    const [loading, setLoading] = useState(false);
    const [pastLoading, setPastLoading] = useState(false);
    const [showRewardModal, setShowRewardModal] = useState(false);
    const [pendingReward, setPendingReward] = useState<RewardItem | null>(null);
    const admin = isAdmin();

    // ----- Admin: challenges table state -----
    const [adminPanelOpen, setAdminPanelOpen] = useState(false);
    const [searchTitle, setSearchTitle] = useState("");
    const [filterType, setFilterType] = useState<"" | ChallengeType>("");
    const [filterStatus, setFilterStatus] = useState<"" | ChallengeStatus>("");
    const [sort, setSort] = useState<string>("-startAt");
    const [page, setPage] = useState<number>(0);
    const [size, setSize] = useState<number>(10);
    const [adminLoading, setAdminLoading] = useState(false);
    const [adminError, setAdminError] = useState<string | null>(null);
    const [adminList, setAdminList] = useState<ChallengeListResponse | null>(null);

    // ----- Admin: rewards table state (per selected challenge) -----
    const [selectedChallengeId, setSelectedChallengeId] = useState<number | null>(null);
    const [selectedChallengeTitle, setSelectedChallengeTitle] = useState<string>("");
    const [rewardsLoading, setRewardsLoading] = useState(false);
    const [rewardsError, setRewardsError] = useState<string | null>(null);
    const [rewardsRows, setRewardsRows] = useState<Array<Record<string, any>>>([]);

    // 현재 챌린지 데이터 가져오기
    useEffect(() => {
        setLoading(true);
        getDynamicChallenges()
            .then((dynamicChallenges) => {
                setChallenges(dynamicChallenges);
            })
            .catch((error) => {
                console.error('챌린지 데이터 로딩 실패:', error);
                // 에러 시 기본 더미 데이터 유지
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    // 새로고침 없이 마감 시점 정확히 전환: 각 카드의 expireAtMs를 기준으로 타이머를 1회 설정
    useEffect(() => {
        const timers: number[] = [];
        const now = Date.now();
        challenges.forEach((c) => {
            if (!c.expireAtMs) return;
            const delay = c.expireAtMs - now;
            if (delay <= 0) return;
            const t = window.setTimeout(async () => {
                try {
                    setLoading(true);
                    const [freshCurrent, freshPast] = await Promise.all([
                        getDynamicChallenges(),
                        getPastChallenges(),
                    ]);
                    setChallenges(freshCurrent);
                    setPastChallenges(freshPast);
                } catch (e) {
                    // eslint-disable-next-line no-console
                    console.error('auto rollover refresh failed', e);
                } finally {
                    setLoading(false);
                }
            }, delay);
            timers.push(t);
        });
        return () => { timers.forEach((t) => window.clearTimeout(t)); };
    }, [challenges]);

    // 지난 챌린지 데이터 가져오기
    useEffect(() => {
        setPastLoading(true);
        getPastChallenges()
            .then((pastData) => {
                setPastChallenges(pastData);
            })
            .catch((error) => {
                console.error('지난 챌린지 데이터 로딩 실패:', error);
            })
            .finally(() => {
                setPastLoading(false);
            });
    }, []);

    // 수령 대기 중인 보상 확인
    useEffect(() => {
        const checkPendingRewards = async () => {
            try {
                const rewards = await fetchMyRewards();
                const pending = rewards.rewards.find(reward => reward.status === 'PENDING');
                setPendingReward(pending || null);
            } catch (error) {
                console.error('보상 상태 확인 실패:', error);
                setPendingReward(null);
            }
        };
        checkPendingRewards();
    }, []);

    // ----- Admin: load challenges list when filters change -----
    useEffect(() => {
        if (!admin) return;
        setAdminLoading(true);
        setAdminError(null);
        adminFetchChallenges({
            page,
            size,
            type: filterType || undefined,
            status: filterStatus || undefined,
            sort,
        })
            .then((resp) => {
                setAdminList(resp);
            })
            .catch((e) => {
                console.error(e);
                setAdminError('관리자 챌린지 목록을 불러오지 못했습니다.');
            })
            .finally(() => setAdminLoading(false));
    }, [admin, page, size, filterType, filterStatus, sort]);

    const filteredAdminRows: ChallengeListItem[] = useMemo(() => {
        const rows = adminList?.content ?? [];
        if (!searchTitle.trim()) return rows;
        const keyword = searchTitle.trim().toLowerCase();
        return rows.filter(r => r.title?.toLowerCase().includes(keyword));
    }, [adminList, searchTitle]);

    const totalElementsText = useMemo(() => {
        const total = adminList?.totalElements ?? 0;
        const currentCount = filteredAdminRows.length;
        return searchTitle ? `${currentCount} / ${total}` : String(total);
    }, [adminList, filteredAdminRows.length, searchTitle]);

    const handleExportChallengesCsv = () => {
        const rows = filteredAdminRows;
        const headers = [
            'id','type','title','status','startAt','endAt','voteStartAt','voteEndAt','submissionCount','voteCount'
        ];
        const lines = [headers.join(',')].concat(
            rows.map(r => [
                r.id,
                r.type,
                escapeCsv(r.title),
                r.status,
                r.startAt,
                r.endAt,
                r.voteStartAt ?? '',
                r.voteEndAt ?? '',
                r.submissionCount,
                r.voteCount
            ].join(','))
        );
        downloadCsv(lines.join('\n'), `challenges_page${page + 1}.csv`);
    };

    const handleSelectChallengeForRewards = async (item: ChallengeListItem) => {
        setSelectedChallengeId(item.id);
        setSelectedChallengeTitle(item.title);
        setRewardsLoading(true);
        setRewardsError(null);
        setRewardsRows([]);
        try {
            const detail: any = await fetchChallengeDetail(item.id);
            const rewards = (detail && (detail.rewards || detail.rewardTiers || detail.reward || [])) as Array<any>;
            if (Array.isArray(rewards)) {
                // normalize keys to rank, credit, krw, note if possible
                const normalized = rewards.map((r: any) => ({
                    rank: r.rank ?? r.position ?? r.place ?? '',
                    credit: r.credit ?? r.credits ?? r.amount ?? '',
                    krw: r.krw ?? r.cash ?? '',
                    note: r.note ?? r.desc ?? ''
                }));
                setRewardsRows(normalized);
            } else {
                setRewardsRows([]);
            }
        } catch (e) {
            console.error(e);
            setRewardsError('보상 정보를 불러오지 못했습니다.');
        } finally {
            setRewardsLoading(false);
        }
    };

    const handleExportRewardsCsv = () => {
        if (!selectedChallengeId) return;
        const headers = ['rank','credit','krw','note'];
        const lines = [headers.join(',')].concat(
            rewardsRows.map(r => [r.rank, r.credit, r.krw ?? '', escapeCsv(String(r.note ?? ''))].join(','))
        );
        downloadCsv(lines.join('\n'), `challenge_${selectedChallengeId}_rewards.csv`);
    };

    function escapeCsv(value: string): string {
        if (value == null) return '';
        const mustQuote = /[",\n]/.test(value);
        const v = String(value).replace(/"/g, '""');
        return mustQuote ? `"${v}"` : v;
    }

    function downloadCsv(content: string, filename: string) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    return (
        <div className="w-full bg-white">
            {/* 오렌지 공지 배너 */}
            <div>
                <div className="mx-auto max-w-screen-xl px-4 py-4 md:px-6">
                    <div className="rounded-xl bg-[#FFA31A] px-5 py-4 text-white md:px-6 md:py-5">
                        <p className="text-[14px] font-semibold">매주 주어질 주제로 코드 / 매달 주어지는 포트폴리오 챌린지!</p>
                        <p className="mt-1 text-[13px] leading-6 opacity-95">
                            개발자라면 누구나 참여 가능, 개인/팀 모두 환영해요.<br className="hidden md:block" />
                            코드 챌린지는 AI 자동 채점으로 공정하게, 포트폴리오 챌린지는 투표로 결정! 1~3등은 크레딧 보상과 전용 뱃지, 참가자 전원도 크레딧 지급!<br className="hidden md:block" />
                            코드 챌린지는 중복 제출·수정 가능, 포트폴리오 챌린지는 팀 or 개인으로 1회 출전 가능!<br className="hidden md:block" />
                            이번 주제 확인하고 지금 바로 참여해 보세요!
                        </p>
                    </div>
                </div>
            </div>

            {/* 수령 대기 중인 보상이 있을 때만 표시 */}
            {pendingReward && (
                <div className="mx-auto max-w-7xl px-4 md:px-6 mt-4">
                    <div className="flex justify-center">
                        <button
                            onClick={() => setShowRewardModal(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-6 py-3 text-[14px] font-semibold hover:from-orange-600 hover:to-yellow-600 transition-all duration-200"
                        >
                            <Gift className="w-4 h-4" />
                            보상 수령하기
                        </button>
                    </div>
                </div>
            )}

            {/* WinnersSection + Admin Actions */}
            <div className="mx-auto max-w-7xl px-4 md:px-6">
                <div className="flex items-center justify-between mt-6">
                    <h2 className="sr-only">Winners</h2>
                </div>
            </div>
            <div className="relative">
                <WinnersSection />
                {admin && (
                    <div className="mx-auto max-w-7xl px-4 md:px-6">
                        <div className="mt-2 flex justify-end gap-2">
                            <button
                                className="rounded-md bg-black text-white px-3 py-2 text-sm"
                                onClick={() => navigate("/admin/challenges/new")}
                            >
                                챌린지 생성
                            </button>
                            <button
                                className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-50"
                                onClick={() => navigate('/admin/challenges')}
                            >
                                챌린지/보상 테이블
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <main className="mx-auto max-w-screen-xl px-4 py-6 md:px-6 md:py-10">
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
                ) : (
                    /* 로딩 완료 - 챌린지 목록 표시 */
                    challenges.map((item) => (
                        <ChallengeCard key={item.id} item={item} />
                    ))
                )}

                {/* 지난 챌린지 - 제목만 */}
                <h2 className="text-2xl font-bold mb-4 text-left ml-[15px]">지난 챌린지</h2>

                {/* 캐러셀 카드 틀만 감싸기 (타이틀 X, 보더 O) */}
                <SectionCard bordered className="mt-2 overflow-visible">
                    <div className="relative">
                        {/* ⬅️ 왼쪽 버튼: 카드 밖으로 살짝 */}
                        <button
                            className={`
                                absolute left-[-10px] md:left-[-14px] top-1/2 -translate-y-1/2
                                rounded-full border p-2 shadow-sm transition-colors
                                ${pastChallenges.length <= 4 
                                    ? 'border-neutral-200 bg-neutral-50 text-neutral-300 cursor-not-allowed' 
                                    : 'border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700'
                                }
                            `}
                            aria-label="이전"
                            disabled={pastChallenges.length <= 4}
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>

                        {/* 캐러셀 그리드: 타이틀 라인과 정렬(ml[15px] ↔ pl[15px]) / 4열 */}
                        <div className="grid grid-cols-1 gap-4 pl-[15px] pr-[15px] sm:grid-cols-2 lg:grid-cols-4">
                            {pastLoading ? (
                                // 로딩 중일 때 스켈레톤
                                [0, 1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className="h-[160px] rounded-2xl border border-neutral-200 bg-neutral-50/60 shadow-[inset_0_1px_0_rgba(0,0,0,0.03)] animate-pulse"
                                    />
                                ))
                            ) : pastChallenges.length > 0 ? (
                                // 실제 지난 챌린지 데이터
                                pastChallenges.slice(0, 4).map((challenge) => (
                                    <div
                                        key={challenge.id}
                                        className="group h-[160px] rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => window.location.href = `/challenge/${challenge.type.toLowerCase()}/${challenge.id}`}
                                    >
                                        <div className="flex flex-col justify-between h-full">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        challenge.type === 'CODE' 
                                                            ? 'bg-blue-100 text-blue-700' 
                                                            : 'bg-purple-100 text-purple-700'
                                                    }`}>
                                                        {challenge.type === 'CODE' ? '코드' : '포트폴리오'}
                                                    </span>
                                                </div>
                                                <h4 className="font-semibold text-sm text-neutral-800 mb-1 line-clamp-2">
                                                    {challenge.subtitle}
                                                </h4>
                                                <div className="text-xs text-neutral-600">
                                                    {challenge.description}
                                                </div>
                                            </div>
                                            <div className="text-xs text-neutral-500 text-right">
                                                {challenge.ctaLabel}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                // 데이터가 없을 때
                                <div className="col-span-full flex items-center justify-center py-8 text-neutral-500">
                                    <p className="text-sm">아직 지난 챌린지가 없습니다.</p>
                                </div>
                            )}
                        </div>

                        {/* ➡️ 오른쪽 버튼: 카드 밖으로 살짝 */}
                        <button
                            className={`
                                absolute right-[-10px] md:right-[-14px] top-1/2 -translate-y-1/2
                                rounded-full border p-2 shadow-sm transition-colors
                                ${pastChallenges.length <= 4 
                                    ? 'border-neutral-200 bg-neutral-50 text-neutral-300 cursor-not-allowed' 
                                    : 'border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700'
                                }
                            `}
                            aria-label="다음"
                            disabled={pastChallenges.length <= 4}
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </SectionCard>
            </main>

            {/* ----- Admin tables removed; moved to dedicated page ----- */}

            {/* 보상 수령 모달 */}
            {pendingReward && (
                <RewardClaimModal
                    isOpen={showRewardModal}
                    onClose={() => setShowRewardModal(false)}
                    challengeTitle={pendingReward.challengeTitle}
                    userReward={pendingReward}
                    onRewardClaimed={() => {
                        setShowRewardModal(false);
                        setPendingReward(null); // 수령 완료 후 상태 업데이트
                        console.log("보상 수령 완료!");
                    }}
                />
            )}
        </div>
    );
}
