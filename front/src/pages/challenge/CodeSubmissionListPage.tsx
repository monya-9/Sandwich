// src/pages/challenge/CodeSubmissionListPage.tsx
import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CTAButton, ChallengePageHeader, SubmissionCard } from "../../components/challenge/common";
import { getChallengeDetail } from "../../data/Challenge/challengeDetailDummy";
import { getCodeSubmissions, toggleLikeCode } from "../../data/Challenge/submissionsDummy";
import type { CodeChallengeDetail } from "../../data/Challenge/challengeDetailDummy";
import { useLikeToggle } from "../../hooks/useLikeToggle";

export default function CodeSubmissionListPage() {
    const { id: idStr } = useParams();
    const id = Number(idStr || 1);
    const detail = useMemo(() => getChallengeDetail(id) as CodeChallengeDetail, [id]);
    const nav = useNavigate();

    const initialCards = getCodeSubmissions(id).map((c) => ({ ...c, liked: false }));
    const { items: cards, toggleLike } = useLikeToggle(initialCards, toggleLikeCode, id);

    const headerText = `샌드위치 코드 챌린지 투표: ${detail.title.replace(/^코드 챌린지:\s*/, "")}`;

    return (
        <div className="mx-auto max-w-screen-xl px-4 py-6 md:px-6 md:py-10">
            <ChallengePageHeader
                title={headerText}
                onBack={() => nav(`/challenge/code/${id}`)}
                actionButton={
                    <CTAButton as="button" onClick={() => nav(`/challenge/code/${id}/submit`)}>
                        코드 제출하기
                    </CTAButton>
                }
            />

            <div className="grid gap-5 md:grid-cols-3">
                {cards.map((c) => (
                    <SubmissionCard
                        key={c.id}
                        submission={c}
                        onLike={toggleLike}
                        href={`/challenge/code/${id}/submissions/${c.id}`}
                        actionText="전체보기"
                    />
                ))}
            </div>
        </div>
    );
}
