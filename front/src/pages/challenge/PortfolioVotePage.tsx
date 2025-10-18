import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { CTAButton, ChallengePageHeader } from "../../components/challenge/common";
import EmptySubmissionState from "../../components/challenge/EmptySubmissionState";
import { getChallengeDetail } from "../../data/Challenge/challengeDetailDummy";
import type { PortfolioChallengeDetail } from "../../data/Challenge/challengeDetailDummy";
import { fetchPortfolioSubmissions, type SubmissionListItem } from "../../api/submissionApi";
import { 
    fetchChallengeDetail, 
    createVote, 
    updateMyVote, 
    getMyVote, 
    getVoteSummary,
    type VoteRequest,
    type MyVoteResponse,
    type VoteSummaryResponse
} from "../../api/challengeApi";
import Toast from "../../components/common/Toast";
import api from "../../api/axiosInstance";

export default function PortfolioVotePage() {
    const { id: idStr } = useParams();
    const id = Number(idStr || 2);
    
    // 데이터 초기화 (더미 데이터 사용하지 않음)
    const [detail, setDetail] = useState<PortfolioChallengeDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [submissions, setSubmissions] = useState<SubmissionListItem[]>([]);
    const [submissionsLoading, setSubmissionsLoading] = useState(false);
    const [challengeStatus, setChallengeStatus] = useState<string | null>(null);
    const [submissionLikes, setSubmissionLikes] = useState<Record<number, { liked: boolean; count: number }>>({});
    
    // 투표 관련 상태
    const [myVote, setMyVote] = useState<MyVoteResponse | null>(null);
    const [voteSummary, setVoteSummary] = useState<VoteSummaryResponse>([]);
    const [voteLoading, setVoteLoading] = useState(false);
    
    // 토스트 상태
    const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({
        visible: false,
        message: '',
        type: 'info'
    });
    
    const nav = useNavigate();

    // 실제 API에서 제출물 데이터 가져오기
    useEffect(() => {
        const fetchSubmissions = async () => {
            setSubmissionsLoading(true);
            try {
                const response = await fetchPortfolioSubmissions(id, 0, 20);
                setSubmissions(response.content);
                
                // 각 제출물의 좋아요 상태 가져오기
                const likesPromises = response.content.map(async (submission) => {
                    try {
                        const likeResponse = await api.get('/likes', {
                            params: {
                                targetType: 'PORTFOLIO_SUBMISSION',
                                targetId: submission.id
                            }
                        });
                        return {
                            id: submission.id,
                            liked: likeResponse.data.likedByMe || false,
                            count: likeResponse.data.likeCount || 0
                        };
                    } catch (error) {
                        console.error(`제출물 ${submission.id} 좋아요 상태 조회 실패:`, error);
                        return {
                            id: submission.id,
                            liked: false,
                            count: submission.likeCount || 0
                        };
                    }
                });
                
                const likesResults = await Promise.all(likesPromises);
                const likesMap = likesResults.reduce((acc, result) => {
                    acc[result.id] = { liked: result.liked, count: result.count };
                    return acc;
                }, {} as Record<number, { liked: boolean; count: number }>);
                
                setSubmissionLikes(likesMap);
            } catch (error) {
                // 에러 시 더미 데이터 유지
            } finally {
                setSubmissionsLoading(false);
            }
        };

        fetchSubmissions();
    }, [id]);

    // 좋아요 토글 함수
    const handleLike = async (e: React.MouseEvent, submissionId: number) => {
        e.preventDefault(); // Link 클릭 방지
        e.stopPropagation();
        
        try {
            const response = await api.post('/likes', {
                targetType: 'PORTFOLIO_SUBMISSION',
                targetId: submissionId
            });
            
            // 좋아요 상태 업데이트
            setSubmissionLikes(prev => ({
                ...prev,
                [submissionId]: {
                    liked: response.data.likedByMe,
                    count: response.data.likeCount
                }
            }));
        } catch (error) {
            console.error('좋아요 처리 실패:', error);
        }
    };

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

    // 투표 데이터 로드
    useEffect(() => {
        const loadVoteData = async () => {
            try {
                // 내 투표 조회
                const myVoteData = await getMyVote(id);
                setMyVote(myVoteData);
                
                // 투표 요약 조회
                const summaryData = await getVoteSummary(id);
                setVoteSummary(summaryData);
            } catch (error) {
                console.error('투표 데이터 로드 실패:', error);
            }
        };

        if (challengeStatus === "OPEN") {
            loadVoteData();
        }
    }, [id, challengeStatus]);

    // 투표 제출 함수
    const handleVote = async (submissionId: number, scores: { uiUx: number; creativity: number; codeQuality: number; difficulty: number }) => {
        setVoteLoading(true);
        try {
            const voteData: VoteRequest = {
                submissionId,
                ...scores
            };

            if (myVote) {
                // 기존 투표 수정
                await updateMyVote(id, voteData);
                setToast({
                    visible: true,
                    message: "투표가 수정되었습니다.",
                    type: 'success'
                });
            } else {
                // 새 투표 생성
                await createVote(id, voteData);
                setToast({
                    visible: true,
                    message: "투표가 완료되었습니다.",
                    type: 'success'
                });
            }

            // 투표 데이터 새로고침
            const updatedVote = await getMyVote(id);
            setMyVote(updatedVote);
            
            const updatedSummary = await getVoteSummary(id);
            setVoteSummary(updatedSummary);

        } catch (error: any) {
            console.error('투표 실패:', error);
            
            let errorMessage = "투표에 실패했습니다.";
            if (error?.response?.status === 409) {
                errorMessage = "이미 투표한 제출물입니다.";
            } else if (error?.response?.status === 400) {
                errorMessage = "투표 기간이 아닙니다.";
            } else if (error?.response?.status === 403) {
                errorMessage = "자신의 작품에는 투표할 수 없습니다.";
            }

            setToast({
                visible: true,
                message: errorMessage,
                type: 'error'
            });
        } finally {
            setVoteLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-screen-xl px-4 py-6 md:px-6 md:py-10">
            {/* 토스트 알림 */}
            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                size="medium"
                autoClose={3000}
                closable={true}
                onClose={() => setToast(prev => ({ ...prev, visible: false }))}
            />
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
                        <>
                            {/* 투표 요약 정보 */}
                            {voteSummary.length > 0 && (
                                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <h3 className="text-lg font-semibold text-blue-900 mb-3">📊 투표 현황</h3>
                                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                        {voteSummary.map((summary) => {
                                            const submission = submissions.find(s => s.id === summary.submissionId);
                                            return (
                                                <div key={summary.submissionId} className="p-3 bg-white rounded border">
                                                    <div className="font-medium text-sm text-gray-900 mb-1">
                                                        {submission?.title || `제출물 #${summary.submissionId}`}
                                                    </div>
                                                    <div className="text-xs text-gray-600 space-y-1">
                                                        <div>투표 수: {summary.voteCount}표</div>
                                                        <div>UI/UX: {summary.uiUxAvg.toFixed(1)}</div>
                                                        <div>창의성: {summary.creativityAvg.toFixed(1)}</div>
                                                        <div>코드 품질: {summary.codeQualityAvg.toFixed(1)}</div>
                                                        <div>난이도: {summary.difficultyAvg.toFixed(1)}</div>
                                                        <div className="font-semibold text-blue-600">총점: {summary.totalScore.toFixed(1)}</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* 내 투표 정보 */}
                            {myVote && (
                                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <h3 className="text-lg font-semibold text-green-900 mb-2">✅ 내 투표</h3>
                                    <div className="text-sm text-green-800">
                                        제출물 #{myVote.submissionId}에 투표하셨습니다.
                                        <div className="mt-1 text-xs">
                                            UI/UX: {myVote.uiUx} | 창의성: {myVote.creativity} | 코드 품질: {myVote.codeQuality} | 난이도: {myVote.difficulty}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {submissions.map((submission) => {
                                const likeInfo = submissionLikes[submission.id] || { liked: false, count: submission.likeCount || 0 };
                                
                                return (
                                <div key={submission.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
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
                                                <button 
                                                    onClick={(e) => handleLike(e, submission.id)}
                                                    className={`flex items-center gap-1 hover:text-gray-700 transition-colors ${likeInfo.liked ? 'text-red-500' : ''}`}
                                                >
                                                    <svg className="w-4 h-4" fill={likeInfo.liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                    </svg>
                                                    <span>{likeInfo.count}</span>
                                                </button>
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
                                            <Link 
                                                to={`/challenge/portfolio/${id}/vote/${submission.id}`}
                                                className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
                                            >
                                                전체보기
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                            </div>
                        </>
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
