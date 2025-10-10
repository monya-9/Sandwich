import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import LoginRequiredModal from "../../components/common/modal/LoginRequiredModal";
import { SectionCard, CTAButton, Row, Label, GreenBox } from "../../components/challenge/common";
import { getChallengeDetail } from "../../data/Challenge/challengeDetailDummy";
import type { PortfolioChallengeDetail } from "../../data/Challenge/challengeDetailDummy";
import { ChevronLeft } from "lucide-react";
import { addPortfolioProject } from "../../data/Challenge/submissionsDummy";
import Toast from "../../components/common/Toast";
import { useUserInfo } from "../../hooks/useUserInfo";
import { uploadImage } from "../../api/projectApi";
import ImageUploadSection, { processImageFile } from "../../components/ProjectMangeSample/ImageUploadSection";
import CoverCropper from "../../components/ProjectMangeSample/CoverCropper";
import CustomDropdown from "../../components/common/CustomDropdown";

type PortfolioSubmitPayload = {
    title: string;
    repoUrl?: string;
    demoUrl?: string;
    desc?: string;
    teamType?: "SOLO" | "TEAM";
    teamName?: string;
    membersText?: string;
    language?: string;
    coverUrl?: string;
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
    const data = useMemo(() => getChallengeDetail(id) as PortfolioChallengeDetail, [id]);

    const { isLoggedIn } = useContext(AuthContext);
    const [loginOpen, setLoginOpen] = useState(false);
    const nav = useNavigate();
    const userInfo = useUserInfo();

    useEffect(() => { if (!isLoggedIn) setLoginOpen(true); }, [isLoggedIn]);

    const [tab, setTab] = useState<"edit" | "preview">("edit");
    const [successToast, setSuccessToast] = useState<{ visible: boolean; message: string }>({
        visible: false,
        message: ''
    });
    const [cropOpen, setCropOpen] = useState(false);
    const [cropSrc, setCropSrc] = useState<string | null>(null);
    const [form, setForm] = useState<PortfolioSubmitPayload>({
        title: data.title.replace(/^포트폴리오 챌린지:\s*/, ""),
        repoUrl: data.submitExample?.repoUrl || "",
        demoUrl: data.submitExample?.demoUrl || "",
        desc: data.submitExample?.desc || "",
        teamType: "SOLO",
        teamName: "",
        membersText: "",
        language: "",
        coverUrl: "",
    });

    // ✅ 제목 또는 설명만 있어도 제출 가능
    const canSubmit = !!form.title.trim() || !!form.desc?.trim();

    // 이미지 크롭 핸들러
    const handleCropDone = async (
        square: { blob: Blob; url: string },
        rect: { blob: Blob; url: string }
    ) => {
        try {
            // 3:4 비율의 직사각형 이미지 사용
            const file = new File([rect.blob], "cover.jpg", { type: "image/jpeg" });
            const uploadResult = await uploadImage(file);
            setForm(prev => ({ ...prev, coverUrl: uploadResult.url }));
            setSuccessToast({
                visible: true,
                message: "커버 이미지가 업로드되었습니다."
            });
        } catch (error) {
            setSuccessToast({
                visible: true,
                message: "이미지 업로드에 실패했습니다. 다시 시도해주세요."
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

    const handleSubmit = () => {
        if (!canSubmit) return;
        addPortfolioProject(id, {
            title: form.title.trim(),
            summary: form.desc?.trim() || "설명 미입력",
            demoUrl: form.demoUrl?.trim(),
            repoUrl: form.repoUrl?.trim(),
            authorInitial: userInfo.authorInitial,
            authorName: userInfo.authorName,
            teamName: form.teamName?.trim() || undefined,
            authorRole: userInfo.authorRole,
        });
        setSuccessToast({
            visible: true,
            message: "제출이 접수되었습니다."
        });
        nav(`/challenge/portfolio/${id}/vote`, { replace: true });
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
            <div className="mb-4 flex items(center) gap-2">
                <button
                    onClick={() => nav(`/challenge/portfolio/${id}`)}
                    aria-label="뒤로가기"
                    className="mr-1 inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <h1 className="text-[20px] font-extrabold tracking-[-0.01em] md:text-[22px]">
                    {data.title} — 프로젝트 제출
                </h1>
            </div>

            <SectionCard className="!px-5 !py-5 mb-4">
                <div className="text-[13.5px] leading-7 text-neutral-800 whitespace-pre-line">{data.description}</div>
                <ul className="mt-3 list-disc pl-5 text-[13.5px] leading-7 text-neutral-800">
                    <li>이 챌린지는 <b>사용자 투표 100%</b>로 순위가 결정돼요.</li>
                    <li>GitHub 리포는 public 권장(또는 제출 후 접근 권한 안내).</li>
                    <li>이미지/영상은 S3 Presigned 업로드 후 <code className="font-mono">s3Key</code>만 전달 권장.</li>
                    <li>데모 URL이 없어도 설명만 제출해도 됩니다.</li>
                </ul>
            </SectionCard>

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

            <div>
                {tab === "edit" ? (
                    <SectionCard className="!px-5 !py-5">
                        <div className="space-y-4">
                            <Row>
                                <Label>프로젝트 제목</Label>
                                <input
                                    className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[13.5px] outline-none focus:border-emerald-500"
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
                                        <span className={form.teamType === "SOLO" ? "text-emerald-600 font-medium" : "text-neutral-700"}>개인</span>
                                    </label>
                                    <label className="inline-flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="teamType"
                                            checked={form.teamType === "TEAM"}
                                            onChange={() => setForm((f) => ({ ...f, teamType: "TEAM" }))}
                                            className="w-4 h-4 text-emerald-600 border-neutral-300 focus:ring-emerald-500"
                                        />
                                        <span className={form.teamType === "TEAM" ? "text-emerald-600 font-medium" : "text-neutral-700"}>팀</span>
                                    </label>
                                </div>
                            </Row>
                            
                            {form.teamType === "TEAM" && (
                                <Row>
                                    <Label>팀명</Label>
                                    <input
                                        className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[13.5px] outline-none focus:border-emerald-500"
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
                                        className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[13.5px] outline-none focus:border-emerald-500"
                                        value={form.membersText}
                                        onChange={(e) => setForm((f) => ({ ...f, membersText: e.target.value }))}
                                        placeholder={"예)\n민준 - 프론트엔드\n소희 - 디자인/UI"}
                                    />
                                </Row>
                            )}

                            <Row>
                                <Label>GitHub 링크</Label>
                                <input
                                    className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[13.5px] outline-none focus:border-emerald-500"
                                    value={form.repoUrl}
                                    onChange={(e) => setForm((f) => ({ ...f, repoUrl: e.target.value }))}
                                    placeholder="https://github.com/team/repo"
                                />
                            </Row>

                            <Row>
                                <Label>데모 URL</Label>
                                <input
                                    className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[13.5px] outline-none focus:border-emerald-500"
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
                                    {form.coverUrl && (
                                        <div className="relative">
                                            <img 
                                                src={form.coverUrl} 
                                                alt="커버 이미지 미리보기" 
                                                className="w-full max-w-md h-48 object-cover rounded-lg border border-neutral-300"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setForm(prev => ({ ...prev, coverUrl: "" }))}
                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    )}
                                    <ImageUploadSection onAdd={handleImageUpload} />
                                    <p className="text-xs text-neutral-500">
                                        권장 사이즈: 4:3 비율, 최대 10MB (JPG, PNG, WebP 지원)
                                    </p>
                                </div>
                            </Row>

                            <Row>
                                <Label>프로젝트 설명</Label>
                                <textarea
                                    rows={6}
                                    className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[13.5px] outline-none focus:border-emerald-500"
                                    value={form.desc}
                                    onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
                                    placeholder="기술 스택, 구현 포인트, 스크린샷/영상 링크 등을 적어주세요."
                                />
                            </Row>

                            <div className="flex justify-end">
                                <CTAButton as="button" onClick={handleSubmit} disabled={!canSubmit}>
                                    제출하기
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
                                <div><span className="font-semibold">참여 형태: </span>{form.teamType === "SOLO" ? "개인" : "팀"}</div>
                                {form.teamName && <div><span className="font-semibold">팀명: </span>{form.teamName}</div>}
                                {form.teamType === "TEAM" && form.membersText && (
                                    <div className="whitespace-pre-wrap">
                                        <span className="font-semibold">구성원: </span>{"\n"}{form.membersText}
                                    </div>
                                )}
                                {form.language && <div><span className="font-semibold">기술 스택: </span>{form.language}</div>}
                                {form.coverUrl && (
                                    <div>
                                        <span className="font-semibold">커버 이미지: </span>
                                        <img 
                                            src={form.coverUrl} 
                                            alt="커버 이미지" 
                                            className="mt-2 w-full max-w-xs h-32 object-cover rounded border"
                                        />
                                    </div>
                                )}
                                {form.repoUrl && <div><span className="font-semibold">GitHub: </span>{form.repoUrl}</div>}
                                {form.demoUrl && <div><span className="font-semibold">데모: </span>{form.demoUrl}</div>}
                                {form.desc && (
                                    <div className="whitespace-pre-wrap"><span className="font-semibold">설명: </span>{form.desc}</div>
                                )}
                            </div>
                        </GreenBox>

                        <div className="mt-4 flex justify-end">
                            <CTAButton as="button" onClick={handleSubmit} disabled={!canSubmit}>
                                제출하기
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
    );
}
