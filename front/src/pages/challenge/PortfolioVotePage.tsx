import React, { useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { SectionCard, CTAButton, ChallengePageHeader, SubmissionCard } from "../../components/challenge/common";
import { Heart, Eye, MessageSquare, ChevronLeft } from "lucide-react";
import { getChallengeDetail } from "../../data/Challenge/challengeDetailDummy";
import { getPortfolioProjects, toggleLikePortfolio } from "../../data/Challenge/submissionsDummy";
import type { PortfolioChallengeDetail } from "../../data/Challenge/challengeDetailDummy";
import { useLikeToggle } from "../../hooks/useLikeToggle";

export default function PortfolioVotePage() {
    const { id: idStr } = useParams();
    const id = Number(idStr || 2);
    const detail = useMemo(() => getChallengeDetail(id) as PortfolioChallengeDetail, [id]);
    const nav = useNavigate();

    const initialCards = getPortfolioProjects(id).map((c) => ({ ...c, liked: false }));
    const { items: cards, toggleLike } = useLikeToggle(initialCards, toggleLikePortfolio, id);

    return (
        <div className="mx-auto max-w-screen-xl px-4 py-6 md:px-6 md:py-10">
            <ChallengePageHeader
                title={`샌드위치 챌린지 투표: ${detail.title.replace(/^포트폴리오 챌린지:\s*/, "")}`}
                onBack={() => nav(`/challenge/portfolio/${id}`)}
                actionButton={
                    <CTAButton as={Link} href={`/challenge/portfolio/${id}/submit`}>
                        프로젝트 제출하기
                    </CTAButton>
                }
            />

            <div className="grid gap-5 md:grid-cols-3">
                {cards.map((c) => (
                    <SubmissionCard
                        key={c.id}
                        submission={c}
                        onLike={toggleLike}
                        href={`/challenge/portfolio/${id}/vote/${c.id}`}
                    />
                ))}
            </div>
        </div>
    );
}
