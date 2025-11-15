import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import LoginRequiredModal from "../../components/common/modal/LoginRequiredModal";
import { SectionCard, CTAButton, Row, Label, GreenBox } from "../../components/challenge/common";
import { getChallengeDetail } from "../../data/Challenge/challengeDetailDummy";
import type { PortfolioChallengeDetail } from "../../data/Challenge/challengeDetailDummy";
import { ChevronLeft } from "lucide-react";
import Toast from "../../components/common/Toast";
import { uploadImage } from "../../api/projectApi";
import { UserApi } from "../../api/userApi";
import { createChallengeSubmission, updateChallengeSubmission, fetchChallengeSubmissionDetail, type SubmissionCreateRequest } from "../../api/submissionApi";
import { fetchChallengeDetail } from "../../api/challengeApi";
import ImageUploadSection, { processImageFile } from "../../components/ProjectMangeSample/ImageUploadSection";
import CoverCropper from "../../components/ProjectMangeSample/CoverCropper";
import CustomDropdown from "../../components/common/CustomDropdown";

type PortfolioSubmitPayload = {
    title: string;
    repoUrl?: string;
    demoUrl?: string;
    desc?: string;
    summary?: string;
    teamType?: "SOLO" | "TEAM";
    teamName?: string;
    membersText?: string;
    language?: string;
    coverUrl?: string;
    images?: string[]; // 추가 이미지들
};

// 기술 스택 옵션들
const languageOptions = [
    "JavaScript",
    "TypeScript", 
    "React",
    "Vue",
    "Angular",
    "Next.js",
    "Node.js",
    "Python",
    "Java",
    "Spring",
    "PHP",
    "C#",
    "C++",
    "Go",
    "Rust",
    "Kotlin",
    "Swift",
    "Flutter",
    "React Native",
    "기타"
];


