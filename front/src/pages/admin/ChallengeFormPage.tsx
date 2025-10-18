import React from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { createChallenge, updateChallenge, type ChallengeUpsertRequest, fetchChallengeDetail, changeChallengeStatus, type ChallengeStatus, deleteChallenge, adminFetchChallenges } from "../../api/challengeApi";
import { fetchMonthlyByYm, fetchMonthlyChallenge } from "../../api/monthlyChallenge";
import { fetchWeeklyByKey, fetchWeeklyLatest } from "../../api/weeklyChallenge";
import SectionCard from "../../components/challenge/common/SectionCard";
import DateTimeField from "../../components/common/DateTimeField";

type Mode = "create" | "edit";

function toLocalInputValue(iso?: string): string {
    if (!iso) return "";
    // 허용: "YYYY-MM-DDTHH:mm:ss" | "YYYY-MM-DD HH:mm:ss" | ISO 문자열
    const norm = typeof iso === "string" ? iso.replace(" ", "T") : iso;
    const d = new Date(norm as any);
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function toLocalIsoNoZ(local: string): string | null {
    if (!local) return null;
    // 입력은 로컬 시각(YYYY-MM-DDTHH:mm). OffsetDateTime 역직렬화를 위해 ISO8601(Z)으로 변환
    const m = local.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/);
    const src = m ? `${m[1]}T${m[2]}:00` : local;
    const d = new Date(src);
        if (isNaN(d.getTime())) return null;
    return d.toISOString(); // 예: 2025-10-17T12:34:00.000Z
}

function validateDates(params: { start?: string; end?: string; voteStart?: string; voteEnd?: string }): string | null {
    const s = params.start ? new Date(params.start) : null;
    const e = params.end ? new Date(params.end) : null;
    const vs = params.voteStart ? new Date(params.voteStart) : null;
    const ve = params.voteEnd ? new Date(params.voteEnd) : null;
    if (s && e && !(s.getTime() < e.getTime())) return "시작일은 마감일보다 이전이어야 합니다.";
    if (e && vs && !(e.getTime() <= vs.getTime())) return "마감일은 투표 시작일보다 같거나 이전이어야 합니다.";
    if (vs && ve && !(vs.getTime() <= ve.getTime())) return "투표 시작일은 투표 마감일보다 같거나 이전이어야 합니다.";
    return null;
}

