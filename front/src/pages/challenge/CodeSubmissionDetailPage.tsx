// src/pages/challenge/CodeSubmissionDetailPage.tsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { SectionCard, ChallengeCommentSection, CommentResponse } from "../../components/challenge/common";
import { ChevronLeft, Eye, MessageSquare, Heart } from "lucide-react";
import { fetchChallengeSubmissionDetail, type SubmissionDetailResponse } from "../../api/submissionApi";
import { fetchChallengeDetail } from "../../api/challengeApi";
import api from "../../api/axiosInstance";

export default function CodeSubmissionDetailPage() {
    const { id: idStr, submissionId: sidStr } = useParams();
    const id = Number(idStr || 1);
    const sid = Number(sidStr);
    const nav = useNavigate();

    // 백엔드 챌린지 데이터 상태
    const [challengeData, setChallengeData] = useState<any>(null);
    const [challengeLoading, setChallengeLoading] = useState(true);
    const [challengeStatus, setChallengeStatus] = useState<string | null>(null);
    
    const [item, setItem] = useState<SubmissionDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [comments, setComments] = useState<CommentResponse[]>([]);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);

    // 백엔드 챌린지 데이터 로드
    useEffect(() => {
        const loadChallengeData = async () => {
            setChallengeLoading(true);
            try {
                const backendChallenge = await fetchChallengeDetail(id);
                setChallengeData(backendChallenge);
                setChallengeStatus(backendChallenge.status);
            } catch (error) {
                setChallengeData(null);
                setChallengeStatus(null);
            } finally {
                setChallengeLoading(false);
            }
        };

        loadChallengeData();
    }, [id]);

    useEffect(() => {
        const fetchSubmissionDetail = async () => {
            setLoading(true);
            setError(null);
            try {
                const submissionDetail = await fetchChallengeSubmissionDetail(id, sid);
                setItem(submissionDetail);
            } catch (err) {
                console.error('제출물 상세 로드 실패:', err);
                setError('제출물을 찾을 수 없습니다.');
                setItem(null);
            } finally {
                setLoading(false);
            }
        };

        fetchSubmissionDetail();
    }, [id, sid]);

    // 댓글 로드
    useEffect(() => {
        const fetchComments = async () => {
            try {
                const response = await api.get('/comments', {
                    params: {
                        type: 'CODE_SUBMISSION',
                        id: sid
                    }
                });
                setComments(response.data || []);
            } catch (error) {
                console.error('댓글 로드 실패:', error);
                setComments([]);
            }
        };

        if (sid) {
            fetchComments();
        }
    }, [sid]);

    // 좋아요 상태 로드
    useEffect(() => {
        const fetchLikeStatus = async () => {
            try {
                const response = await api.get('/likes', {
                    params: {
                        targetType: 'CODE_SUBMISSION',
                        targetId: sid
                    }
                });
                setLiked(response.data.likedByMe || false);
                setLikeCount(response.data.likeCount || 0);
            } catch (error) {
                console.error('좋아요 상태 로드 실패:', error);
                setLiked(false);
                setLikeCount(0);
            }
        };

        if (sid) {
            fetchLikeStatus();
        }
    }, [sid]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
                <div className="flex items-center justify-center gap-3 text-neutral-600 mb-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-emerald-500"></div>
                    <span className="text-lg font-medium">제출물을 불러오는 중...</span>
                </div>
            </div>
        </div>
    );
    if (error || !item) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center text-neutral-600">
                <span className="text-lg">{error || '제출물을 찾을 수 없습니다.'}</span>
            </div>
        </div>
    );

    // 챌린지 제목 결정
    const getChallengeTitle = () => {
        if (challengeLoading) {
            return "챌린지 정보 로딩 중...";
        }
        
        if (challengeData?.title) {
            return challengeData.title.replace(/^코드 챌린지:\s*/, "");
        }
        
        return `챌린지 #${id}`;
    };
    
    const headerText = `샌드위치 코드 챌린지: 🧮 ${getChallengeTitle()}`;

    // 좋아요 토글
    const toggleLike = async () => {
        if (challengeStatus === "ENDED") return; // 종료된 챌린지에서는 좋아요 불가
        try {
            const response = await api.post('/likes', {
                targetType: 'CODE_SUBMISSION',
                targetId: sid
            });
            setLiked(response.data.likedByMe);
            setLikeCount(response.data.likeCount);
        } catch (error) {
            console.error('좋아요 처리 실패:', error);
        }
    };


    return (
        <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-10">
            <div className="mb-4 flex items-center gap-2">
                <button
                    onClick={() => nav(`/challenge/code/${id}/submissions`)}
                    className="mr-1 inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100"
                    aria-label="뒤로가기"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <h1 className="text-[22px] font-extrabold tracking-[-0.01em] md:text-[24px]">
                    {headerText}
                </h1>
            </div>

            <SectionCard className="!px-5 !py-5">
                {/* 작성자 */}
                <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-[13px] font-bold">
                        {item.owner?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="leading-tight">
                        <div className="text-[13px] font-semibold text-neutral-900">{item.owner?.username || '익명'}</div>
                        <div className="text-[12.5px] text-neutral-600">{item.owner?.position || '개발자'}</div>
                    </div>
                </div>

                {/* 제목 */}
                <div className="mb-2 text-[16px] font-bold">{item.title}</div>

                {/* 본문 */}
                <p className="whitespace-pre-wrap rounded-xl border border-neutral-200 bg-neutral-50/60 p-5 text-[13.5px] leading-7">
                    {item.desc}
                </p>
                
                {/* 리포지토리 링크 */}
                {item.repoUrl && (
                    <div className="mt-3">
                        <a 
                            href={item.repoUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-[13px] text-blue-600 hover:text-blue-800"
                        >
                            🔗 GitHub 리포지토리 보기
                        </a>
                    </div>
                )}
                
                {/* 데모 링크 */}
                {item.demoUrl && (
                    <div className="mt-2">
                        <a 
                            href={item.demoUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-[13px] text-green-600 hover:text-green-800"
                        >
                            🚀 데모 보기
                        </a>
                    </div>
                )}

                {/* 메트릭 */}
                <div className="mt-4 flex items-center gap-4 text-[12.5px] text-neutral-700">
                    <button
                        onClick={toggleLike}
                        disabled={challengeStatus === "ENDED"}
                        className={`inline-flex items-center gap-1 ${
                            challengeStatus === "ENDED" 
                                ? "text-gray-400 cursor-not-allowed" 
                                : liked 
                                ? "text-rose-600" 
                                : "hover:text-neutral-900"
                        }`}
                        title={challengeStatus === "ENDED" ? "종료된 챌린지에서는 좋아요를 할 수 없습니다" : ""}
                    >
                        <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} />
                        {likeCount}
                    </button>
                    <span className="inline-flex items-center gap-1"><Eye className="h-4 w-4" /> {item.viewCount}</span>
                    <span className="inline-flex items-center gap-1"><MessageSquare className="h-4 w-4" /> {comments.length}</span>
                </div>
            </SectionCard>

            {/* 댓글 */}
            <ChallengeCommentSection
                commentableType="CODE_SUBMISSION"
                commentableId={sid}
                challengeStatus={challengeStatus}
                comments={comments}
                onCommentsChange={setComments}
            />

            <div className="mt-6 flex justify-end">
                <Link to={`/challenge/code/${id}/submissions`} className="text-[13px] font-semibold underline">
                    목록으로
                </Link>
            </div>
        </div>
    );
}
