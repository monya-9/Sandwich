import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createChallenge, updateChallenge, type ChallengeUpsertRequest, fetchChallengeDetail, changeChallengeStatus, type ChallengeStatus, deleteChallenge } from "../../api/challengeApi";
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
    const { id } = useParams<{ id?: string }>();
    const mode: Mode = id ? "edit" : "create";

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
    const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
    const aiOverlayTriedRef = React.useRef(false);

    React.useEffect(() => {
        if (mode === "edit" && id) {
            (async () => {
                try {
                    const data = await fetchChallengeDetail(Number(id));
                    // 타입 변형 대응
                    const tRaw = (data?.type || data?.challengeType || data?.kind || "CODE") as string;
                    const t = String(tRaw).toUpperCase();
                    setType(t.includes("PORT") ? "PORTFOLIO" : "CODE");

                    setTitle(data?.title || data?.name || "");
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
                    const summaryText = rj.summary || "";

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

                    if (summaryText) setSummary(summaryText);
                    if (mustArr.length > 0) setMust(mustArr.join("\n"));
                    setMd(mdText);
                } catch (e) {
                    console.error("Failed to load challenge", e);
                }
            })();
        }
    }, [mode, id]);

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

        const payload: ChallengeUpsertRequest = {
            type,
            title: titleTrim,
            summary: summaryKeep,
            status: (mode === "edit" ? currentStatus : "DRAFT"),
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
        if (!payload.title || !payload.startAt || !payload.endAt) {
            setError("제목, 시작일, 마감일은 필수입니다.");
            return;
        }

        try {
            setSaving(true);
            if (mode === "edit" && id) {
                // 수정은 단일 엔티티만 반영
                await updateChallenge(Number(id), payload);
                navigate(-1);
                return;
            }
            const { id: newId } = await createChallenge(payload);
            navigate(`/challenge/${type.toLowerCase()}/${newId}`);
            return;
        } catch (ex: any) {
            const msg = ex?.response?.data?.message || ex?.message || "서버 오류가 발생했습니다.";
            console.error("[CHALLENGE UPSERT] failed:", ex);
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    // 생성 화면은 기본값이 비어 있어야 하므로 AI 오버레이를 수행하지 않습니다.

    const onDateChange = (setter: (v: string) => void) => (v: string) => {
        setter(v);
        const err = validateDates({ start: toLocalIsoNoZ(startAt) || undefined, end: toLocalIsoNoZ(endAt) || undefined, voteStart: toLocalIsoNoZ(voteStartAt) || undefined, voteEnd: toLocalIsoNoZ(voteEndAt) || undefined });
        setError(err);
    };

    return (
        <div className="mx-auto max-w-screen-xl px-4 py-6 md:px-6 md:py-10">
            <SectionCard title={mode === "edit" ? "챌린지 수정" : "챌린지 생성"} className="!px-5 !py-5">
            {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-[13.5px]" role="alert">{error}</div>
            )}
            {/* 상태 전환 버튼 (수정 모드에서만 표시) */}
            {mode === "edit" && (
                <div className="mb-3 flex flex-wrap gap-2 items-center">
                    {(() => {
                        const options: ChallengeStatus[] =
                            type === "CODE" ? ["DRAFT", "OPEN", "ENDED"] : ["DRAFT", "OPEN", "ENDED", "VOTING"];
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
                    <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 outline-none focus:border-emerald-500">
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
                                    if (from === "OPEN" && to === "ENDED") return "코드 챌린지 마감";
                                } else {
                                    if (from === "DRAFT" && to === "OPEN") return "포트폴리오 챌린지 오픈";
                                    if (from === "OPEN" && to === "ENDED") return "포트폴리오 제출 마감";
                                    if (from === "ENDED" && to === "VOTING") return "포트폴리오 투표 시작";
                                }
                                return "상태 전환";
                            })();
                            const points: string[] = (() => {
                                if (type === "CODE") {
                                    if (from === "DRAFT" && to === "OPEN") return ["참여가 열립니다.", "사용자들이 코드를 제출할 수 있습니다."];
                                    if (from === "OPEN" && to === "ENDED") return ["제출이 마감됩니다.", "결과 및 후속 조치는 별도 진행됩니다."];
                                } else {
                                    if (from === "DRAFT" && to === "OPEN") return ["프로젝트 제출이 시작됩니다.", "제출 기간 내에만 등록 가능합니다."];
                                    if (from === "OPEN" && to === "ENDED") return ["프로젝트 제출이 마감됩니다.", "투표 일정은 설정된 기간에 따라 진행됩니다."];
                                    if (from === "ENDED" && to === "VOTING") return ["투표가 시작됩니다.", "설정된 투표 종료 시점까지 집계됩니다."];
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
                                if (!id || !statusConfirm.next) { setStatusConfirm({ open: false }); return; }
                                try {
                                    await changeChallengeStatus(Number(id), statusConfirm.next);
                                    setStatusConfirm({ open: false });
                                    setCurrentStatus(statusConfirm.next);
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
        </div>
    );
}