export default function ChallengeFormPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams<{ id?: string }>();
    const urlEditMode: Mode = id ? "edit" : "create";
    const isTypeEditRoute = React.useMemo(() => {
        const p = location?.pathname || "";
        return /\/admin\/challenge\/(code|portfolio)\/.+\/edit$/.test(p);
    }, [location?.pathname]);

    const [type, setType] = React.useState<"CODE" | "PORTFOLIO">("CODE");
    const [title, setTitle] = React.useState("");
    const [summary, setSummary] = React.useState("");
    const [ym, setYm] = React.useState("");            // YYYY-MM (PORTFOLIO)
    const [week, setWeek] = React.useState("");        // YYYYWww (CODE)
    const [must, setMust] = React.useState<string>(""); // comma or newline-separated, UI 입력값
    const [md, setMd] = React.useState("");
    const [startAt, setStartAt] = React.useState("");
    const [endAt, setEndAt] = React.useState("");
    const [voteStartAt, setVoteStartAt] = React.useState("");
    const [voteEndAt, setVoteEndAt] = React.useState("");
    const [error, setError] = React.useState<string | null>(null);
    const [saving, setSaving] = React.useState(false);
    const [statusConfirm, setStatusConfirm] = React.useState<{ open: boolean; next?: ChallengeStatus }>(() => ({ open: false }));
    const [currentStatus, setCurrentStatus] = React.useState<ChallengeStatus>("DRAFT");
    const [detailLoaded, setDetailLoaded] = React.useState<boolean>(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
    const [listDeleteConfirm, setListDeleteConfirm] = React.useState<{ open: boolean; id?: number; title?: string }>({ open: false });
    const [saveConfirm, setSaveConfirm] = React.useState<{ open: boolean; payload?: ChallengeUpsertRequest }>({ open: false });
    const aiOverlayTriedRef = React.useRef(false);
    // 관리 드롭다운: CREATE | MANAGE (수정/삭제)
    const [viewMode, setViewMode] = React.useState<"CREATE" | "MANAGE">(urlEditMode === "edit" ? "MANAGE" : "CREATE");
    // 선택된 편집 대상(없으면 생성)
    const [editingId, setEditingId] = React.useState<number | null>(id ? Number(id) : null);
    // 목록 패널 상태
    const [list, setList] = React.useState<Array<{ id:number; title:string; type?: string; status?: string }>>([]);
    const [listLoading, setListLoading] = React.useState(false);
    const [showFullList, setShowFullList] = React.useState<boolean>(true);
    const [selectedTitle, setSelectedTitle] = React.useState<string>("");
    const manageInitRef = React.useRef<boolean>(false);

    const clearForm = React.useCallback(() => {
        setEditingId(null);
        setType("CODE");
        setTitle("");
        setSummary("");
        setYm("");
        setWeek("");
        setMust("");
        setMd("");
        setStartAt("");
        setEndAt("");
        setVoteStartAt("");
        setVoteEndAt("");
        setCurrentStatus("DRAFT");
    }, []);

    React.useEffect(() => {
        if (urlEditMode === "edit" && id) {
            (async () => {
                try {
                    setEditingId(Number(id));
                    const data = await fetchChallengeDetail(Number(id));
                    // 타입 변형 대응
                    const tRaw = (data?.type || data?.challengeType || data?.kind || "CODE") as string;
                    const t = String(tRaw).toUpperCase();
                    setType(t.includes("PORT") ? "PORTFOLIO" : "CODE");

                    const loadedTitle = data?.title || data?.name || "";
                    setTitle(loadedTitle);
                    setSummary(data?.summary || data?.desc || data?.description || "");
                    if (data?.status) setCurrentStatus(data.status as ChallengeStatus);

                    const startRaw = data?.startAt || data?.start_at || data?.startDate || data?.openAt || data?.open_at;
                    const endRaw = data?.endAt || data?.end_at || data?.endDate || data?.closeAt || data?.close_at;
                    const vStartRaw = data?.voteStartAt || data?.vote_start_at || data?.voteStartDate;
                    const vEndRaw = data?.voteEndAt || data?.vote_end_at || data?.voteEndDate;
                    setStartAt(toLocalInputValue(startRaw));
                    setEndAt(toLocalInputValue(endRaw));
                    setVoteStartAt(toLocalInputValue(vStartRaw));
                    setVoteEndAt(toLocalInputValue(vEndRaw));

                    // ruleJson 역매핑(있으면) + AI 원문으로 보강 로드
                    const rjRaw = (data?.ruleJson || data?.rule || data?.rules || data?.meta || {}) as any;
                    let rj: any = {};
                    try {
                        if (typeof rjRaw === "string") rj = JSON.parse(rjRaw);
                        else if (rjRaw && typeof rjRaw === "object") rj = rjRaw;
                        else rj = {};
                    } catch { rj = {}; }
                    const ymCandidate = rj.ym || rj.month || "";
                    const weekCandidate = rj.week || rj.weekKey || "";
                    setYm(ymCandidate);
                    setWeek(weekCandidate);

                    let mustArr: string[] = Array.isArray(rj.must)
                        ? rj.must
                        : Array.isArray(rj.must_have)
                        ? rj.must_have
                        : [];
                    let mdText = rj.md || rj.markdown || "";
                    const summaryText = (rj.summary || data?.summary || "");

                    try {
                        if (t.includes("PORT")) {
                            // 편집 화면에서는 백엔드 값 우선. YM만 비어있을 때 보조로 채움
                            let monthly: any | null = null;
                            const deriveYm = () => {
                                const s = toLocalInputValue(startRaw) || toLocalInputValue(endRaw);
                                if (!s) return "";
                                const m = s.match(/^(\d{4}-\d{2})/);
                                return m ? m[1] : "";
                            };
                            const ymKey = ymCandidate || deriveYm();
                            if (ymKey) monthly = await fetchMonthlyByYm(ymKey);
                            else monthly = await fetchMonthlyChallenge();
                            const d = monthly as any;
                            if (!ym || ym.trim().length === 0) setYm(d?.ym || ymKey || "");
                        }
                        if (t.includes("CODE")) {
                            // 편집 화면에서는 백엔드 값 우선. 주차 키만 비어있을 때 보조로 채움
                            let weekly: any | null = null;
                            if (weekCandidate) weekly = await fetchWeeklyByKey(weekCandidate);
                            else weekly = await fetchWeeklyLatest();
                            const d = weekly as any; // parsed WeeklyChallengeData
                            if (!weekCandidate && d?.week) setWeek(d.week);
                        }
                    } catch (e) {
                        // AI 호출 실패 시 무시하고 백엔드 데이터만 사용
                    }

                    if (typeof summaryText === 'string') setSummary(summaryText);
                    else if (data?.summary) setSummary(data.summary);
                    if (mustArr.length > 0) setMust(mustArr.join("\n"));
                    setMd(mdText);
                    if (isTypeEditRoute) {
                        setSelectedTitle(loadedTitle);
                        setShowFullList(false);
                    }
                } catch (e) {
                    console.error("Failed to load challenge", e);
                } finally { setDetailLoaded(true); }
            })();
        }
    }, [urlEditMode, id, isTypeEditRoute]);

    // 드롭다운 전환 시 동작
    React.useEffect(() => {
        // 단일 수정 경로에서는 뷰모드 전환에 의해 값이 초기화되면 안 된다
        if (urlEditMode === "edit" && !isTypeEditRoute) {
            return;
        }
        if (viewMode === "CREATE") {
            // 값 초기화 (완전 초기 상태)
            setEditingId(null);
            setTitle(""); setSummary(""); setYm(""); setWeek(""); setMust(""); setMd(""); setStartAt(""); setEndAt(""); setVoteStartAt(""); setVoteEndAt("");
            setCurrentStatus("DRAFT");
            setSelectedTitle("");
            setShowFullList(true);
        } else {
            // MANAGE 모드: 목록 로드
            (async () => {
                setListLoading(true);
                try {
                    const resp = await adminFetchChallenges({ page:0, size:50, sort:'-id' });
                    setList(resp.content.map(c => ({ id:c.id, title:c.title, type: ((c as any).type || (c as any).challengeType), status: (c as any).status })));
                } finally { setListLoading(false); }
                if (isTypeEditRoute && !manageInitRef.current) {
                    // 유형별 수정 경로에서 관리 모드로 들어온 첫 렌더: 목록은 접고 현재 로드된 값 유지(편집 상태 유지)
                    setShowFullList(false);
                    manageInitRef.current = true;
                } else {
                    setShowFullList(true);
                    setSelectedTitle("");
                    // 편집 경로에서는 폼 값을 유지해야 함
                    if (urlEditMode !== "edit") {
                        clearForm();
                    }
                }
            })();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewMode, isTypeEditRoute, urlEditMode]);

    async function refetchStatusUntil(idNum: number, expected: ChallengeStatus, maxTry: number = 3): Promise<ChallengeStatus | null> {
        for (let i = 0; i < maxTry; i++) {
            try {
                const fresh = await fetchChallengeDetail(idNum);
                const st = (fresh?.status || "") as ChallengeStatus;
                if (st && st === expected) return st;
                // 잠깐의 지연을 고려해 대기 후 재시도
                await new Promise(res => setTimeout(res, 250));
            } catch {}
        }
        return null;
    }

    const onSubmit: React.FormEventHandler = async (e) => {
        e.preventDefault();
        if (saving) return;

        const isoStart = toLocalIsoNoZ(startAt);
        const isoEnd = toLocalIsoNoZ(endAt);
        const isoVoteStart = toLocalIsoNoZ(voteStartAt);
        const isoVoteEnd = toLocalIsoNoZ(voteEndAt);

        const err = validateDates({ start: isoStart || undefined, end: isoEnd || undefined, voteStart: isoVoteStart || undefined, voteEnd: isoVoteEnd || undefined });
        if (err) { setError(err); return; }

        // 유효성: title(공백 제외 1자+), summary(빈문자열 불가)
        const titleTrim = title.trim();
        const summaryKeep = summary; // 개행 허용, 공백만 있으면 에러
        if (titleTrim.length === 0) { setError("제목을 입력하세요."); return; }
        if (summaryKeep.length === 0) { setError("요약은 빈 문자열일 수 없습니다."); return; }

        // must 파싱 (빈 배열 허용)
        const mustArray = must
            .split(/\r?\n|,/)
            .map(s => s.trim())
            .filter(s => s.length > 0);

        // 키 형식 검증
        if (type === "PORTFOLIO" && ym && !/^\d{4}-\d{2}$/.test(ym)) { setError("YM 형식은 YYYY-MM 이어야 합니다."); return; }
        if (type === "CODE" && week && !/^\d{4}W\d{2}$/.test(week)) { setError("Week 형식은 YYYYWww 이어야 합니다."); return; }

        const payloadBase: ChallengeUpsertRequest = {
            type,
            title: titleTrim,
            summary: summaryKeep,
            startAt: isoStart!,
            endAt: isoEnd!,
            voteStartAt: isoVoteStart || undefined,
            voteEndAt: isoVoteEnd || undefined,
            ruleJson: {
                ym: type === "PORTFOLIO" ? (ym || undefined) : undefined,
                week: type === "CODE" ? (week || undefined) : undefined,
                must: mustArray,
                md: md,
                summary: summaryKeep,
            }
        };
        const payload: ChallengeUpsertRequest = (editingId !== null)
            ? payloadBase // 편집에서는 status를 보내지 않음(서버 상태 유지)
            : { ...payloadBase, status: "DRAFT" };
        if (!payload.title || !payload.startAt || !payload.endAt) {
            setError("제목, 시작일, 마감일은 필수입니다.");
            return;
        }

        // 저장 전 모달 열기
        (window as any).scrollTo?.(0,0);
        setSaveConfirm({ open: true, payload });
    };

    // 생성 화면은 기본값이 비어 있어야 하므로 AI 오버레이를 수행하지 않습니다.

    const onDateChange = (setter: (v: string) => void) => (v: string) => {
        setter(v);
        const err = validateDates({ start: toLocalIsoNoZ(startAt) || undefined, end: toLocalIsoNoZ(endAt) || undefined, voteStart: toLocalIsoNoZ(voteStartAt) || undefined, voteEnd: toLocalIsoNoZ(voteEndAt) || undefined });
        setError(err);
    };

    return (
        <div className="mx-auto max-w-screen-xl px-4 py-6 md:px-6 md:py-10">
            <SectionCard title={viewMode === "MANAGE" ? "챌린지 수정/삭제" : "챌린지 생성"} className="!px-5 !py-5">
            {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-[13.5px]" role="alert">{error}</div>
            )}
            {/* 드롭다운: 생성 / 수정·삭제 (생성 페이지에서만 노출) */}
            {(urlEditMode !== "edit" || isTypeEditRoute) && (
                <div className="mb-3">
                    <label className="mr-2 text-[13px] text-neutral-700">작업</label>
                    <select value={viewMode} onChange={(e)=> {
                        const nm = e.target.value as "CREATE" | "MANAGE";
                        // 먼저 폼을 깨끗이 초기화하여 전환 중 기존 값이 잠깐 보이지 않도록 함
                        clearForm();
                        if (nm === "MANAGE") {
                            // 관리 모드 시작 시 선택 타이틀 유지 여부는 경로에 따라 달라짐 (아래 useEffect에서 처리)
                            setViewMode("MANAGE");
                        } else {
                            setSelectedTitle("");
                            setShowFullList(true);
                            setViewMode("CREATE");
                        }
                    }} className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-[12.5px]">
                        <option value="CREATE">챌린지 생성</option>
                        <option value="MANAGE">챌린지 수정/삭제</option>
                    </select>
                </div>
            )}
            {/* 상태 전환 버튼 (편집 대상 선택 시 표시) – 목록 패널 아래로 이동 */}
            {/* 저장 확인 모달 */}
            {saveConfirm.open && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-sm rounded-lg bg-white p-5">
                        <div className="mb-3 text-[15px] font-bold">저장 확인</div>
                        <div className="mb-4 text-[13.5px]">현재 입력하신 내용으로 {editingId !== null || urlEditMode === 'edit' ? '수정' : '생성'}을 진행할까요?</div>
                        <div className="flex justify-end gap-2">
                            <button className="rounded-md border px-3 py-1.5 text-[13px]" onClick={()=> setSaveConfirm({ open:false })}>취소</button>
                            <button className="rounded-md bg-emerald-600 px-3 py-1.5 text-[13px] font-semibold text-white" onClick={async()=>{
                                const payload = saveConfirm.payload!;
                                try {
                                    setSaving(true);
                                    const effectiveEditId = editingId !== null ? editingId : (urlEditMode === 'edit' && id ? Number(id) : null);
                                    if (effectiveEditId !== null) {
                                        await updateChallenge(effectiveEditId, payload);
                                        setSaveConfirm({ open:false });
                                        // 상태 초기화하여 이전 선택 항목 내용이 남지 않도록 처리
                                        clearForm();
                                        setSelectedTitle("");
                                        setShowFullList(true);
                                        // 챌린지 메인으로 이동
                                        navigate('/challenge');
                                        return;
                                    }
                                    const { id: newId } = await createChallenge(payload);
                                    setSaveConfirm({ open:false });
                                    clearForm();
                                    setSelectedTitle("");
                                    setShowFullList(true);
                                    // 생성 후에도 동일하게 챌린지 메인으로 이동
                                    navigate('/challenge');
                                } catch (ex:any) {
                                    const msg = ex?.response?.data?.message || ex?.message || '서버 오류가 발생했습니다.';
                                    console.error('[CHALLENGE UPSERT] failed:', ex);
                                    setError(msg);
                                    setSaveConfirm({ open:false });
                                } finally { setSaving(false); }
                            }}>확인</button>
                        </div>
                    </div>
                </div>
            )}
            {/* 관리 목록 (생성 페이지의 수정/삭제 모드에서만 표시) */}
            {(urlEditMode !== "edit" || isTypeEditRoute) && viewMode === "MANAGE" && (
                <div className="mb-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    {showFullList ? (
                        <>
                            <div className="mb-2 flex items-center justify-between">
                                <div className="text-[14px] font-semibold">챌린지 전체 목록 보기</div>
                                <button className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-[12px] hover:bg-neutral-50" onClick={()=> setShowFullList(false)}>접기</button>
                            </div>
                            {listLoading ? (
                                <div className="text-[13px] text-neutral-600">불러오는 중...</div>
                            ) : (
                                <ul className="max-h-56 overflow-auto divide-y">
                            {list.map(it => (
                                <li key={it.id} className="flex items-center justify-between py-2">
                                            <div className="flex items-center gap-2">
                                                <div className="text-[13px]">#{it.id} {it.title}</div>
                                                {it.type && (
                                                    <span className="rounded-full border border-neutral-300 bg-white px-2 py-0.5 text-[11px] text-neutral-700">{String(it.type).toUpperCase().includes('PORT') ? 'PORTFOLIO' : 'CODE'}</span>
                                                )}
                                                {it.status && (
                                                    <span className="rounded-full border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-700">{it.status}</span>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <button className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-[12px] hover:bg-neutral-50" onClick={() => {
                                                    const kind = String(it.type || 'CODE').toUpperCase().includes('PORT') ? 'portfolio' : 'code';
                                                    navigate(`/admin/challenge/${kind}/${it.id}/edit`);
                                                }}>선택</button>
                                                <button className="rounded-full border border-red-300 bg-white px-3 py-1 text-[12px] text-red-600 hover:bg-red-50" onClick={()=> setListDeleteConfirm({ open: true, id: it.id, title: it.title })}>삭제</button>
                                            </div>
                                        </li>
                                    ))}
                                    {list.length===0 && <li className="py-3 text-[13px] text-neutral-500">데이터가 없습니다.</li>}
                                </ul>
                            )}
                        </>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[13px]">
                                <span className="font-semibold">선택한 챌린지</span>:
                                <span>{selectedTitle}</span>
                            </div>
                            <button className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-[12px] hover:bg-neutral-50" onClick={()=> setShowFullList(true)}>목록 펼치기</button>
                        </div>
                    )}
                </div>
            )}
            {editingId !== null && detailLoaded && (
                <div className="mb-3 flex flex-wrap gap-2 items-center">
                    {(() => {
                        // 상태 목록: CODE = DRAFT/OPEN/CLOSED, PORTFOLIO = DRAFT/OPEN/CLOSED/VOTING/ENDED
                        const options: ChallengeStatus[] = (
                            type === "CODE"
                                ? ["DRAFT", "OPEN", "CLOSED", "ENDED"]
                                : ["DRAFT", "OPEN", "CLOSED", "VOTING", "ENDED"]
                        );
                        return options.map((opt) => {
                            const active = currentStatus === opt;
                            const cls = active
                                ? "rounded-full border border-emerald-500 text-emerald-700 bg-white px-3 py-1.5 text-[12.5px] ring-2 ring-emerald-300"
                                : "rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-[12.5px] hover:bg-neutral-50";
                            return (
                                <button
                                    key={opt}
                                    type="button"
                                    className={cls}
                                    onClick={() => {
                                        if (opt !== currentStatus) setStatusConfirm({ open: true, next: opt });
                                    }}
                                >
                                    {opt}
                                </button>
                            );
                        });
                    })()}
                    <button type="button" className="ml-auto rounded-full border border-red-300 bg-white px-3 py-1.5 text-[12.5px] text-red-600 hover:bg-red-50 w-[80px]" onClick={() => setDeleteConfirmOpen(true)}>삭제</button>
                </div>
            )}
            <form onSubmit={onSubmit} className="space-y-6 text-[13.5px]">
                <div>
                    <label className="block mb-1 text-[14px] font-bold text-neutral-900">타입</label>
                    <select value={type} onChange={(e) => setType(e.target.value as any)} disabled={urlEditMode === "edit" || editingId !== null} className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 outline-none focus:border-emerald-500 disabled:bg-neutral-100 disabled:text-neutral-500">
                        <option value="CODE">코드</option>
                        <option value="PORTFOLIO">포트폴리오</option>
                    </select>
                </div>
                <div>
                    <label className="block mb-1 text-[14px] font-bold text-neutral-900">제목</label>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 outline-none focus:border-emerald-500" placeholder="제목" />
                </div>
                <div>
                    <label className="block mb-1 text-[14px] font-bold text-neutral-900">요약</label>
                    <textarea value={summary} onChange={(e) => setSummary(e.target.value)} className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 outline-none focus:border-emerald-500" rows={4} placeholder="요약" />
                </div>
                {type === "PORTFOLIO" ? (
                    <div>
                        <label className="block mb-1 text-[14px] font-bold text-neutral-900">월(YM, 예: 2025-10)</label>
                        <input value={ym} onChange={(e) => setYm(e.target.value)} className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 outline-none focus:border-emerald-500" placeholder="예: 2025-10" />
                    </div>
                ) : (
                    <div>
                        <label className="block mb-1 text-[14px] font-bold text-neutral-900">주차(YYYYWww, 예: 2025W42)</label>
                        <input value={week} onChange={(e) => setWeek(e.target.value)} className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 outline-none focus:border-emerald-500" placeholder="예: 2025W42" />
                    </div>
                )}
                <div>
                    <label className="block mb-1 text-[14px] font-bold text-neutral-900">필수 요구사항(must) - 줄바꿈 또는 콤마로 구분</label>
                    <textarea value={must} onChange={(e) => setMust(e.target.value)} className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 outline-none focus:border-emerald-500" rows={4} placeholder="예: 항목1\n항목2" />
                </div>
                <div>
                    <label className="block mb-1 text-[14px] font-bold text-neutral-900">설명(Markdown 가능)</label>
                    <textarea value={md} onChange={(e) => setMd(e.target.value)} className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 outline-none focus:border-emerald-500" rows={6} placeholder="마크다운 본문 (선택)" />
                </div>
                {/* 일정: 한 줄에 화살표로 가독성 향상 */}
                <div>
                    <div className="mb-1 text-[14px] font-bold text-neutral-900">진행 기간</div>
                    <div className="flex flex-col gap-2 md:flex-row md:items-center">
                        <DateTimeField value={startAt} onChange={(v) => onDateChange(setStartAt)(v)} className="flex-1" />
                        <span className="hidden select-none px-2 text-neutral-500 md:block">→</span>
                        <DateTimeField value={endAt} onChange={(v) => onDateChange(setEndAt)(v)} className="flex-1" />
                    </div>
                </div>
                {type === "PORTFOLIO" && (
                    <div>
                        <div className="mb-1 text-[14px] font-bold text-neutral-900">투표 기간</div>
                        <div className="flex flex-col gap-2 md:flex-row md:items-center">
                            <DateTimeField value={voteStartAt} onChange={(v) => onDateChange(setVoteStartAt)(v)} className="flex-1" />
                            <span className="hidden select-none px-2 text-neutral-500 md:block">→</span>
                            <DateTimeField value={voteEndAt} onChange={(v) => onDateChange(setVoteEndAt)(v)} className="flex-1" />
                        </div>
                    </div>
                )}
                <div className="flex gap-3 justify-end">
                    <button type="button" onClick={() => navigate(-1)} className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-[13px] hover:bg-neutral-50">취소</button>
                    <button type="submit" disabled={saving} className="rounded-full bg-emerald-600 px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60">{saving ? "저장 중..." : "저장"}</button>
                </div>
            </form>
            </SectionCard>
            {/* 상태 변경 확인 모달 */}
            {statusConfirm.open && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-sm rounded-lg bg-white p-5">
                        {(() => {
                            const from = currentStatus;
                            const to = statusConfirm.next as ChallengeStatus;
                            const title = (() => {
                                if (type === "CODE") {
                                    if (from === "DRAFT" && to === "OPEN") return "코드 챌린지 오픈";
                                    if (from === "OPEN" && to === "CLOSED") return "코드 챌린지 마감";
                                    if (to === "ENDED") return "코드 챌린지 종료";
                                } else {
                                    if (from === "DRAFT" && to === "OPEN") return "포트폴리오 챌린지 오픈";
                                    if (from === "OPEN" && to === "CLOSED") return "포트폴리오 제출 마감";
                                    if (from === "CLOSED" && to === "VOTING") return "포트폴리오 투표 시작";
                                    if (from === "VOTING" && to === "ENDED") return "포트폴리오 투표 마감";
                                }
                                return "상태 전환";
                            })();
                            const points: string[] = (() => {
                                if (type === "CODE") {
                                    if (from === "DRAFT" && to === "OPEN") return ["참여가 열립니다.", "사용자들이 코드를 제출할 수 있습니다."];
                                    if (from === "OPEN" && to === "CLOSED") return ["제출이 마감됩니다.", "결과 및 후속 조치는 별도 진행됩니다."];
                                    if (to === "ENDED") return ["챌린지를 종료합니다.", "이후에는 상태가 최종 종료로 유지됩니다."];
                                } else {
                                    if (from === "DRAFT" && to === "OPEN") return ["프로젝트 제출이 시작됩니다.", "제출 기간 내에만 등록 가능합니다."];
                                    if (from === "OPEN" && to === "CLOSED") return ["프로젝트 제출이 마감됩니다.", "투표 일정에 따라 다음 단계로 진행하세요."];
                                    if (from === "CLOSED" && to === "VOTING") return ["투표가 시작됩니다.", "설정된 투표 종료 시점까지 집계됩니다."];
                                    if (from === "VOTING" && to === "ENDED") return ["투표가 마감됩니다.", "결과 집계가 완료됩니다."];
                                }
                                return ["상태를 변경합니다."];
                            })();
                            return (
                                <>
                                    <div className="mb-3 text-[15px] font-bold">{title}</div>
                                    <ul className="mb-4 list-disc pl-5 text-[13.5px] leading-6 text-neutral-800">
                                        {points.map((p, i) => <li key={i}>{p}</li>)}
                                    </ul>
                                    <div className="mb-5 text-[13.5px]">정말로 이 챌린지 상태를 <b>{to}</b> 로 변경하시겠습니까?</div>
                                </>
                            );
                        })()}
                        <div className="flex justify-end gap-2">
                            <button className="rounded-md border px-3 py-1.5 text-[13px]" onClick={() => setStatusConfirm({ open: false })}>취소</button>
                            <button className="rounded-md bg-emerald-600 px-3 py-1.5 text-[13px] font-semibold text-white" onClick={async () => {
                                const effectiveId = (editingId !== null) ? editingId : (id ? Number(id) : null);
                                if (!effectiveId || !statusConfirm.next) { setStatusConfirm({ open: false }); return; }
                                const targetStatus = statusConfirm.next;
                                try {
                                    await changeChallengeStatus(effectiveId, targetStatus);
                                    // UI 즉시 반영
                                    setCurrentStatus(targetStatus);
                                    setStatusConfirm({ open: false });
                                    // 서버 반영이 늦는 경우를 위해 짧게 재확인
                                    const st = await refetchStatusUntil(effectiveId, targetStatus, 3);
                                    if (st) setCurrentStatus(st);
                                } catch (e) {
                                    console.error("status change failed", e);
                                    setStatusConfirm({ open: false });
                                    setError("상태 변경 중 오류가 발생했습니다.");
                                }
                            }}>변경</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 삭제 확인 모달 */}
            {deleteConfirmOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-sm rounded-lg bg-white p-5">
                        <div className="mb-3 text-[15px] font-bold text-red-600">챌린지 삭제</div>
                        <ul className="mb-4 list-disc pl-5 text-[13.5px] leading-6 text-neutral-800">
                            <li>삭제 후 되돌릴 수 없습니다.</li>
                            <li>관련 제출/투표 데이터에 영향이 있을 수 있습니다.</li>
                        </ul>
                        <div className="mb-5 text-[13.5px]">정말로 이 챌린지를 삭제하시겠습니까?</div>
                        <div className="flex justify-end gap-2">
                            <button className="rounded-md border px-3 py-1.5 text-[13px]" onClick={() => setDeleteConfirmOpen(false)}>취소</button>
                            <button className="rounded-md bg-red-600 px-3 py-1.5 text-[13px] font-semibold text-white" onClick={async () => {
                                if (!id) return;
                                try {
                                    await deleteChallenge(Number(id), { force: true });
                                    setDeleteConfirmOpen(false);
                                    navigate('/challenge');
                                } catch (e) {
                                    console.error('delete failed', e);
                                    setError('삭제 중 오류가 발생했습니다.');
                                }
                            }}>삭제</button>
                        </div>
                    </div>
                </div>
            )}
            {/* 목록 삭제 확인 모달 */}
            {listDeleteConfirm.open && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-sm rounded-lg bg-white p-5">
                        <div className="mb-3 text-[15px] font-bold text-red-600">챌린지 삭제</div>
                        <div className="mb-4 text-[13.5px]">#{listDeleteConfirm.id} {listDeleteConfirm.title} 항목을 삭제하시겠습니까?</div>
                        <div className="flex justify-end gap-2">
                            <button className="rounded-md border px-3 py-1.5 text-[13px]" onClick={()=> setListDeleteConfirm({ open:false })}>취소</button>
                            <button className="rounded-md bg-red-600 px-3 py-1.5 text-[13px] font-semibold text-white" onClick={async()=>{
                                if (!listDeleteConfirm.id) { setListDeleteConfirm({ open:false }); return; }
                                try {
                                    await deleteChallenge(listDeleteConfirm.id, { force: true });
                                    setList(list.filter(x=>x.id !== listDeleteConfirm.id));
                                    setListDeleteConfirm({ open:false });
                                } catch (e) {
                                    console.error('delete list item failed', e);
                                    setError('삭제 중 오류가 발생했습니다.');
                                    setListDeleteConfirm({ open:false });
                                }
                            }}>삭제</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


