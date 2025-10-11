import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { CTAButton, ChallengePageHeader } from "../../components/challenge/common";
import { getChallengeDetail, getDynamicChallengeDetail } from "../../data/Challenge/challengeDetailDummy";
import type { PortfolioChallengeDetail } from "../../data/Challenge/challengeDetailDummy";
import { fetchPortfolioSubmissions, type SubmissionResponse } from "../../api/submissionApi";

export default function PortfolioVotePage() {
    const { id: idStr } = useParams();
    const id = Number(idStr || 2);
    
    // 기본 더미 데이터로 초기화
    const [detail, setDetail] = useState<PortfolioChallengeDetail>(() => getChallengeDetail(id) as PortfolioChallengeDetail);
    const [loading, setLoading] = useState(false);
    const [submissions, setSubmissions] = useState<SubmissionResponse[]>([]);
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
                                <div key={submission.submissionId} className="bg-white rounded-lg shadow-md p-6">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            제출물 #{submission.submissionId}
                                        </h3>
                                        <div className="mt-2 text-sm text-gray-600">
                                            <div>투표 수: {submission.voteCount}</div>
                                            <div>UI/UX 평균: {submission.uiUxAvg}</div>
                                            <div>창의성 평균: {submission.creativityAvg}</div>
                                            <div>코드 품질 평균: {submission.codeQualityAvg}</div>
                                            <div>난이도 평균: {submission.difficultyAvg}</div>
                                            <div>총점: {submission.totalScore}</div>
                                            <div>순위: {submission.rank}</div>
                                        </div>
                                    </div>
                                    <Link 
                                        to={`/challenge/portfolio/${id}/vote/${submission.submissionId}`}
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        평가하러 가기 →
                                    </Link>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="text-gray-500 text-lg mb-4">아직 제출된 프로젝트가 없습니다.</div>
                            <CTAButton as={Link} href={`/challenge/portfolio/${id}/submit`}>
                                첫 번째 프로젝트 제출하기
                            </CTAButton>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
