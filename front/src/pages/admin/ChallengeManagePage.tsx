// src/pages/admin/ChallengeManagePage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminFetchChallenges, fetchChallengeDetail, fetchPortfolioLeaderboard, type ChallengeListResponse, type ChallengeListItem, type ChallengeType, type ChallengeStatus } from "../../api/challengeApi";
import { adminCustomPayout } from "../../api/challenge_creditApi";

export default function ChallengeManagePage() {
    const navigate = useNavigate();

    // 리스트 상태
    const [searchTitle, setSearchTitle] = useState("");
    const [filterType, setFilterType] = useState<"" | ChallengeType>("");
    const [filterStatus, setFilterStatus] = useState<"" | ChallengeStatus>("");
    const [sort, setSort] = useState<string>("-createdAt");
    const [page, setPage] = useState<number>(0);
    const [size, setSize] = useState<number>(10);
    const [adminLoading, setAdminLoading] = useState(false);
    const [adminError, setAdminError] = useState<string | null>(null);
    const [adminList, setAdminList] = useState<ChallengeListResponse | null>(null);

    // 보상 상태
    const [selectedChallengeId, setSelectedChallengeId] = useState<number | null>(null);
    const [selectedChallengeTitle, setSelectedChallengeTitle] = useState<string>("");
    const [rewardsLoading, setRewardsLoading] = useState(false);
    const [rewardsError, setRewardsError] = useState<string | null>(null);
    const [rewardsRows, setRewardsRows] = useState<Array<Record<string, any>>>([]);
    const [payoutRows, setPayoutRows] = useState<Array<{ rank: number | string; amount: number; userName?: string; teamName?: string }>>([]);

    // 커스텀 지급 폼 상태
    const [customUserId, setCustomUserId] = useState<string>("");
    const [customAmount, setCustomAmount] = useState<string>("");
    const [customRank, setCustomRank] = useState<string>("");
    const [customMemo, setCustomMemo] = useState<string>("");
    const [customReason, setCustomReason] = useState<string>("REWARD_CUSTOM");
    const [customLoading, setCustomLoading] = useState(false);
    const [customMsg, setCustomMsg] = useState<string>("");
    const [customHistory, setCustomHistory] = useState<Array<{ challengeId: number; at: string; userId: number; amount: number; rank?: number; memo?: string; reason?: string }>>([]);
    const [showCustomBox, setShowCustomBox] = useState(false);
    const customRowsForSelected = useMemo(() => {
        if (!selectedChallengeId) return [] as typeof customHistory;
        return customHistory.filter(h => h.challengeId === selectedChallengeId);
    }, [customHistory, selectedChallengeId]);

    // 커스텀 지급 로컬 보관 키 (새로고침 후에도 유지)
    const STORAGE_KEY = 'adminCustomPayoutHistory:v1';
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) setCustomHistory(parsed);
        } catch {}
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(customHistory)); } catch {}
    }, [customHistory]);

    useEffect(() => {
        setAdminLoading(true);
        setAdminError(null);
        adminFetchChallenges({ page, size, type: filterType || undefined, status: filterStatus || undefined, sort })
            .then((resp) => setAdminList(resp))
            .catch(() => setAdminError('관리자 챌린지 목록을 불러오지 못했습니다.'))
            .finally(() => setAdminLoading(false));
    }, [page, size, filterType, filterStatus, sort]);

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

    // 페이지네이션 안전 계산: 서버 totalPages 우선, 없으면 totalElements/size로 보정
    const currentPage = page; // 서버 number 값에 의존하지 않고 로컬 상태 기준으로 표시/계산
    // totalElements가 문자열로 오는 경우를 대비하여 숫자로 강제 변환
    const serverTotalRaw: any = adminList?.totalElements as any;
    const serverTotal = useMemo(() => {
        const v = serverTotalRaw as any;
        const n = typeof v === 'string' ? parseInt(v, 10) : v;
        return Number.isFinite(n) ? (n as number) : undefined;
    }, [serverTotalRaw]);
    const effectiveTotalPages = useMemo(() => {
        const contentLen = adminList?.content?.length || 0;
        const calcFromServer = (typeof serverTotal === 'number' && size > 0)
            ? Math.max(1, Math.ceil(serverTotal / size))
            : (typeof adminList?.totalPages === 'number' && adminList.totalPages > 0 ? adminList.totalPages : 1);
        const calcFromHeuristic = (currentPage || 0) + (contentLen >= size ? 2 : 1);
        return Math.max(calcFromServer, calcFromHeuristic);
    }, [adminList, size, currentPage, serverTotal]);
    const hasPrev = (currentPage || 0) > 0;
    const hasNext = useMemo(() => {
        const contentLen = adminList?.content?.length || 0;
        const serverBased = (typeof serverTotal === 'number') ? (((currentPage || 0) + 1) * size < serverTotal) : undefined;
        const heuristic = contentLen >= size; // 현재 페이지가 꽉 찼으면 다음이 있을 가능성 높음
        return (serverBased ?? false) || heuristic || ((currentPage + 1) < effectiveTotalPages);
    }, [adminList, serverTotal, currentPage, size, effectiveTotalPages]);

    const handleExportChallengesCsv = async () => {
        // 페이지 크기(5/10/15...)와 무관하게, 현재 필터(타입/상태/검색/정렬)를 유지한 전체 목록 CSV
        const all: any[] = [];
        let p = 0;
        const pageSize = 200; // 대용량 대비 적당한 배치 크기
        while (true) {
            const resp = await adminFetchChallenges({
                page: p,
                size: pageSize,
                type: filterType || undefined,
                status: filterStatus || undefined,
                sort,
            });
            const content = resp?.content || [];
            all.push(...content);
            const last = (resp && typeof resp.last === 'boolean') ? resp.last : (content.length < pageSize);
            if (last) break;
            p += 1;
        }
        // 제목 검색어는 클라이언트에서 최종 필터
        const csvRows = (!searchTitle.trim() ? all : all.filter(r => (r.title || '').toLowerCase().includes(searchTitle.trim().toLowerCase())));
        const headers = ['id','type','title','status','startAt','endAt','voteStartAt','voteEndAt','submissionCount','voteCount'];
        const lines = [headers.join(',')].concat(csvRows.map((r: any) => [
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
        ].join(',')));
        downloadCsv(lines.join('\n'), `challenges_all.csv`);
    };

    const handleSelectChallengeForRewards = async (item: ChallengeListItem) => {
        setSelectedChallengeId(item.id);
        setSelectedChallengeTitle(item.title);
        setRewardsLoading(true);
        setRewardsError(null);
        setRewardsRows([]);
        try {
            const detail: any = await fetchChallengeDetail(item.id);
            // ruleJson 파싱: 기본 보상 규칙(top/participant) 추출
            let ruleTop: number[] | undefined; let ruleParticipant: number | undefined;
            try {
                const ruleRaw = detail?.ruleJson;
                const rule = typeof ruleRaw === 'string' ? JSON.parse(ruleRaw) : ruleRaw;
                if (Array.isArray(rule?.top)) ruleTop = rule.top.map((v: any) => Number(v)).filter((n: any) => Number.isFinite(n));
                if (rule?.participant != null) ruleParticipant = Number(rule.participant);
            } catch {}

            // 1) 최상위 필드 우선(표 형태)
            let rewards: any = (detail && (detail.rewards || detail.rewardTiers || detail.reward)) as Array<any> | undefined;
            // 2) 배열형이 없으면 ruleJson의 숫자 규칙을 표로 변환
            if ((!rewards || rewards.length === 0) && (ruleTop?.length || ruleParticipant)) {
                const medals = ['🥇 1등', '🥈 2등', '🥉 3등'];
                const rowsFromTop = (ruleTop || [])
                    .map((amt: any, idx: number) => ({ rank: medals[idx] || `${idx + 1}등`, credit: amt, krw: '', note: '' }));
                const participantRow = (ruleParticipant && ruleParticipant > 0) ? [{ rank: '🎖 참가자 전원', credit: ruleParticipant, krw: '', note: '' }] : [];
                rewards = [...rowsFromTop, ...participantRow];
            }
            if (Array.isArray(rewards) && rewards.length > 0) {
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

            // 자동 지급 결과 표시: 포트폴리오 ENDED일 때 리더보드 credits 기반으로 표시
            try {
                // ENDED가 아니면 지급 결과 없음
                if (item.status !== 'ENDED') {
                    setPayoutRows([]);
                } else {
                    // 1) 포트폴리오: 리더보드 credits 사용
                    if (item.type === 'PORTFOLIO') {
                        const lb = await fetchPortfolioLeaderboard(item.id, 1000);
                        const entries = Array.isArray(lb?.entries) ? lb.entries : [];
                        // 1) leaderboard credits 그대로 맵핑 (0도 포함)
                        let payouts = entries.map((e: any) => ({
                            rank: e.rank,
                            amount: Number((e.credits ?? 0)),
                            userName: e.userName,
                            teamName: e.teamName,
                        }));
                        // 2) 모든 금액이 0 이하이면 → 규칙 기반으로 재계산하여 대체
                        const hasPositive = payouts.some(p => (p.amount || 0) > 0);
                        if (!hasPositive) {
                            const defaultTop = [10000, 5000, 3000];
                            const topArr = (ruleTop && ruleTop.length ? ruleTop : defaultTop).map(n => Number(n) || 0);
                            const participantAmt = (ruleParticipant != null ? Number(ruleParticipant) : 500) || 0;
                            payouts = entries.map((e: any) => {
                                const idx = (e.rank ?? 0) - 1;
                                const amount = (idx >= 0 && idx < topArr.length && topArr[idx] > 0) ? topArr[idx] : participantAmt;
                                return { rank: e.rank, amount, userName: e.userName, teamName: e.teamName };
                            });
                        } else {
                            // credits가 존재하더라도 0인 항목(참가자)은 규칙의 participant 금액으로 치환하여 닉네임 단위로 노출
                            const defaultTop = [10000, 5000, 3000];
                            const topArr = (ruleTop && ruleTop.length ? ruleTop : defaultTop).map(n => Number(n) || 0);
                            const participantAmt = (ruleParticipant != null ? Number(ruleParticipant) : 500) || 0;
                            payouts = entries.map((e: any, i: number) => {
                                const base = payouts[i];
                                const idx = (e.rank ?? 0) - 1;
                                const isWinner = idx >= 0 && idx < topArr.length && topArr[idx] > 0;
                                const amount = (base.amount && base.amount > 0) ? base.amount : (isWinner ? (topArr[idx] || 0) : participantAmt);
                                return { rank: e.rank, amount, userName: e.userName, teamName: e.teamName };
                            });
                        }
                        setPayoutRows(payouts);
                    } else {
                        // 2) 코드형: 구성표(ruleJson.top/participant)가 있으면 참가 보상만 표기
                        const participant = (() => {
                            try {
                                const rule = typeof (detail?.ruleJson) === 'string' ? JSON.parse(detail.ruleJson) : detail?.ruleJson;
                                return rule?.participant;
                            } catch { return undefined; }
                        })();
                        if (participant) {
                            setPayoutRows([{ rank: '🎖 참가자 전원', amount: Number(participant) }]);
                        } else {
                            setPayoutRows([]);
                        }
                    }
                }
            } catch {
                setPayoutRows([]);
            }
        } catch (e) {
            setRewardsError('보상 정보를 불러오지 못했습니다.');
        } finally {
            setRewardsLoading(false);
        }
    };

    const handleExportRewardsCsv = () => {
        if (!selectedChallengeId) return;
        if (payoutRows.length > 0) {
            const toStatus = (rank: any): string => {
                if (typeof rank === 'number' && rank >= 1) return `${rank}위`;
                const text = String(rank ?? '').trim();
                if (/^\d+$/.test(text)) return `${text}위`;
                return '참가';
            };
            const headers = ['대상','금액','상태'];
            const lines = [headers.join(',')].concat(
                payoutRows.map(p => [
                    escapeCsv(String(p.userName || p.teamName || '')),
                    Number(p.amount || 0),
                    toStatus(p.rank)
                ].join(','))
            );
            downloadCsv(lines.join('\n'), `challenge_${selectedChallengeId}_payouts.csv`);
            return;
        }
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
        <div className="mx-auto max-w-screen-xl px-4 py-6 md:px-6 md:py-10">
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-xl font-semibold text-neutral-900">챌린지/보상 테이블</h1>
                <button
                    className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-50"
                    onClick={() => navigate('/challenge')}
                >목록으로</button>
            </div>

            {/* 지급 결과 상단 블록 제거 (보상 테이블 안으로 합침) */}

            {/* Filters */}
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div className="flex flex-col gap-2 md:flex-row md:items-end">
                    <div className="flex flex-col">
                        <label className="mb-1 text-xs text-neutral-500">제목 검색</label>
                        <input
                            value={searchTitle}
                            onChange={e => { setSearchTitle(e.target.value); setPage(0); }}
                            placeholder="제목 입력"
                            className="h-9 w-64 rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-neutral-500"
                        />
                    </div>
                    <div className="flex flex-col md:ml-3">
                        <label className="mb-1 text-xs text-neutral-500">타입</label>
                        <select
                            value={filterType}
                            onChange={e => { setPage(0); setFilterType((e.target.value || '') as any); }}
                            className="h-9 w-36 rounded-md border border-neutral-300 px-2 text-sm"
                        >
                            <option value="">전체</option>
                            <option value="CODE">CODE</option>
                            <option value="PORTFOLIO">PORTFOLIO</option>
                        </select>
                    </div>
                    <div className="flex flex-col md:ml-3">
                        <label className="mb-1 text-xs text-neutral-500">상태</label>
                        <select
                            value={filterStatus}
                            onChange={e => { setPage(0); setFilterStatus((e.target.value || '') as any); }}
                            className="h-9 w-40 rounded-md border border-neutral-300 px-2 text-sm"
                        >
                            <option value="">전체</option>
                            <option value="DRAFT">DRAFT</option>
                            <option value="OPEN">OPEN</option>
                            <option value="CLOSED">CLOSED</option>
                            <option value="VOTING">VOTING</option>
                            <option value="ENDED">ENDED</option>
                        </select>
                    </div>
                    <div className="flex flex-col md:ml-3">
                        <label className="mb-1 text-xs text-neutral-500">정렬</label>
                        <select
                            value={sort}
                            onChange={e => { setPage(0); setSort(e.target.value); }}
                            className="h-9 w-44 rounded-md border border-neutral-300 px-2 text-sm"
                        >
                            <option value="-createdAt">생성 기준 최근</option>
                            <option value="createdAt">생성 기준 오래된</option>
                            <option value="-startAt">시작일 내림차순</option>
                            <option value="startAt">시작일 오름차순</option>
                            <option value="-endAt">마감일 내림차순</option>
                            <option value="endAt">마감일 오름차순</option>
                            <option value="-id">ID 내림차순</option>
                            <option value="id">ID 오름차순</option>
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportChallengesCsv}
                        className="h-9 rounded-md border border-neutral-300 px-3 text-sm hover:bg-neutral-50"
                    >CSV 익스포트</button>
                    <button
                        className="h-9 rounded-md bg-black px-3 text-sm text-white"
                        onClick={() => navigate('/admin/challenges/new')}
                    >챌린지 생성</button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-700">
                            <th className="px-3 py-2 text-left">ID</th>
                            <th className="px-3 py-2 text-left">제목</th>
                            <th className="px-3 py-2 text-left">타입</th>
                            <th className="px-3 py-2 text-left">상태</th>
                            <th className="px-3 py-2 text-left">시작</th>
                            <th className="px-3 py-2 text-left">마감</th>
                            <th className="px-3 py-2 text-left">제출수</th>
                            <th className="px-3 py-2 text-left">투표수</th>
                            <th className="px-3 py-2 text-left">관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {adminLoading ? (
                            <tr><td className="px-3 py-3" colSpan={9}>불러오는 중...</td></tr>
                        ) : adminError ? (
                            <tr><td className="px-3 py-3 text-red-600" colSpan={9}>{adminError}</td></tr>
                        ) : filteredAdminRows.length === 0 ? (
                            <tr><td className="px-3 py-6 text-neutral-500" colSpan={9}>데이터가 없습니다.</td></tr>
                        ) : (
                            filteredAdminRows.map((item) => (
                                <tr key={item.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                                    <td className="px-3 py-2">{item.id}</td>
                                    <td className="px-3 py-2 max-w-[380px] truncate" title={item.title}>{item.title}</td>
                                    <td className="px-3 py-2">{item.type}</td>
                                    <td className="px-3 py-2">
                                        <span className="inline-flex items-center rounded-md border border-neutral-200 px-2 py-[2px] text-[12px]">{item.status}</span>
                                    </td>
                                    <td className="px-3 py-2">{new Date(item.startAt).toLocaleString()}</td>
                                    <td className="px-3 py-2">{new Date(item.endAt).toLocaleString()}</td>
                                    <td className="px-3 py-2">{item.submissionCount}</td>
                                    <td className="px-3 py-2">{item.voteCount}</td>
                                    <td className="px-3 py-2">
                                        <div className="flex items-center gap-2 min-w-[130px]">
                                            <button
                                                className="inline-flex items-center rounded-md border border-neutral-300 px-2 py-[2px] text-[12px] whitespace-nowrap hover:bg-neutral-50"
                                                onClick={() => navigate(`/admin/challenges/${item.id}`)}
                                            >수정</button>
                                            <button
                                                className="inline-flex items-center rounded-md border border-neutral-300 px-2 py-[2px] text-[12px] whitespace-nowrap min-w-[70px] hover:bg-neutral-50"
                                                onClick={() => handleSelectChallengeForRewards(item)}
                                            >보상보기</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-3 flex items-center justify-between">
                <div className="text-sm text-neutral-600">총 {totalElementsText}건</div>
                <div className="flex items-center gap-2">
                    <button
                        className="rounded-md border border-neutral-300 px-2 py-1 text-sm disabled:opacity-50"
                        disabled={!hasPrev}
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                    >이전</button>
                    <span className="text-sm">{(currentPage ?? 0) + 1} / {effectiveTotalPages}</span>
                    <button
                        className="rounded-md border border-neutral-300 px-2 py-1 text-sm disabled:opacity-50"
                        disabled={!hasNext}
                        onClick={() => setPage(p => p + 1)}
                    >다음</button>
                    <select
                        value={size}
                        onChange={e => { setPage(0); setSize(parseInt(e.target.value, 10)); }}
                        className="ml-2 h-8 rounded-md border border-neutral-300 px-2 text-sm"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                        <option value={20}>20</option>
                        <option value={25}>25</option>
                        <option value={30}>30</option>
                    </select>
                </div>
            </div>

            {/* Rewards Table (지급 결과가 있으면 그 내용을 보상 테이블 안에서 표시) */}
            <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                    <div className="text-[15px] font-medium text-neutral-900">
                        기본 보상 {selectedChallengeId ? (
                            <span className="text-neutral-600 text-sm"> - ID {selectedChallengeId} ({selectedChallengeTitle})</span>
                        ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExportRewardsCsv}
                            disabled={!selectedChallengeId || (rewardsRows.length === 0 && payoutRows.length === 0)}
                            className="h-9 rounded-md border border-neutral-300 px-3 text-sm disabled:opacity-50 hover:enabled:bg-neutral-50"
                        >CSV 익스포트</button>
                        {/* 상단에선 커스텀 지급 UI를 표시하지 않음 (커스텀 보상 섹션으로 이동) */}
                    </div>
                </div>
                {selectedChallengeId == null ? (
                    <div className="text-sm text-neutral-600">상단 테이블에서 챌린지를 선택해 보상 구성을 확인하세요.</div>
                ) : rewardsLoading ? (
                    <div className="text-sm">불러오는 중...</div>
                ) : rewardsError ? (
                    <div className="text-sm text-red-600">{rewardsError}</div>
                ) : (rewardsRows.length === 0 && payoutRows.length === 0) ? (
                    <div className="text-sm text-neutral-600">표시할 보상 항목이 없습니다.</div>
                ) : (
                    <div className="overflow-auto">
                        <table className="min-w-[480px] text-sm">
                            <thead>
                                {payoutRows.length > 0 ? (
                                    <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-700">
                                        <th className="px-3 py-2 text-left">순위</th>
                                        <th className="px-3 py-2 text-left">크레딧</th>
                                        <th className="px-3 py-2 text-left">유저/팀</th>
                                    </tr>
                                ) : (
                                    <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-700">
                                        <th className="px-3 py-2 text-left">순위</th>
                                        <th className="px-3 py-2 text-left">크레딧</th>
                                        <th className="px-3 py-2 text-left">KRW</th>
                                        <th className="px-3 py-2 text-left">비고</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody>
                                {payoutRows.length > 0 ? (
                                    payoutRows.map((p, i) => (
                                        <tr key={i} className="border-b border-neutral-100">
                                            <td className="px-3 py-2">{p.rank ?? '-'}</td>
                                            <td className="px-3 py-2">{Number(p.amount || 0).toLocaleString()}</td>
                                            <td className="px-3 py-2">{p.userName || p.teamName || '-'}</td>
                                        </tr>
                                    ))
                                ) : (
                                    rewardsRows.map((r, idx) => (
                                        <tr key={idx} className="border-b border-neutral-100">
                                            <td className="px-3 py-2">{r.rank}</td>
                                            <td className="px-3 py-2">{r.credit}</td>
                                            <td className="px-3 py-2">{r.krw || '-'}</td>
                                            <td className="px-3 py-2 max-w-[520px] truncate" title={String(r.note ?? '')}>{r.note ?? ''}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        {payoutRows.length > 0 && (
                            <div className="mt-2 text-xs text-neutral-500">지급 결과: 투표 종료 후 기본 보상 규칙에 따라 자동 지급된 크레딧 내역입니다.</div>
                        )}
                    </div>
                )}
            </div>
            {/* 커스텀 보상 섹션: 보상보기 선택 시 동일한 영역에 하단 테이블로 표시 */}
            {selectedChallengeId != null && (
                <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                    <div className="mb-2 flex items-center justify-between">
                        <div className="text-[15px] font-medium text-neutral-900">커스텀 보상</div>
                        {/* 커스텀 지급 네모박스 트리거 */}
                        <div className="flex items-center gap-2">
                            <button
                                className="h-9 rounded-md border border-neutral-300 px-3 text-sm"
                                onClick={() => setShowCustomBox(true)}
                            >커스텀 지급</button>
                        </div>
                    </div>

                    {/* 커스텀 지급 네모박스 */}
                    {showCustomBox && (
                        <div className="mb-4 grid gap-3 md:grid-cols-2">
                            <div className="flex flex-col gap-2 p-3 border border-neutral-300 rounded-md bg-neutral-50 min-w-[320px]">
                                <div className="text-sm font-medium text-neutral-900">커스텀 지급</div>
                                <div className="grid grid-cols-2 gap-2">
                                    <label className="text-xs text-neutral-500">userId</label>
                                    <input className="h-8 rounded-md border border-neutral-300 px-2 text-sm" value={customUserId} onChange={e=>setCustomUserId(e.target.value)} placeholder="예) 30" />
                                    <label className="text-xs text-neutral-500">amount</label>
                                    <input className="h-8 rounded-md border border-neutral-300 px-2 text-sm" value={customAmount} onChange={e=>setCustomAmount(e.target.value)} placeholder="예) 2500" />
                                    <label className="text-xs text-neutral-500">rank(선택)</label>
                                    <input className="h-8 rounded-md border border-neutral-300 px-2 text-sm" value={customRank} onChange={e=>setCustomRank(e.target.value)} placeholder="숫자 또는 공란" />
                                    <label className="text-xs text-neutral-500">memo(선택)</label>
                                    <input className="h-8 rounded-md border border-neutral-300 px-2 text-sm" value={customMemo} onChange={e=>setCustomMemo(e.target.value)} placeholder="사유/메모" />
                                    <label className="text-xs text-neutral-500">reason(선택)</label>
                                    <input className="h-8 rounded-md border border-neutral-300 px-2 text-sm" value={customReason} onChange={e=>setCustomReason(e.target.value)} placeholder="REWARD_CUSTOM" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        className="h-8 rounded-md bg-black px-3 text-sm text-white disabled:opacity-50"
                                        disabled={customLoading || !customUserId.trim() || !customAmount.trim()}
                                        onClick={async ()=>{
                                            if (!selectedChallengeId) return;
                                            setCustomLoading(true);
                                            setCustomMsg("");
                                            try {
                                                const payload:any = {
                                                    userId: Number(customUserId),
                                                    amount: Number(customAmount),
                                                };
                                                if (customRank.trim()) payload.rank = Number(customRank);
                                                if (customMemo.trim()) payload.memo = customMemo.trim();
                                                if (customReason.trim()) payload.reason = customReason.trim();
                                                const key = (typeof crypto !== 'undefined' && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random()}`;
                                                await adminCustomPayout(selectedChallengeId, payload, key);
                                                setCustomMsg("지급 완료");
                                                setCustomHistory(h => [
                                                    { challengeId: selectedChallengeId, at: new Date().toISOString(), userId: payload.userId, amount: payload.amount, rank: payload.rank, memo: payload.memo, reason: payload.reason },
                                                    ...h
                                                ].slice(0, 50));
                                                // 지급 성공 시 폼 닫기
                                                setShowCustomBox(false);
                                            } catch (e:any) {
                                                setCustomMsg("지급 실패: " + (e?.response?.data?.message || e?.message || '오류'));
                                            } finally {
                                                setCustomLoading(false);
                                            }
                                        }}
                                    >{customLoading ? '지급 중...' : '지급하기'}</button>
                                    <button
                                        className="h-8 rounded-md border border-neutral-300 px-3 text-sm"
                                        onClick={()=>{ setShowCustomBox(false); }}
                                    >닫기</button>
                                    {customMsg && (
                                        <span className="text-xs text-neutral-600">{customMsg}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 커스텀 지급 내역 테이블 */}
                    <div className="overflow-auto">
                        {customRowsForSelected.length === 0 ? (
                            <div className="text-sm text-neutral-600">커스텀 지급 내역이 없습니다.</div>
                        ) : (
                            <>
                                <table className="min-w-[520px] text-sm">
                                    <thead>
                                        <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-700">
                                            <th className="px-3 py-2 text-left">시간</th>
                                            <th className="px-3 py-2 text-left">userId</th>
                                            <th className="px-3 py-2 text-left">크레딧</th>
                                            <th className="px-3 py-2 text-left">rank</th>
                                            <th className="px-3 py-2 text-left">memo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {customRowsForSelected.map((r, idx) => (
                                            <tr key={idx} className="border-b border-neutral-100">
                                                <td className="px-3 py-2 whitespace-nowrap">{new Date(r.at).toLocaleString()}</td>
                                                <td className="px-3 py-2">{r.userId}</td>
                                                <td className="px-3 py-2">{Number(r.amount || 0).toLocaleString()}</td>
                                                <td className="px-3 py-2">{r.rank ?? '-'}</td>
                                                <td className="px-3 py-2 max-w-[520px] truncate" title={String(r.memo ?? '')}>{r.memo ?? '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="mt-2 text-xs text-neutral-500">지급 결과: 운영자가 특별 이벤트/보너스에 따라 지급된 크레딧 내역입니다.</div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}


