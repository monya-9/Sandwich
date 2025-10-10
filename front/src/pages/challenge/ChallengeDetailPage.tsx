import React, { useState, useContext, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    getChallengeDetail,
    getDynamicChallengeDetail,
    type AnyChallengeDetail,
    type PortfolioChallengeDetail,
    type CodeChallengeDetail,
} from "../../data/Challenge/challengeDetailDummy";
import { SectionCard, CTAButton, StatusBadge } from "../../components/challenge/common";
import { ChevronDown, ChevronLeft, CheckCircle2, Copy, Check, AlertCircle } from "lucide-react";
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
function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <div className="mb-2 flex items-center gap-2">
            <span className="text-[15px] font-bold">{children}</span>
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

/* ---------- Reusable blocks ---------- */
function ScheduleList({ items }: { items: { label: string; date: string }[] }) {
    if (!items?.length) return null;
    return (
        <div className="mb-6">
            <SectionTitle>📅 진행 일정</SectionTitle>
            <GreenBox>
                <ul className="space-y-1">
                    {items.map((s, i) => (
                        <li key={i} className="flex items-center justify-between">
                            <span className="font-medium">{s.label}</span>
                            <span className="text-neutral-700">{s.date}</span>
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
                    {rewards.map((r, i) => (
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

function SubmitExampleBox({
                              repoUrl,
                              demoUrl,
                              desc,
                              language,
                              entrypoint,
                          }: {
    repoUrl?: string;
    demoUrl?: string;
    desc?: string;
    language?: string;
    entrypoint?: string;
}) {
    if (!repoUrl && !demoUrl && !desc && !language && !entrypoint) return null;
    return (
        <div className="mb-6">
            <SectionTitle>📦 제출 예시</SectionTitle>
            <GreenBox>
                <div className="space-y-1 text-[13.5px] leading-7">
                    {repoUrl && (
                        <div>
                            <span className="font-semibold">GitHub: </span>
                            {repoUrl}
                        </div>
                    )}
                    {demoUrl && (
                        <div>
                            <span className="font-semibold">데모 URL: </span>
                            {demoUrl}
                        </div>
                    )}
                    {language && (
                        <div>
                            <span className="font-semibold">언어: </span>
                            {language}
                        </div>
                    )}
                    {entrypoint && (
                        <div>
                            <span className="font-semibold">엔트리포인트: </span>
                            {entrypoint}
                        </div>
                    )}
                    {desc && <div className="whitespace-pre-line">{desc}</div>}
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
            <ul className="list-disc space-y-1 pl-5 text-[13.5px] leading-7 text-neutral-800">
                {items.map((i, idx) => (
                    <li key={idx}>
                        {i.label}: <span className="font-medium">{i.weight}점</span>
                    </li>
                ))}
            </ul>
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
    return type === "CODE" ? "코드 제출하기" : "프로젝트 제출하기";
}
function secondaryLabel(type: "CODE" | "PORTFOLIO") {
    return type === "CODE" ? "제출물 보기" : "작품 투표하러 가기";
}

/* ---------- Page ---------- */
export default function ChallengeDetailPage() {
    const params = useParams();
    const id = Number(params.id || 1);
    
    // 기본 더미 데이터로 초기화
    const [data, setData] = useState<AnyChallengeDetail>(() => getChallengeDetail(id));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mustHave, setMustHave] = useState<string[]>([]);

    const [open, setOpen] = useState(true);
    const [loginModalOpen, setLoginModalOpen] = useState(false);

    const navigate = useNavigate();
    const { isLoggedIn } = useContext(AuthContext);

    // 포트폴리오 챌린지(id: 2)인 경우 AI API에서 동적으로 데이터 가져오기
    useEffect(() => {
        if (id === 2) {
            setLoading(true);
            setError(null);
            getDynamicChallengeDetail(id)
                .then((dynamicData) => {
                    setData(dynamicData);
                })
                .catch((err) => {
                    console.error('월간 챌린지 데이터 로딩 실패:', err);
                    setError('AI 챌린지 정보를 불러오는 중 오류가 발생했습니다.');
                    // 에러 시 기본 더미 데이터 유지
                })
                .finally(() => {
                    setLoading(false);
                });
            
            // must_have 데이터 별도로 가져오기
            import('../../api/monthlyChallenge').then(({ fetchMonthlyChallenge }) => {
                fetchMonthlyChallenge()
                    .then((monthlyData) => {
                        setMustHave(monthlyData.mustHave || []);
                    })
                    .catch((err) => {
                        console.error('필수 조건 데이터 로딩 실패:', err);
                    });
            });
        }
    }, [id]);

    const goPrimary = () => {
        const href = primaryHref(data.type, id);
        if (!isLoggedIn) return setLoginModalOpen(true);
        navigate(href);
    };
    const goSecondary = () => {
        const href = secondaryHref(data.type, id);
        const needsLogin = data.type === "PORTFOLIO";
        if (needsLogin && !isLoggedIn) return setLoginModalOpen(true);
        navigate(href);
    };

    const onBack = () => {
        navigate("/challenge");
    };

    return (
        <div className="mx-auto w-full max-w-screen-xl px-4 py-6 md:px-6 md:py-10">
            <LoginRequiredModal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
            
            {/* 로딩 상태 */}
            {loading && (
                <div className="mb-6 flex items-center justify-center py-8">
                    <div className="flex items-center gap-3 text-neutral-600">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-emerald-500"></div>
                        <span className="text-sm">AI 챌린지 정보를 불러오는 중...</span>
                    </div>
                </div>
            )}
            
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

            {/* 상단 CTA */}
            <div className="mb-4 flex flex-wrap gap-2">
                <button
                    onClick={goPrimary}
                    className="inline-flex items-center gap-1 rounded-xl border border-neutral-300 bg-white px-3 py-1.5 text-[13px] font-semibold hover:bg-neutral-50"
                >
                    <span>{data.type === "CODE" ? "📥" : "📤"}</span> {primaryLabel(data.type)} →
                </button>

                <button
                    onClick={goSecondary}
                    className="inline-flex items-center gap-1 rounded-xl border border-neutral-300 bg-white px-3 py-1.5 text-[13px] font-semibold hover:bg-neutral-50"
                >
                    <span>{data.type === "CODE" ? "🗂️" : "🗳️"}</span> {secondaryLabel(data.type)} →
                </button>
            </div>

            {/* 본문 */}
            {open && (
                <SectionCard className="!px-6 !py-5 md:!px-8 md:!py-6" outerClassName="mt-2">
                    {/* 설명 */}
                    <div className="mb-6">
                        <SectionTitle>{data.type === "CODE" ? "📘 문제 설명" : "📘 챌린지 설명"}</SectionTitle>
                        <p className="whitespace-pre-line text-[13.5px] leading-7 text-neutral-800">{data.description}</p>
                    </div>

                    {/* 필수 조건 (포트폴리오 챌린지만) */}
                    {data.type === "PORTFOLIO" && mustHave.length > 0 && (
                        <div className="mb-6">
                            <SectionTitle>📋 필수 조건</SectionTitle>
                            <div className="space-y-2">
                                {mustHave.map((requirement, index) => (
                                    <div key={index} className="flex items-start gap-2">
                                        <div className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0"></div>
                                        <span className="text-[13.5px] leading-6 text-neutral-800">{requirement}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 유형별 */}
                    {data.type === "CODE" ? (
                        <>
                            <div className="mb-6 grid gap-6 md:grid-cols-2">
                                <div>
                                    <SectionTitle>🔶 입력 형식</SectionTitle>
                                    <GreenBox>
                    <pre className="whitespace-pre-wrap break-words font-mono text-[12.5px] leading-6">
                      {(data as CodeChallengeDetail).inputSpec}
                    </pre>
                                    </GreenBox>
                                </div>
                                <div>
                                    <SectionTitle>🔶 출력 형식</SectionTitle>
                                    <GreenBox>
                    <pre className="whitespace-pre-wrap break-words font-mono text-[12.5px] leading-6">
                      {(data as CodeChallengeDetail).outputSpec}
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
                                    {(data as CodeChallengeDetail).examples.map((ex, idx) => (
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

                            <ScheduleList items={(data as CodeChallengeDetail).schedule || []} />
                            <RewardsTable rewards={(data as CodeChallengeDetail).rewards} />
                            <SubmitExampleBox {...((data as CodeChallengeDetail).submitExample || {})} />
                            <AIScoringList items={(data as CodeChallengeDetail).aiScoring} />
                        </>
                    ) : (
                        <>
                            <ScheduleList items={(data as PortfolioChallengeDetail).schedule} />
                            <div className="mb-6">
                                <SectionTitle>🗳️ 투표 기준</SectionTitle>
                                <ul className="list-disc space-y-1 pl-5 text-[13.5px] leading-7 text-neutral-800">
                                    {(data as PortfolioChallengeDetail).votingCriteria.map((t, i) => (
                                        <li key={i}>{t} (1~5점)</li>
                                    ))}
                                </ul>
                            </div>
                            <RewardsTable rewards={(data as PortfolioChallengeDetail).rewards} />
                            <SubmitExampleBox {...((data as PortfolioChallengeDetail).submitExample || {})} />
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

                    {/* 공통 */}
                    <div className="mb-6">
                        <SectionTitle>{data.type === "CODE" ? "💡 심사 기준" : "🛡 운영/공정성"}</SectionTitle>
                        <ul className="list-disc space-y-1 pl-5 text-[13.5px] leading-7 text-neutral-800">
                            {data.judgeNotes.map((t, i) => (
                                <li key={i}>{t}</li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <SectionTitle>📣 안내</SectionTitle>
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
                    <CTAButton as="button" onClick={goPrimary}>
                        {primaryLabel(data.type)}
                    </CTAButton>
                    <CTAButton as="button" onClick={goSecondary}>
                        {secondaryLabel(data.type)}
                    </CTAButton>
                </div>
            </div>
        </div>
    );
}
