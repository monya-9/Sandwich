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
                        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {submissions.map((submission) => (
                                <Link 
                                    key={submission.id} 
                                    to={`/challenge/portfolio/${id}/vote/${submission.id}`}
                                    className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200 block cursor-pointer"
                                >
                                    {/* 1. 프로필 정보 */}
                                    <div className="p-4 pb-3">
                                        <div className="flex items-center gap-3">
                                            {/* 프로필 이미지 */}
                                            <div className="flex-shrink-0">
                                                {submission.owner?.profileImageUrl ? (
                                                    <img 
                                                        src={submission.owner.profileImageUrl} 
                                                        alt={submission.owner.username}
                                                        className="w-10 h-10 rounded-full object-cover bg-gray-200"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(submission.owner?.username || 'U')}&background=e5e7eb&color=1f2937&size=40`;
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                        <span className="text-gray-800 font-semibold text-sm">
                                                            {(() => {
                                                                const username = submission.owner?.username || 'user@example.com';
                                                                // username이 이메일 형식인지 확인하고 @ 앞부분 사용, 아니면 username 첫 글자 사용
                                                                const emailPart = username.includes('@') ? username.split('@')[0] : username;
                                                                return emailPart.charAt(0).toUpperCase() || 'U';
                                                            })()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* 사용자명 & 직책 */}
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-semibold text-gray-900 truncate">
                                                    {submission.owner?.username || '익명'}
                                                </div>
                                                <div className="text-xs text-gray-500">개발자</div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* 2. 썸네일 이미지 */}
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
                                    
                                    <div className="p-4">
                                        {/* 3. 제목 */}
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                                            {submission.title || `제출물 #${submission.id}`}
                                        </h3>
                                        
                                        {/* 4. 소개/설명 */}
                                        {submission.desc && (
                                            <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                                                {submission.desc}
                                            </p>
                                        )}
                                        
                                        {/* 5. 하단: 좋아요, 조회수, 댓글, 전체보기 */}
                                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                {/* 좋아요 */}
                                                <div className="flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                    </svg>
                                                    <span>{submission.likeCount}</span>
                                                </div>
                                                {/* 조회수 */}
                                                <div className="flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    <span>{submission.viewCount}</span>
                                                </div>
                                                {/* 댓글 */}
                                                <div className="flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                    </svg>
                                                    <span>{submission.commentCount}</span>
                                                </div>
                                            </div>
                                            
                                            {/* 전체보기 버튼 */}
                                            <div className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors">
                                                전체보기
                                            </div>
                                        </div>
                                    </div>
                                </Link>
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
