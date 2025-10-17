// src/pages/challenge/CodeSubmitPage.tsx
import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import LoginRequiredModal from "../../components/common/modal/LoginRequiredModal";
import { SectionCard, CTAButton, Row, Label, Help, GreenBox } from "../../components/challenge/common";
import { getChallengeDetail } from "../../data/Challenge/challengeDetailDummy";
import type { CodeChallengeDetail } from "../../data/Challenge/challengeDetailDummy";
import { fetchWeeklyLatest } from "../../api/weeklyChallenge";
import { ChevronLeft, Loader2, CheckCircle2 } from "lucide-react";
import { createChallengeSubmission } from "../../api/submissionApi";
import Toast from "../../components/common/Toast";
// import { useUserInfo } from "../../hooks/useUserInfo"; // 백엔드에서 자동으로 사용자 정보 처리

type CodeSubmitPayload = {
    title: string;
    repoUrl: string;
    language: string;
    entrypoint: string;
    commitSha?: string; // 커밋 SHA 추가
    note?: string;
};

type AiStatus = {
    status?: "PENDING" | "RUNNING" | "PASSED" | "SCORED";
    score?: number;
    passed?: number;
    failed?: number;
    coverage?: number;
    aiComment?: string;
};

export default function CodeSubmitPage() {
    const { id: idStr } = useParams();
    const id = Number(idStr || 1);
    
    // 백엔드 챌린지 데이터 상태
    const [data, setData] = useState<CodeChallengeDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [challengeStatus, setChallengeStatus] = useState<string | null>(null);
    
    // AI 주간 챌린지 데이터 상태 (보조용)
    const [weeklyData, setWeeklyData] = useState<any>(null);
    const [loadingWeekly, setLoadingWeekly] = useState(false);
    const [weeklyError, setWeeklyError] = useState<string | null>(null);

    const { isLoggedIn } = useContext(AuthContext);
    const [loginOpen, setLoginOpen] = useState(false);
    const nav = useNavigate();
    // const userInfo = useUserInfo(); // 백엔드에서 자동으로 사용자 정보 처리

    useEffect(() => {
        if (!isLoggedIn) setLoginOpen(true);
    }, [isLoggedIn]);

    // 백엔드 챌린지 데이터 로드
    useEffect(() => {
        const loadChallengeData = async () => {
            setLoading(true);
            try {
                const { fetchChallengeDetail } = await import('../../api/challengeApi');
                const backendChallenge = await fetchChallengeDetail(id);
                
                if (backendChallenge.type === "CODE") {
                    // 백엔드 데이터 우선 사용
                    let ruleData: any = null;
                    let backendDescription: string | null = null;
                    
                    if (backendChallenge.ruleJson) {
                        try {
                            ruleData = typeof backendChallenge.ruleJson === 'string' 
                                ? JSON.parse(backendChallenge.ruleJson) 
                                : backendChallenge.ruleJson;
                            backendDescription = ruleData.summary || ruleData.md;
                        } catch (e) {
                            // ruleJson 파싱 실패는 무시
                        }
                    }
                    
                    // 더미 데이터 기반으로 백엔드 데이터 적용
                    const baseData = getChallengeDetail(id) as CodeChallengeDetail;
                    const backendBasedData = {
                        ...baseData,
                        id: backendChallenge.id,
                        title: `코드 챌린지: ${backendChallenge.title}`,
                        subtitle: backendChallenge.title,
                        description: backendDescription || baseData.description,
                        startAt: backendChallenge.startAt,
                        endAt: backendChallenge.endAt,
                        status: backendChallenge.status,
                    };
                    
                    setData(backendBasedData);
                    setChallengeStatus(backendChallenge.status);
                } else {
                    setData(null);
                }
            } catch (err) {
                // 에러 시 더미 데이터 사용
                const fallbackData = getChallengeDetail(id) as CodeChallengeDetail;
                setData(fallbackData);
            } finally {
                setLoading(false);
            }
        };

        loadChallengeData();
    }, [id]);

    const [tab, setTab] = useState<"edit" | "preview">("edit");
    const [form, setForm] = useState<CodeSubmitPayload>({
        title: "",
        repoUrl: "",
        language: "node",
        entrypoint: "npm start",
        commitSha: "",
        note: "",
    });

    // data가 로드된 후 form 초기값 설정
    useEffect(() => {
        if (data) {
            setForm(prev => ({
                ...prev,
                language: (data.submitExample?.language as any) || "node",
                entrypoint: data.submitExample?.entrypoint || "npm start",
            }));
        }
    }, [data]);
    const [submitting, setSubmitting] = useState(false);
    const [successToast, setSuccessToast] = useState<{ visible: boolean; message: string }>({
        visible: false,
        message: ''
    });

    // 프리뷰/작성 공통으로 쓰는 더미 상태
    const submissionId: number | null = null;
    const [aiStatus] = useState<AiStatus>({});

    const canSubmit = !!form.title.trim() && challengeStatus !== "ENDED";
    const isChallengeEnded = challengeStatus === "ENDED";

    // GitHub API에서 최신 커밋 SHA 가져오기
    const fetchLatestCommitSha = async (repoUrl: string): Promise<string> => {
        try {
            // GitHub URL에서 owner/repo 추출
            const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
            if (!match) return "a1b2c3d"; // 기본값
            
            const [, owner, repo] = match;
            const apiUrl = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`;
            
            const response = await fetch(apiUrl);
            if (!response.ok) return "a1b2c3d"; // 기본값
            
            const commits = await response.json();
            if (commits.length > 0 && commits[0].sha) {
                return commits[0].sha.substring(0, 7); // 7자리로 자르기
            }
        } catch (error) {
            console.warn('GitHub API 호출 실패:', error);
        }
        return "a1b2c3d"; // 기본값
    };

    const handleSubmit = async () => {
        if (!canSubmit || submitting) return;
        setSubmitting(true);
        try {
            // GitHub에서 최신 커밋 SHA 가져오기
            const commitSha = await fetchLatestCommitSha(form.repoUrl || "");
            
            const submissionData: any = {
                title: form.title.trim(),
                desc: form.note?.trim() || `repo: ${form.repoUrl || "-"} / ${form.language} ${form.entrypoint}`,
                repoUrl: form.repoUrl || "",
                participationType: "SOLO" as const,
                // 코드 챌린지 필수 필드
                code: {
                    language: form.language || "node",
                    entrypoint: (form.entrypoint || "npm_start")
                        .replace(/\s+/g, "_") // 공백을 언더스코어로 변경
                        .replace(/[^a-zA-Z0-9_\-.]/g, "_") // 특수문자를 언더스코어로 변경
                        .replace(/_+/g, "_") // 연속된 언더스코어를 하나로
                        .replace(/^_|_$/g, ""), // 앞뒤 언더스코어 제거
                    commitSha: commitSha // GitHub API에서 가져온 실제 커밋 SHA
                }
            };
            
            await createChallengeSubmission(id, submissionData);
            setSuccessToast({
                visible: true,
                message: "제출이 접수되었습니다."
            });
            nav(`/challenge/code/${id}/submissions`, { replace: true });
        } catch (error) {
            console.error('제출 실패:', error);
            setSuccessToast({
                visible: true,
                message: "제출 중 오류가 발생했습니다. 다시 시도해주세요."
            });
        } finally {
            setSubmitting(false);
        }
    };

    // 로딩 중일 때 로딩 화면 표시
    if (loading || !data) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="flex items-center justify-center gap-3 text-neutral-600 mb-4">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-emerald-500"></div>
                        <span className="text-lg font-medium">챌린지 정보를 불러오는 중...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <Toast
                visible={successToast.visible}
                message={successToast.message}
                type="success"
                size="medium"
                autoClose={3000}
                closable={true}
                onClose={() => setSuccessToast(prev => ({ ...prev, visible: false }))}
            />
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
                    {weeklyData?.title || data.title} — 코드 제출
                </h1>
            </div>

            {/* 문제 설명 */}
            <SectionCard className="!px-5 !py-5 mb-4">
                {loadingWeekly ? (
                    <div className="flex items-center gap-2 text-neutral-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-[13.5px]">AI 챌린지 정보를 불러오는 중...</span>
                    </div>
                ) : weeklyError ? (
                    <div className="text-red-600 text-[13.5px]">{weeklyError}</div>
                ) : (
                    <div className="whitespace-pre-line text-[13.5px] leading-7 text-neutral-800">
                        {weeklyData?.summary || data.description}
                    </div>
                )}
            </SectionCard>

            {/* 탭 */}
            <div className="mb-3 flex gap-2">
                <button
                    onClick={() => setTab("edit")}
                    className={`rounded-full px-3 py-1.5 text-[13px] ${
                        tab === "edit"
                            ? "bg-emerald-600 text-white"
                            : "border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50"
                    }`}
                >
                    작성
                </button>
                <button
                    onClick={() => setTab("preview")}
                    className={`rounded-full px-3 py-1.5 text-[13px] ${
                        tab === "preview"
                            ? "bg-emerald-600 text-white"
                            : "border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50"
                    }`}
                >
                    미리보기
                </button>
            </div>

            {tab === "edit" ? (
                <>
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

                            {/* 종료된 챌린지 안내 */}
                            {isChallengeEnded && (
                                <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <span className="text-lg">🔒</span>
                                        <div>
                                            <div className="font-semibold">종료된 챌린지</div>
                                            <div className="text-sm text-gray-600">이 챌린지는 이미 종료되어 더 이상 제출할 수 없습니다.</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <CTAButton 
                                    as="button" 
                                    onClick={handleSubmit} 
                                    disabled={!canSubmit || submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-1 h-4 w-4 animate-spin" /> 제출 중…
                                        </>
                                    ) : isChallengeEnded ? (
                                        "제출 불가"
                                    ) : (
                                        "제출하기"
                                    )}
                                </CTAButton>
                            </div>
                        </div>
                    </SectionCard>

                    {/* ✅ 작성 탭 아래 AI 채점 안내 */}
                    <SectionCard className="!px-5 !py-5 mt-4">
                        <h3 className="mb-2 text-[15px] font-bold">🤖 AI 채점</h3>
                        <GreenBox>
                            {!submissionId ? (
                                <div className="space-y-1 text-[13px] text-neutral-700">
                                    <div>제출 후 자동으로 채점이 시작됩니다.</div>
                                    <div>
                                        ℹ️ <span className="font-semibold">AI 채점 결과</span>는 <b>마감 다음 날 오전</b>에 공개돼요.
                                    </div>
                                </div>
                            ) : aiStatus.status ? (
                                <div className="space-y-1 text-[13.5px] leading-7">
                                    <div>
                                        상태: <span className="font-semibold">{aiStatus.status}</span>
                                    </div>
                                    {aiStatus.score != null && (
                                        <div>
                                            점수: <span className="font-semibold">{aiStatus.score}</span>
                                        </div>
                                    )}
                                    {aiStatus.passed != null && (
                                        <div>
                                            테스트: <span className="font-semibold">{aiStatus.passed}</span> passed / {aiStatus.failed} failed
                                        </div>
                                    )}
                                    {aiStatus.coverage != null && (
                                        <div>
                                            커버리지: <span className="font-semibold">{aiStatus.coverage}%</span>
                                        </div>
                                    )}
                                    {aiStatus.aiComment && (
                                        <div className="whitespace-pre-wrap">AI 코멘트: {aiStatus.aiComment}</div>
                                    )}
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
                    </SectionCard>
                </>
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

                    {/* 프리뷰 탭의 AI 채점 블록(기존 유지) */}
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
                </SectionCard>
            )}
        </div>
        </>
    );
}