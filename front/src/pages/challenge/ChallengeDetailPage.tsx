// src/pages/challenge/ChallengeDetailPage.tsx
import React, { useMemo, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    getChallengeDetail,
    type AnyChallengeDetail,
    type PortfolioChallengeDetail,
} from "../../data/Challenge/challengeDetailDummy";
import { SectionCard, CTAButton, StatusBadge } from "../../components/challenge/common";
import { ChevronDown, ChevronLeft, CheckCircle2, Copy, Check } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import LoginRequiredModal from "../../components/common/modal/LoginRequiredModal";

/* ---------- Small UI ---------- */

function GreenBox({ children }: { children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border-2 border-emerald-400/70 bg-white p-4 md:p-5 text-[13.5px] leading-6 text-neutral-800">
            {children}
        </div>
    );
}

function Copyable({ title, value }: { title: string; value: string }) {
    const [copied, setCopied] = useState(false);
    const onCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch {}
    };
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-900">{title}</span>
                <button
                    onClick={onCopy}
                    className="inline-flex items-center gap-1 rounded-full border border-neutral-300 bg-white px-2 py-0.5 text-[12px] hover:bg-neutral-50"
                >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "복사됨" : "복사"}
                </button>
            </div>
            <GreenBox>
                <pre className="whitespace-pre-wrap break-words font-mono text-[12.5px] leading-6">{value}</pre>
            </GreenBox>
        </div>
    );
}

/* ---------- Helpers ---------- */

function resolveDefaultHref(actionType: string | undefined, id: number, type: "CODE" | "PORTFOLIO") {
    if (actionType === "SUBMIT") {
        return type === "CODE" ? `/challenge/${id}/submit` : `/challenge/${id}/submit-portfolio`;
    }
    if (actionType === "VOTE") {
        return type === "CODE" ? `/challenge/${id}/vote` : `/challenge/${id}/vote`;
    }
    return "#";
}

/* ---------- Page ---------- */

