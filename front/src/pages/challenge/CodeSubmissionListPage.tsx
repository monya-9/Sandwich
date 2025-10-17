// src/pages/challenge/CodeSubmissionListPage.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CTAButton, ChallengePageHeader, SubmissionCard } from "../../components/challenge/common";
import { fetchChallengeSubmissions, type SubmissionListItem } from "../../api/submissionApi";
import { fetchChallengeDetail } from "../../api/challengeApi";
import { fetchWeeklyLatest } from "../../api/weeklyChallenge";
import EmptySubmissionState from "../../components/challenge/EmptySubmissionState";

export default function CodeSubmissionListPage() {
    const { id: idStr } = useParams();
    const id = Number(idStr || 1);
    const nav = useNavigate();

    // 백엔드 챌린지 데이터 상태
    const [challengeData, setChallengeData] = useState<any>(null);
    const [loadingChallenge, setLoadingChallenge] = useState(false);
    
    // AI 주간 챌린지 데이터 상태 (백업용)
    const [weeklyData, setWeeklyData] = useState<any>(null);
    const [loadingWeekly, setLoadingWeekly] = useState(false);
    const [weeklyError, setWeeklyError] = useState<string | null>(null);

    // 제출물 데이터 상태
    const [submissions, setSubmissions] = useState<SubmissionListItem[]>([]);
    const [submissionsLoading, setSubmissionsLoading] = useState(false);

    // 백엔드 챌린지 데이터 로드 (우선순위)
    useEffect(() => {
        const loadChallengeData = async () => {
            setLoadingChallenge(true);
            try {
                const backendChallenge = await fetchChallengeDetail(id);
                setChallengeData(backendChallenge);
            } catch (error) {
                console.error('백엔드 챌린지 데이터 로딩 실패:', error);
                // 백엔드 실패 시 AI 데이터 로드
                setLoadingWeekly(true);
                setWeeklyError(null);
                fetchWeeklyLatest()
                    .then((weekly) => {
                        setWeeklyData(weekly);
                    })
                    .catch((err) => {
                        console.error('주간 챌린지 데이터 로딩 실패:', err);
                        setWeeklyError('챌린지 정보를 불러오는 중 오류가 발생했습니다.');
                    })
                    .finally(() => {
                        setLoadingWeekly(false);
                    });
            } finally {
                setLoadingChallenge(false);
            }
        };

        loadChallengeData();
    }, [id]);

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

    // 제목 결정 로직 (백엔드 우선, 없으면 AI 데이터, 마지막 기본값)
    const getHeaderTitle = () => {
        if (loadingChallenge || loadingWeekly) {
            return "챌린지 정보를 불러오는 중...";
        }
        
        if (weeklyError) {
            return weeklyError;
        }
        
        // 백엔드 데이터 우선 사용
        if (challengeData?.title) {
            const title = challengeData.title.replace(/^코드 챌린지:\s*/, "");
            return `샌드위치 코드 챌린지 투표: ${title}`;
        }
        
        // AI 데이터 백업 사용
        if (weeklyData?.title) {
            const title = weeklyData.title.replace(/^코드 챌린지:\s*/, "");
            return `샌드위치 코드 챌린지 투표: ${title}`;
        }
        
        // 기본값
        return `샌드위치 코드 챌린지 투표: 챌린지 #${id}`;
    };

    return (
        <div className="mx-auto max-w-screen-xl px-4 py-6 md:px-6 md:py-10">
            <ChallengePageHeader
                title={getHeaderTitle()}
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
