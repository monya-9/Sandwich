import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { CTAButton, ChallengePageHeader } from "../../components/challenge/common";
import EmptySubmissionState from "../../components/challenge/EmptySubmissionState";
import { getChallengeDetail } from "../../data/Challenge/challengeDetailDummy";
import type { PortfolioChallengeDetail } from "../../data/Challenge/challengeDetailDummy";
import { fetchPortfolioSubmissions, type SubmissionListItem } from "../../api/submissionApi";
import { fetchChallengeDetail } from "../../api/challengeApi";

export default function PortfolioVotePage() {
    const { id: idStr } = useParams();
    const id = Number(idStr || 2);
    
    // 데이터 초기화 (더미 데이터 사용하지 않음)
    const [detail, setDetail] = useState<PortfolioChallengeDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [submissions, setSubmissions] = useState<SubmissionListItem[]>([]);
    const [submissionsLoading, setSubmissionsLoading] = useState(false);
    const [challengeStatus, setChallengeStatus] = useState<string | null>(null);
    
    const nav = useNavigate();

    // 실제 API에서 제출물 데이터 가져오기
    useEffect(() => {
        const fetchSubmissions = async () => {
            setSubmissionsLoading(true);
            try {
                const response = await fetchPortfolioSubmissions(id, 0, 20);
                setSubmissions(response.content);
            } catch (error) {
                // 에러 시 더미 데이터 유지
            } finally {
                setSubmissionsLoading(false);
            }
        };

        fetchSubmissions();
    }, [id]);

    // 백엔드 챌린지 데이터 우선 사용
    useEffect(() => {
        const loadChallengeData = async () => {
            setLoading(true);
            try {
                const backendChallenge = await fetchChallengeDetail(id);
                
                if (backendChallenge.type === "PORTFOLIO") {
                    // 백엔드 데이터 우선 사용
                    let ruleData: any = null;
                    let backendDescription: string | null = null;
                    
                    if (backendChallenge.ruleJson) {
                        try {
                            ruleData = typeof backendChallenge.ruleJson === 'string' 
                                ? JSON.parse(backendChallenge.ruleJson) 
                                : backendChallenge.ruleJson;
                            backendDescription = ruleData.summary || ruleData.md;
                        } catch (e) {
                            // ruleJson 파싱 실패는 무시
                        }
                    }
                    
                    // 더미 데이터 기반으로 백엔드 데이터 적용
                    const baseData = getChallengeDetail(id) as PortfolioChallengeDetail;
                    const backendBasedData = {
                        ...baseData,
                        id: backendChallenge.id,
                        title: `포트폴리오 챌린지: ${backendChallenge.title}`,
                        subtitle: backendChallenge.title,
                        description: backendDescription || baseData.description,
                        startAt: backendChallenge.startAt,
                        endAt: backendChallenge.endAt,
                        status: backendChallenge.status,
                    };
                    
                    setDetail(backendBasedData);
                    setChallengeStatus(backendChallenge.status);
                } else {
                    setDetail(null);
                    setChallengeStatus(null);
                }
            } catch (err) {
                setDetail(null);
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
                        title={`샌드위치 챌린지 투표: ${(detail?.title || '포트폴리오 챌린지').replace(/^포트폴리오 챌린지:\s*/, "")}`}
                        onBack={() => nav(`/challenge/portfolio/${id}`)}
                        actionButton={
                            challengeStatus === "ENDED" ? undefined : (
                                <CTAButton as={Link} href={`/challenge/portfolio/${id}/submit`}>
                                    프로젝트 제출하기
                                </CTAButton>
                            )
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
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {submissions.map((submission) => (
                                <div key={submission.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
                                    {/* 썸네일 이미지 */}
                                    {submission.coverUrl && (
                                        <div className="relative h-48 bg-gray-100">
                                            <img 
                                                src={submission.coverUrl} 
                                                alt={submission.title}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    )}
                                    
                                    <div className="p-5">
                                        {/* 상단: 프로필 정보 & 제목 */}
                                        <div className="flex items-start gap-3 mb-3">
                                            {/* 프로필 이미지 */}
                                            <div className="flex-shrink-0">
                                                {submission.owner?.profileImageUrl ? (
                                                    <img 
                                                        src={submission.owner.profileImageUrl} 
                                                        alt={submission.owner.username}
                                                        className="w-10 h-10 rounded-full object-cover bg-gray-200"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(submission.owner?.username || 'U')}&background=e5e7eb&color=6b7280&size=40`;
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                                                        {submission.owner?.username?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                {/* 사용자명 & 팀명 */}
                                                <div className="flex items-center gap-1 text-sm font-medium text-gray-900 mb-1">
                                                    <span className="truncate">
                                                        {submission.owner?.username || '익명'}
                                                    </span>
                                                    {/* 팀 정보 - 현재 API에 없으므로 임시로 더미 데이터 */}
                                                    {submission.id % 3 === 0 && (
                                                        <>
                                                            <span className="text-gray-400">·</span>
                                                            <span className="text-gray-600 truncate">샌드위치팀</span>
                                                        </>
                                                    )}
                                                </div>
                                                
                                                {/* 제목 */}
                                                <h3 className="text-base font-semibold text-gray-900 line-clamp-1 mb-1">
                                                    {submission.title || `제출물 #${submission.id}`}
                                                </h3>
                                            </div>
                                        </div>
                                        
                                        {/* 설명 */}
                                        {submission.desc && (
                                            <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                                                {submission.desc}
                                            </p>
                                        )}
                                        
                                        {/* 하단: 통계 & 버튼 */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <span>♡</span>
                                                    <span>{submission.likeCount}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span>👁</span>
                                                    <span>{submission.viewCount}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span>💬</span>
                                                    <span>{submission.commentCount}</span>
                                                </div>
                                            </div>
                                            
                                            <Link 
                                                to={`/challenge/portfolio/${id}/vote/${submission.id}`}
                                                className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
                                            >
                                                전체보기
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptySubmissionState 
                            type="PORTFOLIO" 
                            onSubmit={() => nav(`/challenge/portfolio/${id}/submit`)} 
                            challengeStatus={challengeStatus}
                        />
                    )}
                </>
            )}
        </div>
    );
}
