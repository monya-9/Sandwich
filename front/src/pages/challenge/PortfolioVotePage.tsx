import React, { useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { SectionCard, CTAButton } from "../../components/challenge/common";
import { Heart, Eye, MessageSquare, ChevronLeft } from "lucide-react";
import { getChallengeDetail } from "../../data/Challenge/challengeDetailDummy";
import { getPortfolioProjects, toggleLikePortfolio } from "../../data/Challenge/submissionsDummy";
import type { PortfolioChallengeDetail } from "../../data/Challenge/challengeDetailDummy";

export default function PortfolioVotePage() {
    const { id: idStr } = useParams();
    const id = Number(idStr || 2);
    const detail = useMemo(() => getChallengeDetail(id) as PortfolioChallengeDetail, [id]);
    const nav = useNavigate();

    const [cards, setCards] = useState(() =>
        getPortfolioProjects(id).map((c) => ({ ...c, liked: false }))
    );

    const toggleLike = (e: React.MouseEvent, pid: number) => {
        e.preventDefault(); e.stopPropagation();
        setCards((arr) =>
            arr.map((c) =>
                c.id === pid ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 } : c
            )
        );
        const target = cards.find((c) => c.id === pid);
        if (target) toggleLikePortfolio(id, pid, !target.liked);
    };

    return (
        <div className="mx-auto max-w-screen-xl px-4 py-6 md:px-6 md:py-10">
            {/* 헤더 + CTA(우측) */}
            <div className="mb-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => nav(`/challenge/portfolio/${id}`)}
                        className="mr-1 inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100"
                        aria-label="뒤로가기"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-[22px] font-extrabold tracking-[-0.01em] md:text-[24px]">
                        샌드위치 챌린지 투표: {detail.title.replace(/^포트폴리오 챌린지:\s*/, "")}
                    </h1>
                </div>
                <CTAButton as={Link} href={`/challenge/portfolio/${id}/submit`}>
                    프로젝트 제출하기
                </CTAButton>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
                {cards.map((c) => (
                    <Link key={c.id} to={`/challenge/portfolio/${id}/vote/${c.id}`} className="block">
                        <SectionCard bordered className="!p-0 hover:shadow-md transition-shadow">
                            <div className="p-5">
                                <div className="mb-2 flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-[13px] font-bold">
                                        {c.authorInitial}
                                    </div>
                                    <div className="leading-tight">
                                        <div className="text-[12.5px] font-semibold text-neutral-900">
                                            {c.authorName}{c.teamName ? ` · ${c.teamName}` : ""}
                                        </div>
                                        <div className="text-[12.5px] text-neutral-600">{c.authorRole}</div>
                                    </div>
                                </div>

                                <div className="mb-1 text-[14px] font-semibold">{c.title}</div>
                                <p className="min-h-[72px] text-[13px] leading-6 text-neutral-800">{c.summary}</p>

                                <div className="mt-2 flex items-center justify-between text-[12.5px] text-neutral-700">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={(e) => toggleLike(e, c.id)}
                                            className={`inline-flex items-center gap-1 ${c.liked ? "text-rose-600" : "hover:text-neutral-900"}`}
                                        >
                                            <Heart className="h-4 w-4" fill={c.liked ? "currentColor" : "none"} />
                                            {c.likes}
                                        </button>
                                        <span className="inline-flex items-center gap-1"><Eye className="h-4 w-4" />{c.views}</span>
                                        <span className="inline-flex items-center gap-1"><MessageSquare className="h-4 w-4" />{c.comments}</span>
                                    </div>
                                    <span className="text-[12.5px] font-semibold">평가하러 가기 →</span>
                                </div>
                            </div>
                        </SectionCard>
                    </Link>
                ))}
            </div>
        </div>
    );
}
