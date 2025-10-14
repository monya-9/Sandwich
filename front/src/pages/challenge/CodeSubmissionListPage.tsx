// src/pages/challenge/CodeSubmissionListPage.tsx
import React, { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CTAButton, ChallengePageHeader, SubmissionCard } from "../../components/challenge/common";
import { getChallengeDetail } from "../../data/Challenge/challengeDetailDummy";
import type { CodeChallengeDetail } from "../../data/Challenge/challengeDetailDummy";
import { fetchChallengeSubmissions, type SubmissionListItem } from "../../api/submissionApi";
import { fetchWeeklyLatest } from "../../api/weeklyChallenge";
import EmptySubmissionState from "../../components/challenge/EmptySubmissionState";

export default function CodeSubmissionListPage() {
    const { id: idStr } = useParams();
    const id = Number(idStr || 1);
    const detail = useMemo(() => getChallengeDetail(id) as CodeChallengeDetail, [id]);
    const nav = useNavigate();

    // AI 주간 챌린지 데이터 상태
    const [weeklyData, setWeeklyData] = useState<any>(null);
    const [loadingWeekly, setLoadingWeekly] = useState(false);
    const [weeklyError, setWeeklyError] = useState<string | null>(null);

    // 제출물 데이터 상태
    const [submissions, setSubmissions] = useState<SubmissionListItem[]>([]);
    const [submissionsLoading, setSubmissionsLoading] = useState(false);

    // AI 주간 챌린지 데이터 로드
    useEffect(() => {
        setLoadingWeekly(true);
        setWeeklyError(null);
        fetchWeeklyLatest()
            .then((weekly) => {
                setWeeklyData(weekly);
            })
            .catch((err) => {
                console.error('주간 챌린지 데이터 로딩 실패:', err);
                setWeeklyError('AI 챌린지 정보를 불러오는 중 오류가 발생했습니다.');
            })
            .finally(() => {
                setLoadingWeekly(false);
            });
    }, []);

    // 실제 제출물 데이터 로드
    useEffect(() => {
        const fetchSubmissions = async () => {
            setSubmissionsLoading(true);
            try {
                const response = await fetchChallengeSubmissions(id, 0, 20);
                setSubmissions(response.content || []);
            } catch (error) {
                console.error('제출물 데이터 로드 실패:', error);
                setSubmissions([]);
            } finally {
                setSubmissionsLoading(false);
            }
        };

        fetchSubmissions();
    }, [id]);

    const headerText = `샌드위치 코드 챌린지 투표: ${(weeklyData?.title || detail.title).replace(/^코드 챌린지:\s*/, "")}`;

    return (
        <div className="mx-auto max-w-screen-xl px-4 py-6 md:px-6 md:py-10">
            <ChallengePageHeader
                title={loadingWeekly ? "AI 챌린지 정보를 불러오는 중..." : weeklyError ? weeklyError : headerText}
                onBack={() => nav(`/challenge/code/${id}`)}
                actionButton={
                    <CTAButton as="button" onClick={() => nav(`/challenge/code/${id}/submit`)}>
                        코드 제출하기
                    </CTAButton>
                }
            />

            {submissionsLoading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-3 text-neutral-600 mb-4">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-emerald-500"></div>
                            <span className="text-lg font-medium">제출물을 불러오는 중...</span>
                        </div>
                    </div>
                </div>
            ) : submissions.length > 0 ? (
                <div className="grid gap-5 md:grid-cols-3">
                    {submissions.filter(submission => submission != null).map((submission, index) => {
                        // 안전한 ID 추출 (실제 API는 id 필드 사용)
                        const submissionId = submission?.id || (index + 1);
                        const safeId = String(submissionId);
                        
                        // null/undefined 체크
                        if (!submission) {
                            return null;
                        }
                        
                        return (
                            <SubmissionCard
                                key={safeId}
                                submission={{
                                    id: submissionId,
                                    authorInitial: (submission.owner?.username || `U${submissionId}`).charAt(0).toUpperCase(),
                                    authorName: submission.owner?.username || `제출자 ${submissionId}`,
                                    authorRole: submission.owner?.position || "개발자",
                                    title: submission.title || `제출물 #${submissionId}`,
                                    desc: submission.desc || `언어: ${submission.language || 'Unknown'} | 총점: ${submission.totalScore || 0}`,
                                    likes: submission.likeCount || 0,
                                    views: submission.viewCount || 0,
                                    comments: submission.commentCount || 0,
                                    liked: false
                                }}
                                onLike={() => {}}
                                href={`/challenge/code/${id}/submissions/${submissionId}`}
                                actionText="전체보기"
                            />
                        );
                    })}
                </div>
            ) : (
                <EmptySubmissionState 
                    type="CODE" 
                    onSubmit={() => nav(`/challenge/code/${id}/submit`)} 
                />
            )}
        </div>
    );
}
