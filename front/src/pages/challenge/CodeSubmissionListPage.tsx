// src/pages/challenge/CodeSubmissionListPage.tsx
import React, { useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { SectionCard, CTAButton } from "../../components/challenge/common";
import { Heart, Eye, MessageSquare, ChevronLeft } from "lucide-react";
import { getChallengeDetail } from "../../data/Challenge/challengeDetailDummy";
import { getCodeSubmissions, toggleLikeCode } from "../../data/Challenge/submissionsDummy";
import type { CodeChallengeDetail } from "../../data/Challenge/challengeDetailDummy";

export default function CodeSubmissionListPage() {
    const { id: idStr } = useParams();
    const id = Number(idStr || 1);
    const detail = useMemo(() => getChallengeDetail(id) as CodeChallengeDetail, [id]);
    const nav = useNavigate();

    const [cards, setCards] = useState(() =>
        getCodeSubmissions(id).map((c) => ({ ...c, liked: false }))
    );

    const toggleLike = (e: React.MouseEvent, sid: number) => {
        e.preventDefault();
        e.stopPropagation();
        setCards((arr) =>
            arr.map((c) =>
                c.id === sid ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 } : c
            )
        );
        const target = cards.find((c) => c.id === sid);
        if (target) toggleLikeCode(id, sid, !target.liked);
    };

    const headerText = `샌드위치 코드 챌린지 투표: ${detail.title.replace(/^코드 챌린지:\s*/, "")}`;

    return (
        <div className="mx-auto max-w-screen-xl px-4 py-6 md:px-6 md:py-10">
            <div className="mb-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => nav(`/challenge/code/${id}`)}
                        className="mr-1 inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100"
                        aria-label="뒤로가기"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-[22px] font-extrabold tracking-[-0.01em] md:text-[24px]">
                        {headerText}
                    </h1>
                </div>

                {/* Link 대신 onClick navigate로 확실하게 이동 */}
                <CTAButton as="button" onClick={() => nav(`/challenge/code/${id}/submit`)}>
                    코드 제출하기
                </CTAButton>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
                {cards.map((c) => (
                    <Link key={c.id} to={`/challenge/code/${id}/submissions/${c.id}`} className="block">
                        <SectionCard bordered className="!p-0 transition-shadow hover:shadow-md">
                            <div className="p-5">
                                {/* 헤더 */}
                                <div className="mb-2 flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-[13px] font-bold">
                                        {c.authorInitial}
                                    </div>
                                    <div className="leading-tight">
                                        <div className="text-[12.5px] font-semibold text-neutral-900">{c.authorName}</div>
                                        <div className="text-[12.5px] text-neutral-600">{c.authorRole}</div>
                                    </div>
                                </div>

                                <div className="mb-1 text-[14px] font-semibold">{c.title}</div>
                                <p className="min-h-[72px] text-[13px] leading-6 text-neutral-800">{c.desc}</p>

                                {/* 푸터 */}
                                <div className="mt-2 flex items-center justify-between text-[12.5px] text-neutral-700">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={(e) => toggleLike(e, c.id)}
                                            className={`inline-flex items-center gap-1 ${
                                                c.liked ? "text-rose-600" : "hover:text-neutral-900"
                                            }`}
                                        >
                                            <Heart className="h-4 w-4" fill={c.liked ? "currentColor" : "none"} />
                                            {c.likes}
                                        </button>
                                        <span className="inline-flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                                            {c.views}
                    </span>
                                        <span className="inline-flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                                            {c.comments}
                    </span>
                                    </div>
                                    <span className="text-[12.5px] font-semibold">전체보기</span>
                                </div>
                            </div>
                        </SectionCard>
                    </Link>
                ))}
            </div>
        </div>
    );
}
