import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { CTAButton, ChallengePageHeader } from "../../components/challenge/common";
import EmptySubmissionState from "../../components/challenge/EmptySubmissionState";
import { getChallengeDetail, getDynamicChallengeDetail } from "../../data/Challenge/challengeDetailDummy";
import type { PortfolioChallengeDetail } from "../../data/Challenge/challengeDetailDummy";
import { fetchPortfolioSubmissions, type SubmissionListItem } from "../../api/submissionApi";
import { fetchChallengeDetail } from "../../api/challengeApi";

export default function PortfolioVotePage() {
    const { id: idStr } = useParams();
    const id = Number(idStr || 2);
    
    // 기본 더미 데이터로 초기화
    const [detail, setDetail] = useState<PortfolioChallengeDetail>(() => getChallengeDetail(id) as PortfolioChallengeDetail);
    const [loading, setLoading] = useState(false);
    const [submissions, setSubmissions] = useState<SubmissionListItem[]>([]);
    const [submissionsLoading, setSubmissionsLoading] = useState(false);
    
    const nav = useNavigate();

    // 실제 API에서 제출물 데이터 가져오기
    useEffect(() => {
        const fetchSubmissions = async () => {
            setSubmissionsLoading(true);
            try {
                const response = await fetchPortfolioSubmissions(id, 0, 20);
                setSubmissions(response.content);
                console.log('제출물 데이터 로드 성공:', response.content);
            } catch (error) {
                console.error('제출물 데이터 로드 실패:', error);
                // 에러 시 더미 데이터 유지
            } finally {
                setSubmissionsLoading(false);
            }
        };

        fetchSubmissions();
    }, [id]);

    // 백엔드에서 챌린지 타입 확인 후 포트폴리오인 경우 AI API에서 동적으로 데이터 가져오기
    useEffect(() => {
        const loadChallengeData = async () => {
            try {
                const backendChallenge = await fetchChallengeDetail(id);
                if (backendChallenge.type === "PORTFOLIO") {
                    setLoading(true);
                    const dynamicData = await getDynamicChallengeDetail(id, backendChallenge.type);
                    setDetail(dynamicData as PortfolioChallengeDetail);
                }
            } catch (err) {
                console.error('챌린지 데이터 로딩 실패:', err);
                // 에러 시 기본 더미 데이터 유지
            } finally {
                setLoading(false);
            }
        };

        loadChallengeData();
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
                            {submissions.map((submission) => (
                                <div key={submission.id} className="bg-white rounded-lg shadow-md p-6">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {submission.title || `제출물 #${submission.id}`}
                                        </h3>
                                        <div className="mt-2 text-sm text-gray-600">
                                            <div>제출자: {submission.owner?.username || '익명'}</div>
                                            <div>좋아요: {submission.likeCount}</div>
                                            <div>조회수: {submission.viewCount}</div>
                                            <div>댓글: {submission.commentCount}</div>
                                            <div>총점: {submission.totalScore}</div>
                                            <div>언어: {submission.language}</div>
                                        </div>
                                        {submission.desc && (
                                            <p className="mt-2 text-sm text-gray-700 line-clamp-2">
                                                {submission.desc}
                                            </p>
                                        )}
                                    </div>
                                    <Link 
                                        to={`/challenge/portfolio/${id}/vote/${submission.id}`}
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        평가하러 가기 →
                                    </Link>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptySubmissionState 
                            type="PORTFOLIO" 
                            onSubmit={() => nav(`/challenge/portfolio/${id}/submit`)} 
                        />
                    )}
                </>
            )}
        </div>
    );
}
