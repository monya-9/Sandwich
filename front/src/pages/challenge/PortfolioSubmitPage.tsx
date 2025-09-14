import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import LoginRequiredModal from "../../components/common/modal/LoginRequiredModal";
import { SectionCard, CTAButton } from "../../components/challenge/common";
import { getChallengeDetail } from "../../data/Challenge/challengeDetailDummy";
import type { PortfolioChallengeDetail } from "../../data/Challenge/challengeDetailDummy";
import { challengeApi } from "../../api/challengeApi";
import { ChevronLeft } from "lucide-react";

type PortfolioSubmitPayload = {
    title: string;
    repoUrl?: string;
    demoUrl?: string;
    desc?: string;
    teamType?: "SOLO" | "TEAM";
    teamName?: string;
    membersText?: string;
};

const Row = ({ children }: { children: React.ReactNode }) => <div className="flex flex-col gap-1">{children}</div>;
const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="text-[13px] font-semibold text-neutral-800">{children}</label>
);
const Help = ({ children }: { children: React.ReactNode }) => <p className="text-[12px] text-neutral-500">{children}</p>;
const GreenBox = ({ children }: { children: React.ReactNode }) => (
    <div className="rounded-xl border-2 border-emerald-300/70 bg-white p-3">{children}</div>
);

export default function PortfolioSubmitPage() {
    const { id: idStr } = useParams();
    const id = Number(idStr || 2);
    const data = useMemo(() => getChallengeDetail(id) as PortfolioChallengeDetail, [id]);

    const { isLoggedIn } = useContext(AuthContext);
    const [loginOpen, setLoginOpen] = useState(false);
    const nav = useNavigate();

    useEffect(() => {
        if (!isLoggedIn) setLoginOpen(true);
    }, [isLoggedIn]);

    const [tab, setTab] = useState<"edit" | "preview">("edit");
    const [form, setForm] = useState<PortfolioSubmitPayload>({
        title: data.title.replace(/^포트폴리오 챌린지:\s*/, ""),
        repoUrl: data.submitExample?.repoUrl || "",
        demoUrl: data.submitExample?.demoUrl || "",
        desc: data.submitExample?.desc || "",
        teamType: "SOLO",
        teamName: "",
        membersText: "",
    });

    const canSubmit = !!form.title.trim() && (!!form.repoUrl || !!form.demoUrl || !!form.desc);

    const handleSubmit = async () => {
        if (!canSubmit) return;

        const payload = {
            type: "PORTFOLIO" as const,
            title: form.title.trim(),
            repoUrl: form.repoUrl?.trim() || undefined,
            demoUrl: form.demoUrl?.trim() || undefined,
            desc: [
                form.desc?.trim() || "",
                form.teamType ? `\n[참여 형태] ${form.teamType === "SOLO" ? "개인" : "팀"}` : "",
                form.teamName ? `\n[팀명] ${form.teamName}` : "",
                form.membersText ? `\n[구성원]\n${form.membersText}` : "",
            ]
                .filter(Boolean)
                .join(""),
        };

        await challengeApi.createSubmission(id, payload as any);
        alert("제출이 접수되었습니다.");
        nav(`/challenge/portfolio/${id}`);
    };

    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-10">
            <LoginRequiredModal open={loginOpen && !isLoggedIn} onClose={() => setLoginOpen(false)} />

            {/* 헤더 */}
            <div className="mb-4 flex items-center gap-2">
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

            {/* 설명/가이드 */}
            <SectionCard className="!px-5 !py-5 mb-4">
                <div className="text-[13.5px] leading-7 text-neutral-800 whitespace-pre-line">{data.description}</div>
                <ul className="mt-3 list-disc pl-5 text-[13.5px] leading-7 text-neutral-800">
                    <li>이 챌린지는 <b>사용자 투표 100%</b>로 순위가 결정돼요.</li>
                    <li>GitHub 리포는 public 권장(또는 제출 후 접근 권한 안내).</li>
                    <li>이미지/영상은 S3 Presigned 업로드 후 <code className="font-mono">s3Key</code>만 전달 권장.</li>
                    <li>데모 URL이 없어도 설명만 제출해도 됩니다.</li>
                </ul>
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

                            <div className="grid gap-3 md:grid-cols-2">
                                <Row>
                                    <Label>참여 형태</Label>
                                    <div className="flex gap-3 text-[13.5px]">
                                        <label className="inline-flex items-center gap-1">
                                            <input
                                                type="radio"
                                                name="teamType"
                                                checked={form.teamType === "SOLO"}
                                                onChange={() => setForm((f) => ({ ...f, teamType: "SOLO" }))}
                                            />
                                            개인
                                        </label>
                                        <label className="inline-flex items-center gap-1">
                                            <input
                                                type="radio"
                                                name="teamType"
                                                checked={form.teamType === "TEAM"}
                                                onChange={() => setForm((f) => ({ ...f, teamType: "TEAM" }))}
                                            />
                                            팀
                                        </label>
                                    </div>
                                </Row>
                                <Row>
                                    <Label>팀명(팀일 경우)</Label>
                                    <input
                                        className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[13.5px] outline-none focus:border-emerald-500"
                                        value={form.teamName}
                                        onChange={(e) => setForm((f) => ({ ...f, teamName: e.target.value }))}
                                        placeholder="예) 레트로감성조"
                                    />
                                </Row>
                            </div>

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
                                {form.membersText && (
                                    <div className="whitespace-pre-wrap">
                                        <span className="font-semibold">구성원: </span>{"\n"}{form.membersText}
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

                {/* 우측 고정 가이드 */}
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
    );
}
