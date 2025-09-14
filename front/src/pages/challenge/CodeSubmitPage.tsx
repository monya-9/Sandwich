import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import LoginRequiredModal from "../../components/common/modal/LoginRequiredModal";
import { SectionCard, CTAButton } from "../../components/challenge/common";
import { getChallengeDetail } from "../../data/Challenge/challengeDetailDummy";
import type { CodeChallengeDetail } from "../../data/Challenge/challengeDetailDummy";
import { challengeApi, SubmissionDetail } from "../../api/challengeApi";
import { CheckCircle2, ChevronLeft, Loader2 } from "lucide-react";
import { poll } from "../../utils/poll";

type CodeSubmitPayload = {
    title: string;
    repoUrl: string;
    language: string; // 자유 입력
    entrypoint: string;
    note?: string;
};

const Row = ({ children }: { children: React.ReactNode }) => (
    <div className="flex flex-col gap-1">{children}</div>
);
const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="text-[13px] font-semibold text-neutral-800">{children}</label>
);
const Help = ({ children }: { children: React.ReactNode }) => <p className="text-[12px] text-neutral-500">{children}</p>;
const GreenBox = ({ children }: { children: React.ReactNode }) => (
    <div className="rounded-xl border-2 border-emerald-300/70 bg-white p-3">{children}</div>
);

