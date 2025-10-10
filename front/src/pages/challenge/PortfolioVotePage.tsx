import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { CTAButton, ChallengePageHeader, SubmissionCard } from "../../components/challenge/common";
import { getChallengeDetail, getDynamicChallengeDetail } from "../../data/Challenge/challengeDetailDummy";
import { getPortfolioProjects, toggleLikePortfolio } from "../../data/Challenge/submissionsDummy";
import type { PortfolioChallengeDetail } from "../../data/Challenge/challengeDetailDummy";
import { useLikeToggle } from "../../hooks/useLikeToggle";

export default function PortfolioVotePage() {
    const { id: idStr } = useParams();
    const id = Number(idStr || 2);
    
    // 기본 더미 데이터로 초기화
    const [detail, setDetail] = useState<PortfolioChallengeDetail>(() => getChallengeDetail(id) as PortfolioChallengeDetail);
    const [loading, setLoading] = useState(false);
    
    const nav = useNavigate();

    const initialCards = getPortfolioProjects(id).map((c) => ({ ...c, liked: false }));
    const { items: cards, toggleLike } = useLikeToggle(initialCards, toggleLikePortfolio, id);

    // 포트폴리오 챌린지(id: 2)인 경우 AI API에서 동적으로 데이터 가져오기
    useEffect(() => {
        if (id === 2) {
            setLoading(true);
            getDynamicChallengeDetail(id)
                .then((dynamicData) => {
                    setDetail(dynamicData as PortfolioChallengeDetail);
                })
                .catch((err) => {
                    console.error('월간 챌린지 데이터 로딩 실패:', err);
                    // 에러 시 기본 더미 데이터 유지
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [id]);

    return (
        <div className="mx-auto max-w-screen-xl px-4 py-6 md:px-6 md:py-10">
            {loading ? (
                /* 로딩 상태 - 전체 화면 */
                <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-3 text-neutral-600 mb-4">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-emerald-500"></div>
                            <span className="text-lg font-medium">AI 챌린지 정보를 불러오는 중...</span>
                        </div>
                        <p className="text-sm text-neutral-500">잠시만 기다려주세요</p>
                    </div>
                </div>
            ) : (
                <>
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
                </>
            )}
        </div>
    );
}
