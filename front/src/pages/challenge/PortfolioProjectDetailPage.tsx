import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SectionCard, CTAButton } from "../../components/challenge/common";
import { ChevronLeft, Star, ExternalLink, Heart, Eye, MessageSquare, X } from "lucide-react";
import {
    getPortfolioProjects,
    getPortfolioComments,
    addPortfolioComment,
    incViewPortfolio,
    toggleLikePortfolio,
} from "../../data/Challenge/submissionsDummy";

function Stars({
                   value,
                   onChange,
                   label,
               }: {
    value: number;
    onChange: (v: number) => void;
    label: string;
}) {
    return (
        <div className="flex items-center gap-2">
            <span className="w-16 text-[13px]">{label}</span>
            {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => onChange(n)} aria-label={`${label} ${n}점`}>
                    <Star className={`h-5 w-5 ${n <= value ? "fill-yellow-400 stroke-yellow-400" : ""}`} />
                </button>
            ))}
        </div>
    );
}

export default function PortfolioProjectDetailPage() {
    const { id: idStr, projectId: pidStr } = useParams();
    const id = Number(idStr);
    const pid = Number(pidStr);
    const nav = useNavigate();

    const [item, setItem] = useState(() => getPortfolioProjects(id).find((p) => p.id === pid));
    const [comments, setComments] = useState(() => getPortfolioComments(pid));
    const [cText, setCText] = useState("");
    const [liked, setLiked] = useState(false);

    // 별점
    const [ux, setUx] = useState(0);
    const [tech, setTech] = useState(0);
    const [cre, setCre] = useState(0);
    const [plan, setPlan] = useState(0);

    // 간단 토스트
    const [toast, setToast] = useState<string>("");

    useEffect(() => {
        incViewPortfolio(id, pid);
        setItem(getPortfolioProjects(id).find((p) => p.id === pid));
    }, [id, pid]);

    if (!item) return <div className="p-6 text-[13.5px]">프로젝트를 찾을 수 없습니다.</div>;

    // ✅ 중복 제한 제거: 별점 모두 채웠는지만 체크
    const canVote = ux > 0 && tech > 0 && cre > 0 && plan > 0;

    const handleVote = () => {
        if (!canVote) {
            setToast("모든 항목에 별점을 주세요.");
            return;
        }
        // 서버 연동 전이므로 단순 성공 토스트만
        setToast(`투표 완료! (UI/UX:${ux} · 기술력:${tech} · 창의성:${cre} · 기획력:${plan})`);
        // 필요 시 목록으로 이동하려면 아래 주석 해제
        // nav(`/challenge/portfolio/${id}/vote`, { replace: true });
    };

    const submitComment = () => {
        const v = cText.trim();
        if (!v) return;
        addPortfolioComment(pid, v);
        setComments(getPortfolioComments(pid));
        setItem(getPortfolioProjects(id).find((p) => p.id === pid)); // 댓글 수 갱신
        setCText("");
        setToast("댓글이 등록됐어요.");
    };

    const toggleLike = () => {
        setLiked((cur) => {
            toggleLikePortfolio(id, pid, !cur);
            const updated = getPortfolioProjects(id).find((p) => p.id === pid);
            setItem(updated);
            return !cur;
        });
    };

    return (
        <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-10">
            {/* 토스트 */}
            {toast && (
                <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-neutral-900/90 px-4 py-2 text-[12.5px] font-semibold text-white shadow-lg">
                    <div className="flex items-center gap-3">
                        <span>{toast}</span>
                        <button className="opacity-80 hover:opacity-100" onClick={() => setToast("")} aria-label="닫기">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* 헤더 */}
            <div className="mb-4 flex items-center gap-2">
                <button
                    onClick={() => nav(`/challenge/portfolio/${id}/vote`)}
                    className="mr-1 inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100"
                    aria-label="뒤로가기"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <h1 className="text-[22px] font-extrabold tracking-[-0.01em] md:text-[24px]">{item.title}</h1>
            </div>

            <SectionCard className="!px-5 !py-5">
                {/* 작성자 */}
                <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-[13px] font-bold">
                        {item.authorInitial}
                    </div>
                    <div className="leading-tight">
                        <div className="text-[13px] font-semibold text-neutral-900">
                            {item.authorName}
                            {item.teamName ? ` · ${item.teamName}` : ""}
                        </div>
                        <div className="text-[12.5px] text-neutral-600">{item.authorRole}</div>
                    </div>
                </div>

                <p className="whitespace-pre-line text-[13.5px] leading-7 text-neutral-800">{item.summary}</p>

                <div className="mt-4 flex gap-2">
                    {item.demoUrl && (
                        <a
                            className="inline-flex items-center gap-1 rounded-xl border border-neutral-300 bg-white px-3 py-1.5 text-[13px] font-semibold hover:bg-neutral-50"
                            href={item.demoUrl}
                            target="_blank"
                            rel="noreferrer"
                        >
                            데모 <ExternalLink className="h-4 w-4" />
                        </a>
                    )}
                    {item.repoUrl && (
                        <a
                            className="inline-flex items-center gap-1 rounded-xl border border-neutral-300 bg-white px-3 py-1.5 text-[13px] font-semibold hover:bg-neutral-50"
                            href={item.repoUrl}
                            target="_blank"
                            rel="noreferrer"
                        >
                            GitHub <ExternalLink className="h-4 w-4" />
                        </a>
                    )}
                </div>

                {/* 메트릭 */}
                <div className="mt-4 flex items-center gap-4 text-[12.5px] text-neutral-700">
                    <button
                        onClick={toggleLike}
                        className={`inline-flex items-center gap-1 ${liked ? "text-rose-600" : "hover:text-neutral-900"}`}
                    >
                        <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} />
                        {item.likes}
                    </button>
                    <span className="inline-flex items-center gap-1">
            <Eye className="h-4 w-4" /> {item.views}
          </span>
                    <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-4 w-4" /> {item.comments}
          </span>
                </div>

                {/* 투표 */}
                <div className="mt-6 space-y-2">
                    <Stars label="UI/UX" value={ux} onChange={setUx} />
                    <Stars label="기술력" value={tech} onChange={setTech} />
                    <Stars label="창의성" value={cre} onChange={setCre} />
                    <Stars label="기획력" value={plan} onChange={setPlan} />
                    <div className="text-[12px] text-neutral-500">
                        ※ 데모용으로 중복 투표 제한을 적용하지 않았습니다. (실서비스는 서버에서 검증)
                    </div>
                </div>

                <div className="mt-4 flex justify-end">
                    <CTAButton as="button" onClick={handleVote} disabled={!canVote}>
                        투표 제출
                    </CTAButton>
                </div>
            </SectionCard>

            {/* 댓글 */}
            <SectionCard className="!px-5 !py-5 mt-6">
                <h2 className="mb-3 text-[15px] font-bold">댓글 {comments.length}</h2>

                <div className="space-y-4">
                    {comments.map((c) => (
                        <div key={c.id} className="rounded-2xl border p-4">
                            <div className="mb-1 flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-[12.5px] font-bold">
                                    {c.authorInitial}
                                </div>
                                <div className="leading-tight">
                                    <div className="text-[13px] font-semibold text-neutral-900">{c.authorName}</div>
                                    {c.authorRole && <div className="text-[12px] text-neutral-500">{c.authorRole}</div>}
                                </div>
                            </div>
                            <div className="whitespace-pre-wrap text-[13.5px] leading-7 text-neutral-800">{c.content}</div>
                            <div className="mt-1 text-xs text-neutral-500">{c.createdAt}</div>
                        </div>
                    ))}
                </div>

                <div className="mt-5 rounded-2xl border p-4">
          <textarea
              className="h-24 w-full resize-none rounded-xl border bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
              placeholder="댓글을 작성해보세요."
              value={cText}
              onChange={(e) => setCText(e.target.value)}
          />
                    <div className="mt-2 flex justify-end">
                        <button
                            onClick={submitComment}
                            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
                        >
                            등록하기
                        </button>
                    </div>
                </div>
            </SectionCard>
        </div>
    );
}