/* 결과 발표/채점 시점 안내 텍스트 계산 (미사용 가능하지만 유지) */
function nextDateTextFromSchedule(schedule?: { label: string; date: string }[]) {
    if (!schedule || schedule.length === 0) return null;
    const target =
        schedule.find((s) => /결과\s*발표/.test(s.label)) ||
        schedule.find((s) => /자동\s*채점/.test(s.label));
    if (!target) return null;

    const now = new Date();
    const y = now.getFullYear();

    const md = target.date.match(/(\d+)\s*월\s*(\d+)\s*일(?:\s*(\d{1,2}):(\d{2}))?/);
    const wd = target.date.match(/(?:매주\s*)?(월|화|수|목|금|토|일)요일(?:\s*(\d{1,2}):(\d{2}))?/);

    let when: Date | null = null;
    if (md) {
        const [, m, d, hh, mm] = md;
        const dt = new Date(y, Number(m) - 1, Number(d), hh ? Number(hh) : 10, mm ? Number(mm) : 0);
        when = dt;
        if (dt.getTime() <= now.getTime()) {
            when = new Date(y + 1, Number(m) - 1, Number(d), dt.getHours(), dt.getMinutes());
        }
    } else if (wd) {
        const [, wkr, hh, mm] = wd;
        const map: Record<string, number> = { 일: 0, 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6 };
        const want = map[wkr as keyof typeof map];
        const day = now.getDay();
        let add = want - day;
        if (add <= 0) add += 7;
        when = new Date(y, now.getMonth(), now.getDate() + add, hh ? Number(hh) : 10, mm ? Number(mm) : 0);
    } else {
        return `곧 공개돼요`;
    }

    if (!when) return null;
    const isToday =
        when.getFullYear() === now.getFullYear() &&
        when.getMonth() === now.getMonth() &&
        when.getDate() === now.getDate();
    const isTomorrow = (() => {
        const t = new Date(now);
        t.setDate(now.getDate() + 1);
        return (
            when.getFullYear() === t.getFullYear() &&
            when.getMonth() === t.getMonth() &&
            when.getDate() === t.getDate()
        );
    })();

    const label = isToday ? "오늘" : isTomorrow ? "내일" : "";
    const text = `${when.getMonth() + 1}월 ${when.getDate()}일 ${when.getHours().toString().padStart(2, "0")}:${when
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
    return label ? `${label} ${text}` : text;
}

export default function CodeSubmitPage() {
    const { id: idStr } = useParams();
    const id = Number(idStr || 1);
    const data = useMemo(() => getChallengeDetail(id) as CodeChallengeDetail, [id]);

    const { isLoggedIn } = useContext(AuthContext);
    const [loginOpen, setLoginOpen] = useState(false);
    const nav = useNavigate();

    useEffect(() => {
        if (!isLoggedIn) setLoginOpen(true);
    }, [isLoggedIn]);

    const [tab, setTab] = useState<"edit" | "preview">("edit");
    const [form, setForm] = useState<CodeSubmitPayload>({
        title: "",
        repoUrl: "",
        language: (data.submitExample?.language as any) || "node",
        entrypoint: data.submitExample?.entrypoint || "npm start",
        note: "",
    });

    const [submitting, setSubmitting] = useState(false);
    const [submissionId, setSubmissionId] = useState<number | null>(null);
    const [aiStatus, setAiStatus] = useState<Partial<SubmissionDetail>>({});

    const canSubmit = !!form.title.trim() && /^https?:\/\//.test(form.repoUrl) && !!form.entrypoint.trim();

    const handleSubmit = async () => {
        if (!canSubmit || submitting) return;

        setSubmitting(true);
        try {
            const created = await challengeApi.createSubmission(id, {
                type: "CODE",
                title: form.title.trim(),
                repoUrl: form.repoUrl.trim(),
                language: form.language.trim(),
                entrypoint: form.entrypoint.trim(),
                note: form.note?.trim() || undefined,
            } as any);

            setSubmissionId(created.id);

            const result = await poll<SubmissionDetail>(
                () => challengeApi.getSubmission(created.id),
                (r) => ["PASSED", "FAILED", "SCORED"].includes(r.status),
                { maxMs: 120_000, intervalMs: 2000 }
            );
            setAiStatus(result);
            setTab("preview");
        } catch (e: any) {
            alert(e.message || "제출 실패");
        } finally {
            setSubmitting(false);
        }
    };

    // 사용 여부와 상관없이 남겨둠
    const resultWhenText = nextDateTextFromSchedule(data.schedule);

    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-10">
            <LoginRequiredModal open={loginOpen && !isLoggedIn} onClose={() => setLoginOpen(false)} />

            {/* 헤더 */}
            <div className="mb-4 flex items-center gap-2">
                <button
                    onClick={() => nav(`/challenge/code/${id}`)}
                    aria-label="뒤로가기"
                    className="mr-1 inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <h1 className="text-[20px] font-extrabold tracking-[-0.01em] md:text-[22px]">
                    {data.title} — 코드 제출
                </h1>
            </div>

            {/* 문제 설명 */}
            <SectionCard className="!px-5 !py-5 mb-4">
                <div className="text-[13.5px] leading-7 text-neutral-800 whitespace-pre-line">{data.description}</div>
            </SectionCard>

            {/* 탭 */}
            <div className="mb-3 flex gap-2">
                <button
                    onClick={() => setTab("edit")}
                    className={`rounded-full px-3 py-1.5 text-[13px] ${tab === "edit" ? "bg-emerald-600 text-white" : "border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50"}`}
                >
                    작성
                </button>
                <button
                    onClick={() => setTab("preview")}
                    className={`rounded-full px-3 py-1.5 text-[13px] ${tab === "preview" ? "bg-emerald-600 text-white" : "border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50"}`}
                >
                    미리보기
                </button>
            </div>

            {tab === "edit" ? (
                <SectionCard className="!px-5 !py-5">
                    <div className="space-y-4">
                        <Row>
                            <Label>제목</Label>
                            <input
                                className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[13.5px] outline-none focus:border-emerald-500"
                                value={form.title}
                                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                                placeholder="이 코드를 나타내는 제목을 작성해주세요"
                            />
                        </Row>

                        <Row>
                            <Label>GitHub 리포지토리 URL</Label>
                            <input
                                className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[13.5px] outline-none focus:border-emerald-500"
                                value={form.repoUrl}
                                onChange={(e) => setForm((f) => ({ ...f, repoUrl: e.target.value }))}
                                placeholder="https://github.com/user/repo"
                            />
                            <Help>리포는 public 권장. private은 제출 후 접근 권한을 별도 안내해 주세요.</Help>
                        </Row>

                        <div className="grid gap-3 md:grid-cols-2">
                            <Row>
                                <Label>언어</Label>
                                <input
                                    className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[13.5px] outline-none focus:border-emerald-500"
                                    value={form.language}
                                    onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
                                    placeholder='예) node, python'
                                />
                            </Row>
                            <Row>
                                <Label>엔트리포인트</Label>
                                <input
                                    className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[13.5px] outline-none focus:border-emerald-500"
                                    value={form.entrypoint}
                                    onChange={(e) => setForm((f) => ({ ...f, entrypoint: e.target.value }))}
                                    placeholder='예) "npm start" 또는 "python main.py"'
                                />
                            </Row>
                        </div>

                        <Row>
                            <Label>비고(선택)</Label>
                            <textarea
                                rows={4}
                                className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[13.5px] outline-none focus:border-emerald-500"
                                value={form.note}
                                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                                placeholder="실행 방법이나 특이사항이 있다면 간단히 적어주세요."
                            />
                            <Help>예: 추가 환경변수 / 빌드 스텝 / 샘플 입력 설명 등</Help>
                        </Row>

                        <div className="flex justify-end">
                            <CTAButton as="button" onClick={handleSubmit} disabled={!canSubmit || submitting}>
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-1 h-4 w-4 animate-spin" /> 제출 중…
                                    </>
                                ) : (
                                    "제출하기"
                                )}
                            </CTAButton>
                        </div>
                    </div>
                </SectionCard>
            ) : (
                <SectionCard className="!px-5 !py-5">
                    <h3 className="mb-3 text-[15px] font-bold">🖼️ 미리보기</h3>
                    <GreenBox>
                        <div className="space-y-1 text-[13.5px] leading-7">
                            <div><span className="font-semibold">제목: </span>{form.title || "-"}</div>
                            <div><span className="font-semibold">리포지토리: </span>{form.repoUrl || "-"}</div>
                            <div><span className="font-semibold">언어: </span>{form.language || "-"}</div>
                            <div><span className="font-semibold">엔트리포인트: </span>{form.entrypoint || "-"}</div>
                            {form.note && (
                                <div className="whitespace-pre-wrap"><span className="font-semibold">비고: </span>{form.note}</div>
                            )}
                        </div>
                    </GreenBox>

                    <h3 className="mb-2 mt-6 text-[15px] font-bold">🤖 AI 채점</h3>
                    <GreenBox>
                        {!submissionId ? (
                            <div className="space-y-1 text-[13px] text-neutral-700">
                                <div>제출 후 자동으로 채점이 시작됩니다.</div>
                                <div>ℹ️ <span className="font-semibold">AI 채점 결과</span>는 <b>마감 다음 날 오전</b>에 공개돼요.</div>
                            </div>
                        ) : aiStatus.status ? (
                            <div className="space-y-1 text-[13.5px] leading-7">
                                <div>상태: <span className="font-semibold">{aiStatus.status}</span></div>
                                {aiStatus.score != null && <div>점수: <span className="font-semibold">{aiStatus.score}</span></div>}
                                {aiStatus.passed != null && (
                                    <div>테스트: <span className="font-semibold">{aiStatus.passed}</span> passed / {aiStatus.failed} failed</div>
                                )}
                                {aiStatus.coverage != null && <div>커버리지: <span className="font-semibold">{aiStatus.coverage}%</span></div>}
                                {aiStatus.aiComment && <div className="whitespace-pre-wrap">AI 코멘트: {aiStatus.aiComment}</div>}
                                {["PASSED", "SCORED"].includes(aiStatus.status!) && (
                                    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
                                        <CheckCircle2 className="h-4 w-4" /> 채점 완료
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="inline-flex items-center text-[13px] text-neutral-700">
                                <Loader2 className="mr-1 h-4 w-4 animate-spin" /> 채점 대기/진행 중… (결과는 마감 다음 날 공개)
                            </div>
                        )}
                    </GreenBox>

                    <div className="mt-4 flex justify-end">
                        <CTAButton
                            as="button"
                            onClick={async () => {
                                await handleSubmit();
                                if (!submitting && canSubmit) {
                                    // 제출 후 디테일로 이동
                                    nav(`/challenge/code/${id}`);
                                }
                            }}
                            disabled={!canSubmit || submitting}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-1 h-4 w-4 animate-spin" /> 제출 중…
                                </>
                            ) : (
                                "제출하기"
                            )}
                        </CTAButton>
                    </div>
                </SectionCard>
            )}
        </div>
    );
}