export default function PortfolioSubmitPage() {
    const { id: idStr } = useParams();
    const id = Number(idStr || 2);
    const [searchParams] = useSearchParams();
    const editSubmissionId = searchParams.get('edit') ? Number(searchParams.get('edit')) : null;
    const isEditMode = !!editSubmissionId;
    
    // 데이터 초기화 (더미 데이터 사용하지 않음)
    const [data, setData] = useState<PortfolioChallengeDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [challengeExists, setChallengeExists] = useState<boolean | null>(null);
    const [mustHave, setMustHave] = useState<string[]>([]);
    const [challengeStatus, setChallengeStatus] = useState<string | null>(null);
    const [timeline, setTimeline] = useState<{ startAt?: string; endAt?: string; voteStartAt?: string; voteEndAt?: string }>({});

    const { isLoggedIn, isAuthChecking } = useContext(AuthContext);
    const [loginOpen, setLoginOpen] = useState(false);
    const nav = useNavigate();

    useEffect(() => { 
        // 인증 확인이 완료된 후에만 로그인 모달 상태 업데이트
        if (!isAuthChecking) {
            setLoginOpen(!isLoggedIn);
        }
    }, [isLoggedIn, isAuthChecking]);

    // 챌린지 존재 여부 확인
    useEffect(() => {
        const checkChallengeExists = async () => {
            try {
                await fetchChallengeDetail(id);
                setChallengeExists(true);
            } catch (error: any) {
                if (error?.response?.status === 404) {
                    setChallengeExists(false);
                } else {
                    console.error('챌린지 확인 실패:', error);
                    setChallengeExists(false);
                }
            }
        };

        checkChallengeExists();
    }, [id]);

    // 백엔드 챌린지 데이터 우선 사용
    useEffect(() => {
        const loadChallengeData = async () => {
            setLoading(true);
            try {
                const backendChallenge = await fetchChallengeDetail(id);
                
                if (backendChallenge.type === "PORTFOLIO") {
                    // 백엔드 데이터 우선 사용
                    let ruleData: any = null;
                    let backendDescription: string | null = null;
                    
                    if (backendChallenge.ruleJson) {
                        try {
                            ruleData = typeof backendChallenge.ruleJson === 'string' 
                                ? JSON.parse(backendChallenge.ruleJson) 
                                : backendChallenge.ruleJson;
                            backendDescription = ruleData.summary || ruleData.md;
                            setMustHave(ruleData.must || ruleData.mustHave || []);
                        } catch (e) {
                            setMustHave([]);
                        }
                    }
                    
                    // 더미 데이터 기반으로 백엔드 데이터 적용
                    const baseData = getChallengeDetail(id) as PortfolioChallengeDetail;
                    const backendBasedData = {
                        ...baseData,
                        id: backendChallenge.id,
                        title: `포트폴리오 챌린지: ${backendChallenge.title}`,
                        subtitle: backendChallenge.title,
                        description: backendDescription || baseData.description,
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
                    if (!backendDescription && !ruleData?.must && !ruleData?.mustHave) {
                        import('../../api/monthlyChallenge').then(({ fetchMonthlyChallenge }) => {
                            fetchMonthlyChallenge()
                                .then((monthlyData) => {
                                    if (!backendDescription) {
                                        setData(prev => prev ? {
                                            ...prev,
                                            description: monthlyData.description || prev.description,
                                        } : prev);
                                    }
                                    if (!ruleData?.must && !ruleData?.mustHave) {
                                        setMustHave(monthlyData.mustHave || []);
                                    }
                                })
                                .catch((err) => {
                                    // AI 데이터 로딩 실패는 무시
                                });
                        });
                    }
                } else {
                    // 포트폴리오가 아닌 경우 에러 처리
                    setData(null);
                    setMustHave([]);
                }
            } catch (err) {
                // 에러 시 null로 설정하여 에러 상태 표시
                setData(null);
                setMustHave([]);
            } finally {
                setLoading(false);
            }
        };

        loadChallengeData();
    }, [id]);

    const [tab, setTab] = useState<"edit" | "preview">("edit");
    const [successToast, setSuccessToast] = useState<{ visible: boolean; message: string }>({
        visible: false,
        message: ''
    });
    const [cropOpen, setCropOpen] = useState(false);
    const [cropSrc, setCropSrc] = useState<string | null>(null);
    const [form, setForm] = useState<PortfolioSubmitPayload>({
        title: "",
        repoUrl: "",
        demoUrl: "",
        desc: "",
        teamType: "SOLO",
        teamName: "",
        membersText: "",
        language: "",
        coverUrl: "",
        images: [],
    });

    // 수정 모드일 때 기존 제출물 로드
    useEffect(() => {
        if (isEditMode && editSubmissionId) {
            const loadSubmission = async () => {
                try {
                    const submission = await fetchChallengeSubmissionDetail(id, editSubmissionId);
                    
                    // 백엔드 응답에서 포트폴리오 메타 추출 (portfolio 객체가 없을 수 있음)
                    setForm({
                        title: submission.title || "",
                        repoUrl: submission.repoUrl || "",
                        demoUrl: submission.demoUrl || "",
                        desc: submission.desc || "",
                        teamType: submission.participationType === "TEAM" ? "TEAM" : "SOLO",
                        teamName: submission.teamName || "",
                        membersText: submission.membersText || "",
                        language: submission.portfolio?.language || "",
                        coverUrl: submission.coverUrl || "",
                        images: submission.assets?.map(asset => asset.url) || [],
                    });
                } catch (error) {
                    console.error('제출물 로드 실패:', error);
                    setSuccessToast({
                        visible: true,
                        message: '제출물을 불러올 수 없습니다.'
                    });
                }
            };
            loadSubmission();
        }
    }, [isEditMode, editSubmissionId, id]);

    // ✅ 제목 또는 설명만 있어도 제출 가능 (제출 기간일 때만)
    const parseTs = (v?: string) => {
        if (!v) return null;
        const s = v.includes('T') ? v : v.replace(' ', 'T');
        const d = new Date(s);
        return isNaN(d.getTime()) ? null : d;
    };
    const derivedStage: "SUBMISSION_OPEN" | "VOTE_WAITING" | "VOTING" | "ENDED" = (() => {
        const now = new Date();
        const endAt = parseTs(timeline.endAt);
        const vStart = parseTs(timeline.voteStartAt);
        const vEnd = parseTs(timeline.voteEndAt);
        if (vEnd && now > vEnd) return "ENDED";
        if (vStart && now >= vStart) return "VOTING";
        if (endAt && now >= endAt) return "VOTE_WAITING";
        return "SUBMISSION_OPEN";
    })();
    const isChallengeEnded = derivedStage === "ENDED";
    const canSubmit = (!!form.title.trim() || !!form.desc?.trim()) && derivedStage === "SUBMISSION_OPEN";

    // 이미지 크롭 핸들러
    const handleCropDone = async (
        square: { blob: Blob; url: string },
        rect: { blob: Blob; url: string }
    ) => {
        try {
            // 3:4 비율의 직사각형 이미지 사용
            const file = new File([rect.blob], "cover.jpg", { type: "image/jpeg" });
            
            console.log("🖼️ 커버 이미지 업로드 시도:", {
                fileName: file.name,
                fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
                fileType: file.type,
                blobSize: rect.blob.size,
                timestamp: new Date().toISOString()
            });
            
            const uploadedUrl = await UserApi.uploadImage(file);
            
            console.log("✅ 커버 이미지 업로드 성공:", uploadedUrl);
            
            setForm(prev => ({ ...prev, coverUrl: uploadedUrl }));
            setSuccessToast({
                visible: true,
                message: "커버 이미지가 업로드되었습니다."
            });
        } catch (error: any) {
            console.error("❌ 커버 이미지 업로드 실패:", {
                error,
                status: error?.response?.status,
                statusText: error?.response?.statusText,
                data: error?.response?.data,
                message: error?.message,
                config: error?.config ? {
                    url: error.config.url,
                    method: error.config.method,
                    headers: error.config.headers
                } : null
            });
            
            let errorMessage = "이미지 업로드에 실패했습니다. 다시 시도해주세요.";
            
            if (error?.response?.status === 500) {
                const serverMessage = error?.response?.data?.message || "서버 오류가 발생했습니다.";
                errorMessage = `서버 오류: ${serverMessage}`;
                console.error("🔥 서버 500 오류 상세:", error?.response?.data);
            } else if (error?.response?.status === 413) {
                errorMessage = "이미지 파일이 너무 큽니다. 더 작은 파일을 선택해주세요.";
            } else if (error?.response?.status === 400) {
                errorMessage = error?.response?.data?.message || "잘못된 이미지 파일입니다.";
            } else if (error?.response?.status === 415) {
                errorMessage = "지원하지 않는 파일 형식입니다.";
            } else if (!error?.response) {
                errorMessage = "네트워크 오류가 발생했습니다.";
            }
            
            setSuccessToast({
                visible: true,
                message: errorMessage
            });
        }
        setCropOpen(false);
        setCropSrc(null);
    };

    // 이미지 업로드 핸들러 (크롭 모달 열기)
    const handleImageUpload = async (file: File) => {
        try {
            const result = await processImageFile(file);
            if (!result.ok) {
                setSuccessToast({
                    visible: true,
                    message: "이미지 파일 형식이 올바르지 않거나 용량이 너무 큽니다."
                });
                return;
            }
            
            // 크롭 모달 열기
            const url = URL.createObjectURL(file);
            setCropSrc(url);
            setCropOpen(true);
        } catch (error) {
            setSuccessToast({
                visible: true,
                message: "이미지 처리에 실패했습니다. 다시 시도해주세요."
            });
        }
    };

    const handleSubmit = async () => {
        if (!canSubmit) return;
        
        try {
            const submissionData: SubmissionCreateRequest = {
                title: form.title.trim(),
                desc: form.desc?.trim() || "설명 미입력",
                repoUrl: form.repoUrl?.trim() || "",
                demoUrl: form.demoUrl?.trim(),
                coverUrl: form.coverUrl,
                participationType: form.teamType === "TEAM" ? "TEAM" : "SOLO",
                teamName: form.teamName?.trim(),
                membersText: form.membersText?.trim(),
                assets: form.images?.map(url => ({ url, mime: "image/jpeg" })) || [],
                portfolio: form.language ? {
                    language: form.language.trim()
                } : undefined
            };

            if (isEditMode && editSubmissionId) {
                // 수정 모드
                await updateChallengeSubmission(id, editSubmissionId, submissionData);
                setSuccessToast({
                    visible: true,
                    message: "제출물이 수정되었습니다."
                });
                nav(`/challenge/portfolio/${id}/projects/${editSubmissionId}`, { replace: true });
            } else {
                // 생성 모드
                await createChallengeSubmission(id, submissionData);
                setSuccessToast({
                    visible: true,
                    message: "제출이 접수되었습니다."
                });
                nav(`/challenge/portfolio/${id}/vote`, { replace: true });
            }
        } catch (error: any) {
            
            let errorMessage = isEditMode ? "수정에 실패했습니다. 다시 시도해주세요." : "제출에 실패했습니다. 다시 시도해주세요.";
            
            // 중복 제출 에러 처리
            if (error?.response?.status === 409) {
                errorMessage = "이미 제출물이 있습니다. 기존 제출물을 수정하거나 삭제 후 다시 제출해주세요.";
            } else if (error?.response?.status === 400) {
                const serverMessage = error?.response?.data?.message;
                if (serverMessage) {
                    if (serverMessage.includes("Submission closed")) {
                        errorMessage = "제출 기간이 종료되었습니다.";
                    } else {
                        errorMessage = serverMessage;
                    }
                } else {
                    errorMessage = "입력 정보를 확인해주세요.";
                }
            } else if (error?.response?.status === 404) {
                errorMessage = "존재하지 않는 챌린지입니다. 챌린지 목록에서 확인해주세요.";
            } else if (error?.response?.status === 500) {
                const serverMessage = error?.response?.data?.message || "서버 오류가 발생했습니다.";
                errorMessage = `서버 오류: ${serverMessage}`;
            } else if (error?.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            
            setSuccessToast({
                visible: true,
                message: errorMessage
            });
        }
    };

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
                
                {loading ? (
                    /* 로딩 상태 - 전체 화면 */
                    <div className="flex items-center justify-center py-16">
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-3 text-neutral-600 dark:text-neutral-300 mb-4">
                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-emerald-500 dark:border-neutral-600"></div>
                                <span className="text-lg font-medium">AI 챌린지 정보를 불러오는 중...</span>
                            </div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">잠시만 기다려주세요</p>
                        </div>
                    </div>
                ) : challengeExists === false ? (
                    /* 챌린지가 존재하지 않는 경우 */
                    <div className="flex items-center justify-center py-16">
                        <div className="text-center">
                            <div className="text-red-600 dark:text-red-400 text-lg font-medium mb-4">
                                존재하지 않는 챌린지입니다
                            </div>
                            <p className="text-gray-600 dark:text-neutral-400 mb-6">
                                챌린지 ID {id}가 존재하지 않습니다. 챌린지 목록에서 확인해주세요.
                            </p>
                            <CTAButton as="button" onClick={() => nav('/challenge')}>
                                챌린지 목록으로 돌아가기
                            </CTAButton>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="mb-4 flex items(center) gap-2">
                            <button
                                onClick={() => nav(`/challenge/portfolio/${id}`)}
                                aria-label="뒤로가기"
                                className="mr-1 inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            >
                                <ChevronLeft className="h-5 w-5 dark:text-white" />
                            </button>
                            <h1 className="text-[20px] font-extrabold tracking-[-0.01em] md:text-[22px] dark:text-white">
                                {data?.title || '포트폴리오 챌린지'} — {isEditMode ? '프로젝트 수정' : '프로젝트 제출'}
                            </h1>
                        </div>

            <SectionCard className="!px-5 !py-5 mb-4">
                <div className="text-[13.5px] leading-7 text-neutral-800 dark:text-neutral-200 whitespace-pre-line">{data?.description || '포트폴리오 챌린지에 참여해보세요.'}</div>
                
                {/* 필수 조건 섹션 - AI API의 mustHave 데이터 사용 */}
                {mustHave.length > 0 && (
                    <div className="mt-4">
                        <h3 className="text-[14px] font-semibold text-neutral-900 dark:text-white mb-2">📋 필수 조건</h3>
                        <ul className="list-disc pl-5 text-[13.5px] leading-7 text-neutral-800 dark:text-neutral-200 space-y-1">
                            {mustHave.map((requirement, index) => (
                                <li key={index}>{requirement}</li>
                            ))}
                        </ul>
                    </div>
                )}
                
                {/* 기본 안내사항 */}
                <div className="mt-4">
                    <h3 className="text-[14px] font-semibold text-neutral-900 dark:text-white mb-2">ℹ️ 제출 안내</h3>
                    <ul className="list-disc pl-5 text-[13.5px] leading-7 text-neutral-800 dark:text-neutral-200 space-y-1">
                        <li>이 챌린지는 <b>사용자 투표 100%</b>로 순위가 결정돼요.</li>
                        <li>GitHub 레포는 public 권장(또는 제출 후 접근 권한 안내).</li>
                        <li>데모 URL이 없어도 설명만 제출해도 됩니다.</li>
                    </ul>
                </div>
            </SectionCard>

            <div className="mb-3 flex gap-2">
                <button
                    onClick={() => setTab("edit")}
                    className={`rounded-full px-3 py-1.5 text-[13px] ${tab === "edit" ? "bg-emerald-600 text-white" : "border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50 dark:bg-neutral-800 dark:text-white dark:border-neutral-600 dark:hover:bg-neutral-700"}`}
                >
                    작성
                </button>
                <button
                    onClick={() => setTab("preview")}
                    className={`rounded-full px-3 py-1.5 text-[13px] ${tab === "preview" ? "bg-emerald-600 text-white" : "border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50 dark:bg-neutral-800 dark:text-white dark:border-neutral-600 dark:hover:bg-neutral-700"}`}
                >
                    미리보기
                </button>
            </div>

            <div>
                {tab === "edit" ? (
                    <SectionCard className="!px-5 !py-5">
                        <div className="space-y-4">
                            <Row>
                                <Label>프로젝트 제목</Label>
                                <input
                                    className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[13.5px] outline-none focus:border-emerald-500 dark:bg-neutral-800 dark:text-white dark:border-neutral-600 dark:placeholder-neutral-500"
                                    value={form.title}
                                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                                    placeholder="예) 레트로 감성 블로그"
                                />
                            </Row>

                            <Row>
                                <Label>참여 형태</Label>
                                <div className="flex gap-4 text-[13.5px]">
                                    <label className="inline-flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="teamType"
                                            checked={form.teamType === "SOLO"}
                                            onChange={() => setForm((f) => ({ ...f, teamType: "SOLO", teamName: "", membersText: "" }))}
                                            className="w-4 h-4 text-emerald-600 border-neutral-300 focus:ring-emerald-500"
                                        />
                                        <span className={form.teamType === "SOLO" ? "text-emerald-600 font-medium" : "text-neutral-700 dark:text-neutral-300"}>개인</span>
                                    </label>
                                    <label className="inline-flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="teamType"
                                            checked={form.teamType === "TEAM"}
                                            onChange={() => setForm((f) => ({ ...f, teamType: "TEAM" }))}
                                            className="w-4 h-4 text-emerald-600 border-neutral-300 focus:ring-emerald-500"
                                        />
                                        <span className={form.teamType === "TEAM" ? "text-emerald-600 font-medium" : "text-neutral-700 dark:text-neutral-300"}>팀</span>
                                    </label>
                                </div>
                            </Row>
                            
                            {form.teamType === "TEAM" && (
                                <Row>
                                    <Label>팀명</Label>
                                    <input
                                        className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[13.5px] outline-none focus:border-emerald-500 dark:bg-neutral-800 dark:text-white dark:border-neutral-600 dark:placeholder-neutral-500"
                                        value={form.teamName}
                                        onChange={(e) => setForm((f) => ({ ...f, teamName: e.target.value }))}
                                        placeholder="예) 레트로감성조"
                                    />
                                </Row>
                            )}

                            {form.teamType === "TEAM" && (
                                <Row>
                                    <Label>구성원/역할</Label>
                                    <textarea
                                        rows={4}
                                        className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[13.5px] outline-none focus:border-emerald-500 dark:bg-neutral-800 dark:text-white dark:border-neutral-600 dark:placeholder-neutral-500"
                                        value={form.membersText}
                                        onChange={(e) => setForm((f) => ({ ...f, membersText: e.target.value }))}
                                        placeholder={"예)\n민준 - 프론트엔드\n소희 - 디자인/UI"}
                                    />
                                </Row>
                            )}

                            <Row>
                                <Label>GitHub 링크</Label>
                                <input
                                    className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[13.5px] outline-none focus:border-emerald-500 dark:bg-neutral-800 dark:text-white dark:border-neutral-600 dark:placeholder-neutral-500"
                                    value={form.repoUrl}
                                    onChange={(e) => setForm((f) => ({ ...f, repoUrl: e.target.value }))}
                                    placeholder="https://github.com/team/repo"
                                />
                            </Row>

                            <Row>
                                <Label>데모 URL</Label>
                                <input
                                    className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[13.5px] outline-none focus:border-emerald-500 dark:bg-neutral-800 dark:text-white dark:border-neutral-600 dark:placeholder-neutral-500"
                                    value={form.demoUrl}
                                    onChange={(e) => setForm((f) => ({ ...f, demoUrl: e.target.value }))}
                                    placeholder="https://your-demo.example.com"
                                />
                            </Row>

                            <Row>
                                <Label>기술 스택/언어</Label>
                                <CustomDropdown
                                    value={form.language || ""}
                                    onChange={(value) => setForm((f) => ({ ...f, language: value }))}
                                    options={languageOptions}
                                    placeholder="선택해주세요"
                                />
                            </Row>

                            <Row>
                                <Label>커버 이미지</Label>
                                <div className="space-y-3">
                                    {/* 4:3 비율 컨테이너 */}
                                    <div className="relative w-full max-w-md mx-auto">
                                        <div className={`relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-neutral-50 dark:bg-neutral-800 ${form.coverUrl ? 'border border-neutral-300 dark:border-neutral-600' : 'border-2 border-dashed border-neutral-300 dark:border-neutral-600'}`}>
                                            {form.coverUrl ? (
                                                <>
                                                    <img 
                                                        src={form.coverUrl} 
                                                        alt="커버 이미지 미리보기" 
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setForm(prev => ({ ...prev, coverUrl: "" }));
                                                            setSuccessToast({
                                                                visible: true,
                                                                message: "커버 이미지가 제거되었습니다."
                                                            });
                                                        }}
                                                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                                                    >
                                                        ×
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full text-neutral-500 dark:text-neutral-400">
                                                    <div className="text-center">
                                                        <div className="w-12 h-12 mx-auto mb-3 bg-neutral-200 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                        <p className="text-sm font-medium mb-1">이미지 추가</p>
                                                        <p className="text-xs">클릭하여 업로드</p>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* 숨겨진 파일 입력 - 이미지가 없을 때만 활성화 */}
                                            {!form.coverUrl && (
                                                <input
                                                    type="file"
                                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleImageUpload(file);
                                                        e.currentTarget.value = "";
                                                    }}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                            )}
                                        </div>
                                    </div>
                                    
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
                                        권장 사이즈: 4:3 비율, 최대 10MB (JPG, PNG, WebP 지원)
                                    </p>
                                </div>
                            </Row>

                            <Row>
                                <Label>추가 이미지</Label>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {form.images?.map((imageUrl, index) => (
                                            <div key={index} className="relative">
                                                <img 
                                                    src={imageUrl} 
                                                    alt={`추가 이미지 ${index + 1}`}
                                                    className="w-full aspect-[4/3] object-cover rounded-lg border border-neutral-300"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setForm(prev => ({
                                                        ...prev,
                                                        images: prev.images?.filter((_, i) => i !== index) || []
                                                    }))}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <ImageUploadSection 
                                        onAdd={async (file) => {
                                            try {
                                                const result = await processImageFile(file);
                                                if (!result.ok) {
                                                    setSuccessToast({
                                                        visible: true,
                                                        message: "이미지 파일 형식이 올바르지 않거나 용량이 너무 큽니다."
                                                    });
                                                    return;
                                                }
                                                
                                                console.log("📸 추가 이미지 업로드 시도:", {
                                                    fileName: file.name,
                                                    fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
                                                    fileType: file.type
                                                });
                                                
                                                const uploadResult = await uploadImage(file);
                                                
                                                console.log("✅ 추가 이미지 업로드 성공:", uploadResult.url);
                                                
                                                setForm(prev => ({
                                                    ...prev,
                                                    images: [...(prev.images || []), uploadResult.url]
                                                }));
                                                setSuccessToast({
                                                    visible: true,
                                                    message: "이미지가 추가되었습니다."
                                                });
                                            } catch (error: any) {
                                                console.error("❌ 추가 이미지 업로드 실패:", {
                                                    error,
                                                    status: error?.response?.status,
                                                    data: error?.response?.data
                                                });
                                                
                                                let errorMessage = "이미지 업로드에 실패했습니다. 다시 시도해주세요.";
                                                
                                                if (error?.response?.status === 500) {
                                                    errorMessage = `서버 오류: ${error?.response?.data?.message || "서버 오류가 발생했습니다."}`;
                                                } else if (error?.response?.status === 413) {
                                                    errorMessage = "이미지 파일이 너무 큽니다.";
                                                }
                                                
                                                setSuccessToast({
                                                    visible: true,
                                                    message: errorMessage
                                                });
                                            }
                                        }}
                                    />
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                        프로젝트 스크린샷이나 추가 이미지를 업로드할 수 있습니다.
                                    </p>
                                </div>
                            </Row>

                            <Row>
                                <Label>포트폴리오 설명</Label>
                                <textarea
                                    rows={6}
                                    className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[13.5px] outline-none focus:border-emerald-500 dark:bg-neutral-800 dark:text-white dark:border-neutral-600 dark:placeholder-neutral-500"
                                    value={form.desc}
                                    onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
                                    placeholder="포트폴리오에 대해서 간략하게 설명해주세요."
                                />
                            </Row>

                            {/* 종료된 챌린지 안내 */}
                            {derivedStage !== "SUBMISSION_OPEN" && (
                                <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg dark:bg-neutral-800 dark:border-neutral-700">
                                    <div className="flex items-center gap-2 text-gray-700 dark:text-neutral-300">
                                        <span className="text-lg">🔒</span>
                                        <div>
                                            <div className="font-semibold dark:text-white">제출 불가</div>
                                            <div className="text-sm text-gray-600 dark:text-neutral-400">제출 마감 이후에는 제출할 수 없습니다. 투표 시작 전까지는 제출물만 확인할 수 있어요.</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <CTAButton 
                                    as="button" 
                                    onClick={handleSubmit} 
                                    disabled={!canSubmit}
                                >
                                    {derivedStage !== "SUBMISSION_OPEN" ? (isEditMode ? "수정 불가" : "제출 불가") : (isEditMode ? "수정하기" : "제출하기")}
                                </CTAButton>
                            </div>
                        </div>
                    </SectionCard>
                ) : (
                    <SectionCard className="!px-5 !py-5">
                        <h3 className="mb-3 text-[15px] font-bold dark:text-white">🖼️ 미리보기</h3>
                        <div className="grid gap-4 md:grid-cols-[2fr_3fr]">
                            {/* 좌측: 커버 이미지 (폼과 동일 4:3) */}
                            <div className="relative w-full">
                                <div className="relative w-full aspect-[4/3] overflow-hidden rounded-lg border bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-600">
                                    {form.coverUrl ? (
                                        <img src={form.coverUrl} alt="커버 이미지" className="absolute inset-0 w-full h-full object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-neutral-400 dark:text-neutral-500 text-sm">커버 이미지 없음</div>
                                    )}
                                </div>
                            </div>

                            {/* 우측: 입력폼과 동일한 정보 구성 */}
                            <div className="space-y-3 text-[13.5px] leading-7 dark:text-neutral-200">
                                <div>
                                    <div className="text-[16px] font-extrabold tracking-[-0.01em] dark:text-white">{form.title || "제목 미입력"}</div>
                                    {form.summary && <div className="text-neutral-600 dark:text-neutral-400 mt-1">{form.summary}</div>}
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-full border text-neutral-700 dark:text-neutral-300 dark:border-neutral-600">{form.teamType === "TEAM" ? "팀" : "개인"}</span>
                                    {form.teamType === "TEAM" && form.teamName && (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700">{form.teamName}</span>
                                    )}
                                    {form.language && (
                                        <span className="ml-1 px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 border dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-600">{form.language}</span>
                                    )}
                                </div>

                                {form.teamType === "TEAM" && form.membersText && (
                                    <div className="whitespace-pre-wrap">
                                        <span className="font-semibold">구성원/역할: </span>{"\n"}{form.membersText}
                                    </div>
                                )}

                                <div className="space-y-1">
                                    {form.repoUrl && (
                                        <div>
                                            <span className="font-semibold">GitHub: </span>
                                            <a className="text-emerald-700 dark:text-emerald-400 underline break-all" href={form.repoUrl} target="_blank" rel="noreferrer">{form.repoUrl}</a>
                                        </div>
                                    )}
                                    {form.demoUrl && (
                                        <div>
                                            <span className="font-semibold">데모: </span>
                                            <a className="text-emerald-700 dark:text-emerald-400 underline break-all" href={form.demoUrl} target="_blank" rel="noreferrer">{form.demoUrl}</a>
                                        </div>
                                    )}
                                </div>

                                {form.desc && (
                                    <div className="whitespace-pre-wrap">
                                        <span className="font-semibold">설명: </span>{form.desc}
                                    </div>
                                )}

                                {form.images && form.images.length > 0 && (
                                    <div>
                                        <div className="font-semibold mb-1">추가 이미지</div>
                                        <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                                            {form.images.map((imageUrl, index) => (
                                                <div key={index} className="w-full aspect-[4/3] rounded border overflow-hidden">
                                                    <img src={imageUrl} alt={`추가 이미지 ${index + 1}`} className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 종료된 챌린지 안내 */}
                        {derivedStage !== "SUBMISSION_OPEN" && (
                            <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                <div className="flex items-center gap-2 text-gray-700">
                                    <span className="text-lg">🔒</span>
                                    <div>
                                        <div className="font-semibold">제출 불가</div>
                                        <div className="text-sm text-gray-600">제출 마감 이후에는 제출할 수 없습니다. 투표 시작 전까지는 제출물만 확인할 수 있어요.</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-4 flex justify-end">
                            <CTAButton 
                                as="button" 
                                onClick={handleSubmit} 
                                disabled={!canSubmit}
                            >
                            {derivedStage !== "SUBMISSION_OPEN" ? (isEditMode ? "수정 불가" : "제출 불가") : (isEditMode ? "수정하기" : "제출하기")}
                            </CTAButton>
                        </div>
                    </SectionCard>
                )}

                <SectionCard className="!px-5 !py-5">
                    <h3 className="mb-3 text-[15px] font-bold">📌 제출 가이드</h3>
                    <GreenBox>
                        <ul className="list-disc pl-5 text-[13.5px] leading-7 text-neutral-800">
                            <li>투표 기간 중에는 작품이 리스트에 공개돼요.</li>
                            <li>표절/저작권 침해 금지, 참고 자료는 출처를 적어주세요.</li>
                            <li>팀 구성 시 역할과 기여도를 설명에 간단히 써 주세요.</li>
                        </ul>
                    </GreenBox>
                </SectionCard>
            </div>
            
                        {/* 크롭 모달 */}
                        {cropOpen && cropSrc && (
                            <CoverCropper 
                                open={cropOpen} 
                                src={cropSrc} 
                                onClose={() => {
                                    setCropOpen(false);
                                    setCropSrc(null);
                                }} 
                                onCropped={handleCropDone} 
                            />
                        )}
                    </>
                )}
            </div>
        </>
    );
}