export default function ChallengeDetailPage() {
    const params = useParams();
    const id = Number(params.id || 1);
    const data: AnyChallengeDetail = useMemo(() => getChallengeDetail(id), [id]);

    const [open, setOpen] = useState(true);
    const [loginModalOpen, setLoginModalOpen] = useState(false);

    const navigate = useNavigate();
    const { isLoggedIn } = useContext(AuthContext);

    // 상단/하단 CTA 공통 동작
    const goOrAskLogin = (href: string) => {
        if (!isLoggedIn) {
            setLoginModalOpen(true);
            return;
        }
        if (href && href !== "#") navigate(href);
    };

    const onSubmitClick = () => {
        const href = resolveDefaultHref("SUBMIT", id, data.type);
        goOrAskLogin(href);
    };

    const onVoteClick = () => {
        const href = resolveDefaultHref("VOTE", id, data.type);
        goOrAskLogin(href);
    };

    // 뒤로가기
    const onBack = () => {
        if (window.history.length > 1) navigate(-1);
        else navigate("/challenge");
    };

    return (
        <div className="mx-auto w-full max-w-screen-xl px-4 py-6 md:px-6 md:py-10">
            {/* 로그인 요구 모달 */}
            <LoginRequiredModal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} />

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
                    <h1 className="text-[22px] font-extrabold tracking-[-0.01em] text-neutral-900 md:text-[24px]">
                        {data.title}
                    </h1>
                </div>

                <button
                    onClick={() => setOpen((v) => !v)}
                    className="inline-flex items-center gap-1 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-[12.5px] hover:bg-neutral-50"
                >
                    상세 {open ? "접기" : "펼치기"} <ChevronDown className={`h-4 w-4 ${open ? "rotate-180" : ""}`} />
                </button>
            </div>

            {/* 상단 액션 버튼들 (로그인 가드 + 기본 라우트 보정) */}
            <div className="mb-4 flex flex-wrap gap-2">
                {data.actions.map((a, i) => {
                    const fallbackHref = resolveDefaultHref((a as any).type, id, data.type);
                    const href = a.href || fallbackHref || "#";
                    const onClick = () => goOrAskLogin(href);
                    return (
                        <button
                            key={i}
                            onClick={onClick}
                            className="inline-flex items-center gap-1 rounded-xl border border-neutral-300 bg-white px-3 py-1.5 text-[13px] font-semibold hover:bg-neutral-50"
                        >
                            <span>{a.emoji ?? "➡️"}</span> {a.label} →
                        </button>
                    );
                })}
            </div>

            {/* 본문 */}
            {open && (
                <SectionCard className="!px-6 !py-5 md:!px-8 md:!py-6" outerClassName="mt-2">
                    {/* 공통: 문제/주제 설명 */}
                    <div className="mb-6">
                        <div className="mb-2 flex items-center gap-2">
                            <span className="text-[15px] font-bold">{data.type === "CODE" ? "📘 문제 설명" : "📘 챌린지 설명"}</span>
                        </div>
                        <p className="whitespace-pre-line text-[13.5px] leading-7 text-neutral-800">{data.description}</p>
                    </div>

                    {/* 유형별 섹션 */}
                    {data.type === "CODE" ? (
                        <>
                            {/* 입력/출력 */}
                            <div className="mb-6 grid gap-6 md:grid-cols-2">
                                <div>
                                    <div className="mb-2 flex items-center gap-2">
                                        <span className="text-[15px] font-bold">🔶 입력 형식</span>
                                    </div>
                                    <GreenBox>
                    <pre className="whitespace-pre-wrap break-words font-mono text-[12.5px] leading-6">
                      {data.inputSpec}
                    </pre>
                                    </GreenBox>
                                </div>
                                <div>
                                    <div className="mb-2 flex items-center gap-2">
                                        <span className="text-[15px] font-bold">🔶 출력 형식</span>
                                    </div>
                                    <GreenBox>
                    <pre className="whitespace-pre-wrap break-words font-mono text-[12.5px] leading-6">
                      {data.outputSpec}
                    </pre>
                                    </GreenBox>
                                </div>
                            </div>

                            {/* 예제 */}
                            <div className="mb-6">
                                <div className="mb-3 flex items-center gap-2">
                                    <span className="text-[15px] font-bold">✅ 예제 입력 / 출력</span>
                                    <StatusBadge label="정답 예시" />
                                </div>

                                <div className="grid gap-6 md:grid-cols-2">
                                    {data.examples.map((ex, idx) => (
                                        <div key={idx} className="rounded-2xl border border-emerald-200/70 bg-emerald-50/30 p-4">
                                            <div className="mb-3 flex items-center gap-2">
                                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                                <span className="text-[14px] font-semibold">{ex.title}</span>
                                            </div>
                                            <Copyable title={ex.title} value={ex.input} />
                                            <div className="mt-4">
                                                <Copyable title={ex.outputTitle} value={ex.output} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        // === PORTFOLIO ===
                        <>
                            {/* 일정 */}
                            <div className="mb-6">
                                <div className="mb-2 flex items-center gap-2">
                                    <span className="text-[15px] font-bold">📅 진행 일정</span>
                                </div>
                                <GreenBox>
                                    <ul className="space-y-1">
                                        {(data as PortfolioChallengeDetail).schedule.map((s, i) => (
                                            <li key={i} className="flex items-center justify-between">
                                                <span className="font-medium">{s.label}</span>
                                                <span className="text-neutral-700">{s.date}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </GreenBox>
                            </div>

                            {/* 투표 기준 */}
                            <div className="mb-6">
                                <div className="mb-2 flex items-center gap-2">
                                    <span className="text-[15px] font-bold">🗳️ 투표 기준</span>
                                </div>
                                <ul className="list-disc space-y-1 pl-5 text-[13.5px] leading-7 text-neutral-800">
                                    {(data as PortfolioChallengeDetail).votingCriteria.map((t, i) => (
                                        <li key={i}>{t} (1~5점)</li>
                                    ))}
                                </ul>
                            </div>

                            {/* 보상 */}
                            <div className="mb-6">
                                <div className="mb-2 flex items-center gap-2">
                                    <span className="text-[15px] font-bold">🏆 보상</span>
                                </div>
                                <GreenBox>
                                    <div className="grid grid-cols-4 gap-2 text-[13px]">
                                        <div className="font-semibold">순위</div>
                                        <div className="font-semibold">크레딧</div>
                                        <div className="font-semibold">환산</div>
                                        <div className="font-semibold">의미</div>
                                        {(data as PortfolioChallengeDetail).rewards.map((r, i) => (
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

                            {/* 제출/팀 예시 */}
                            {(data as PortfolioChallengeDetail).submitExample && (
                                <div className="mb-6">
                                    <div className="mb-2 flex items-center gap-2">
                                        <span className="text-[15px] font-bold">📦 제출 예시</span>
                                    </div>
                                    <GreenBox>
                                        <div className="space-y-1 text-[13.5px] leading-7">
                                            <div>
                                                <span className="font-semibold">GitHub: </span>
                                                {(data as PortfolioChallengeDetail).submitExample?.repoUrl}
                                            </div>
                                            <div>
                                                <span className="font-semibold">데모 URL: </span>
                                                {(data as PortfolioChallengeDetail).submitExample?.demoUrl}
                                            </div>
                                            <div className="whitespace-pre-line">
                                                {(data as PortfolioChallengeDetail).submitExample?.desc}
                                            </div>
                                        </div>
                                    </GreenBox>
                                </div>
                            )}

                            {(data as PortfolioChallengeDetail).teamExample && (
                                <div className="mb-6">
                                    <div className="mb-2 flex items-center gap-2">
                                        <span className="text-[15px] font-bold">👥 팀 정보 예시</span>
                                    </div>
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

                    {/* 심사/운영(공통) */}
                    <div className="mb-6">
                        <div className="mb-2 flex items-center gap-2">
                            <span className="text-[15px] font-bold">{data.type === "CODE" ? "💡 심사 기준" : "🛡 운영/공정성"}</span>
                        </div>
                        <ul className="list-disc space-y-1 pl-5 text-[13.5px] leading-7 text-neutral-800">
                            {data.judgeNotes.map((t, i) => (
                                <li key={i}>{t}</li>
                            ))}
                        </ul>
                    </div>

                    {/* 제출 안내(공통) */}
                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <span className="text-[15px] font-bold">📣 안내</span>
                        </div>
                        <ul className="list-disc space-y-1 pl-5 text-[13.5px] leading-7 text-neutral-800">
                            {data.submitGuide.map((t, i) => (
                                <li key={i}>{t}</li>
                            ))}
                        </ul>
                    </div>
                </SectionCard>
            )}

            {/* 하단 고정 CTA */}
            <div className="sticky bottom-4 mt-6 flex justify-end">
                <div className="flex items-center gap-2 rounded-full border border-neutral-300 bg-white/95 px-2 py-2 shadow-lg backdrop-blur">
                    <CTAButton as="button" onClick={onSubmitClick}>
                        {data.type === "CODE" ? "코드 제출하기" : "프로젝트 제출하기"}
                    </CTAButton>
                    <CTAButton as="button" onClick={onVoteClick}>
                        투표 참여하기
                    </CTAButton>
                </div>
            </div>
        </div>
    );
}
