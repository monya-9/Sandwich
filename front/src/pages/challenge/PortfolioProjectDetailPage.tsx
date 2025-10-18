import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SectionCard, CTAButton } from "../../components/challenge/common";
import { ChevronLeft, Star, ExternalLink, Heart, Eye, MessageSquare } from "lucide-react";
import Toast from "../../components/common/Toast";
import { fetchChallengeSubmissionDetail, type SubmissionDetailResponse } from "../../api/submissionApi";
import { 
    fetchChallengeDetail, 
    createVote, 
    updateMyVote, 
    getMyVote,
    type VoteRequest,
    type MyVoteResponse
} from "../../api/challengeApi";
import api from "../../api/axiosInstance";

function Stars({
                   value,
                   onChange,
                   label,
                   disabled = false,
               }: {
    value: number;
    onChange: (v: number) => void;
    label: string;
    disabled?: boolean;
}) {
    return (
        <div className="flex items-center gap-2">
            <span className="w-16 text-[13px]">{label}</span>
            {[1, 2, 3, 4, 5].map((n) => (
                <button 
                    key={n} 
                    onClick={() => !disabled && onChange(n)} 
                    aria-label={`${label} ${n}점`}
                    disabled={disabled}
                    className={disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"}
                >
                    <Star className={`h-5 w-5 ${n <= value ? "fill-yellow-400 stroke-yellow-400" : ""}`} />
                </button>
            ))}
        </div>
    );
}

export default function PortfolioProjectDetailPage() {
    const { id: idStr, projectId: pidStr } = useParams();
    const id = Number(idStr);
    const pid = Number(pidStr);
    const nav = useNavigate();

    const [item, setItem] = useState<SubmissionDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [cText, setCText] = useState("");
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    
    // 챌린지 상태 확인
    const [challengeStatus, setChallengeStatus] = useState<string | null>(null);
    const [challengeLoading, setChallengeLoading] = useState(true);

    // 투표 관련 상태
    const [myVote, setMyVote] = useState<MyVoteResponse | null>(null);
    const [voteLoading, setVoteLoading] = useState(false);
    const [isEditingVote, setIsEditingVote] = useState(false);

    // 별점
    const [ux, setUx] = useState(0);
    const [tech, setTech] = useState(0);
    const [cre, setCre] = useState(0);
    const [plan, setPlan] = useState(0);

    // 토스트 상태
    const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({
        visible: false,
        message: '',
        type: 'info'
    });

    // 챌린지 상태 로드
    useEffect(() => {
        const loadChallengeData = async () => {
            setChallengeLoading(true);
            try {
                const backendChallenge = await fetchChallengeDetail(id);
                setChallengeStatus(backendChallenge.status);
            } catch (error) {
                setChallengeStatus(null);
            } finally {
                setChallengeLoading(false);
            }
        };

        loadChallengeData();
    }, [id]);

    // 제출물 상세 데이터 로드
    useEffect(() => {
        const fetchSubmissionDetail = async () => {
            setLoading(true);
            setError(null);
            try {
                const submissionDetail = await fetchChallengeSubmissionDetail(id, pid);
                setItem(submissionDetail);
                setLikeCount(submissionDetail.likeCount || 0);
            } catch (err) {
                console.error('포트폴리오 상세 로드 실패:', err);
                setError('제출물을 찾을 수 없습니다.');
                setItem(null);
            } finally {
                setLoading(false);
            }
        };

        fetchSubmissionDetail();
    }, [id, pid]);

    // 댓글 로드 (포트폴리오 제출물용)
    useEffect(() => {
        const fetchComments = async () => {
            try {
                const response = await api.get('/api/comments', {
                    params: {
                        type: 'PORTFOLIO_SUBMISSION',
                        id: pid
                    }
                });
                setComments(response.data || []);
            } catch (error) {
                console.error('댓글 로드 실패:', error);
                setComments([]);
            }
        };

        if (pid) {
            fetchComments();
        }
    }, [pid]);

    // 좋아요 상태 로드
    useEffect(() => {
        const fetchLikeStatus = async () => {
            try {
                const response = await api.get('/api/likes', {
                    params: {
                        targetType: 'PORTFOLIO_SUBMISSION',
                        targetId: pid
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

        if (pid) {
            fetchLikeStatus();
        }
    }, [pid]);

    // 투표 데이터 로드
    useEffect(() => {
        const loadVoteData = async () => {
            try {
                console.log('🔍 투표 데이터 로드 시작:', { challengeId: id, itemId: item?.id });
                const myVoteData = await getMyVote(id);
                console.log('📊 투표 데이터 로드 결과:', myVoteData);
                setMyVote(myVoteData);
                
                // 기존 투표가 있으면 별점 초기화
                if (myVoteData) {
                    console.log('⭐ 별점 초기화:', {
                        uiUx: myVoteData.uiUx,
                        codeQuality: myVoteData.codeQuality,
                        creativity: myVoteData.creativity,
                        difficulty: myVoteData.difficulty
                    });
                    setUx(myVoteData.uiUx);
                    setTech(myVoteData.codeQuality);
                    setCre(myVoteData.creativity);
                    setPlan(myVoteData.difficulty);
                }
            } catch (error) {
                console.error('투표 데이터 로드 실패:', error);
                setMyVote(null);
            }
        };

        if (challengeStatus === "OPEN" && item) {
            loadVoteData();
        }
    }, [id, challengeStatus, item]);

    // 투표 수정 모드 전환
    const startEditingVote = () => {
        setIsEditingVote(true);
    };

    // 투표 수정 취소
    const cancelEditingVote = () => {
        setIsEditingVote(false);
        // 원래 투표 상태로 복원
        if (myVote) {
            setUx(myVote.uiUx);
            setTech(myVote.codeQuality);
            setCre(myVote.creativity);
            setPlan(myVote.difficulty);
        }
    };

    // 투표 제출 함수
    const handleVote = async () => {
        if (!item) return;
        
        setVoteLoading(true);
        try {
            const voteData: VoteRequest = {
                submissionId: item.id, // 백엔드에서는 id 필드가 제출물 ID
                uiUx: ux,
                creativity: cre,
                codeQuality: tech,
                difficulty: plan
            };

            // 필수 필드 검증
            if (!voteData.submissionId) {
                throw new Error("제출물 ID가 없습니다.");
            }
            if (voteData.uiUx === 0 || voteData.creativity === 0 || voteData.codeQuality === 0 || voteData.difficulty === 0) {
                throw new Error("모든 항목에 별점을 주세요.");
            }

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
            console.log('🔄 투표 후 데이터 새로고침:', updatedVote);
            setMyVote(updatedVote);
            
            // 별점 상태도 업데이트
            if (updatedVote) {
                console.log('⭐ 투표 후 별점 업데이트:', {
                    uiUx: updatedVote.uiUx,
                    codeQuality: updatedVote.codeQuality,
                    creativity: updatedVote.creativity,
                    difficulty: updatedVote.difficulty
                });
                setUx(updatedVote.uiUx);
                setTech(updatedVote.codeQuality);
                setCre(updatedVote.creativity);
                setPlan(updatedVote.difficulty);
            }
            
            // 수정 모드 종료
            setIsEditingVote(false);

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

    // ✅ 중복 제한 제거: 별점 모두 채웠는지만 체크 + 챌린지 종료 체크
    const canVote = ux > 0 && tech > 0 && cre > 0 && plan > 0 && challengeStatus !== "ENDED";
    const isChallengeEnded = challengeStatus === "ENDED";

    // handleVote 함수는 위에서 이미 정의됨 (API 연결 버전)

    const submitComment = async () => {
        const v = cText.trim();
        if (!v || challengeStatus === "ENDED") return; // 종료된 챌린지에서는 댓글 작성 불가
        
        try {
            await api.post('/api/comments', {
                commentableType: 'PORTFOLIO_SUBMISSION',
                commentableId: pid,
                comment: v
            });
            
            // 댓글 목록 새로고침
            const response = await api.get('/api/comments', {
                params: {
                    type: 'PORTFOLIO_SUBMISSION',
                    id: pid
                }
            });
            setComments(response.data || []);
            setCText("");
            setToast({
                visible: true,
                message: "댓글이 등록됐어요.",
                type: 'success'
            });
        } catch (error) {
            console.error('댓글 작성 실패:', error);
            setToast({
                visible: true,
                message: "댓글 등록에 실패했습니다.",
                type: 'error'
            });
        }
    };

    const toggleLike = async () => {
        if (challengeStatus === "ENDED") return; // 종료된 챌린지에서는 좋아요 불가
        try {
            const response = await api.post('/api/likes', {
                targetType: 'PORTFOLIO_SUBMISSION',
                targetId: pid
            });
            setLiked(response.data.likedByMe);
            setLikeCount(response.data.likeCount);
        } catch (error) {
            console.error('좋아요 처리 실패:', error);
        }
    };

    return (
        <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-10">
            {/* 토스트 */}
            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                size="medium"
                autoClose={3000}
                closable={true}
                onClose={() => setToast(prev => ({ ...prev, visible: false }))}
            />

            {/* 헤더 */}
            <div className="mb-4 flex items-center gap-2">
                <button
                    onClick={() => nav(`/challenge/portfolio/${id}/vote`)}
                    className="mr-1 inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100"
                    aria-label="뒤로가기"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <h1 className="text-[22px] font-extrabold tracking-[-0.01em] md:text-[24px]">{item.title}</h1>
            </div>


            <SectionCard className="!px-5 !py-5">
                {/* 작성자 */}
                <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-[13px] font-bold">
                        {item.owner?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="leading-tight">
                        <div className="text-[13px] font-semibold text-neutral-900">
                            {item.owner?.username || '익명'}
                            {item.teamName ? ` · ${item.teamName}` : ""}
                        </div>
                        <div className="text-[12.5px] text-neutral-600">{item.owner?.position || '개발자'}</div>
                    </div>
                </div>

                {/* 기술 스택 */}
                {item.language && (
                    <div className="mb-3">
                        <span className="inline-block px-3 py-1 text-[12px] bg-emerald-50 text-emerald-700 rounded-full font-medium">
                            {item.language}
                        </span>
                    </div>
                )}

                <p className="whitespace-pre-line text-[13.5px] leading-7 text-neutral-800">{item.desc}</p>

                <div className="mt-4 flex gap-2">
                    {item.demoUrl && (
                        <a
                            className="inline-flex items-center gap-1 rounded-xl border border-neutral-300 bg-white px-3 py-1.5 text-[13px] font-semibold hover:bg-neutral-50"
                            href={item.demoUrl}
                            target="_blank"
                            rel="noreferrer"
                        >
                            데모 <ExternalLink className="h-4 w-4" />
                        </a>
                    )}
                    {item.repoUrl && (
                        <a
                            className="inline-flex items-center gap-1 rounded-xl border border-neutral-300 bg-white px-3 py-1.5 text-[13px] font-semibold hover:bg-neutral-50"
                            href={item.repoUrl}
                            target="_blank"
                            rel="noreferrer"
                        >
                            GitHub <ExternalLink className="h-4 w-4" />
                        </a>
                    )}
                </div>

                {/* 추가 이미지들 */}
                {item.assets && item.assets.length > 0 && (
                    <div className="mt-6">
                        <h3 className="mb-3 text-[14px] font-semibold text-neutral-900">추가 이미지</h3>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                            {item.assets.map((asset, index) => (
                                <div key={index} className="aspect-[4/3] overflow-hidden rounded-lg">
                                    <img 
                                        src={asset.url} 
                                        alt={`${item.title} 이미지 ${index + 1}`}
                                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                                        onClick={() => window.open(asset.url, '_blank')}
                                    />
                                </div>
                            ))}
                        </div>
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
                    >
                        <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} />
                        {likeCount}
                    </button>
                    <span className="inline-flex items-center gap-1">
            <Eye className="h-4 w-4" /> {item.viewCount}
          </span>
                    <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-4 w-4" /> {comments.length}
          </span>
                </div>

                {/* 투표 */}
                {isChallengeEnded ? (
                    <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-2 text-gray-700">
                            <span className="text-lg">🔒</span>
                            <div>
                                <div className="font-semibold">종료된 챌린지</div>
                                <div className="text-sm text-gray-600">이 챌린지는 이미 종료되어 투표할 수 없습니다.</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="mt-6 space-y-2">
                        <Stars 
                            label="UI/UX" 
                            value={ux} 
                            onChange={setUx} 
                            disabled={!isEditingVote && !!myVote} 
                        />
                        <Stars 
                            label="기술력" 
                            value={tech} 
                            onChange={setTech} 
                            disabled={!isEditingVote && !!myVote} 
                        />
                        <Stars 
                            label="창의성" 
                            value={cre} 
                            onChange={setCre} 
                            disabled={!isEditingVote && !!myVote} 
                        />
                        <Stars 
                            label="기획력" 
                            value={plan} 
                            onChange={setPlan} 
                            disabled={!isEditingVote && !!myVote} 
                        />
                        <div className="text-[12px] text-neutral-500">
                            ※ 데모용으로 중복 투표 제한을 적용하지 않았습니다. (실서비스는 서버에서 검증)
                        </div>
                    </div>
                )}

                <div className="mt-4 flex justify-end gap-2">
                    {myVote && !isEditingVote ? (
                        <>
                            <CTAButton as="button" onClick={startEditingVote} disabled={isChallengeEnded}>
                                투표 수정
                            </CTAButton>
                        </>
                    ) : isEditingVote ? (
                        <>
                            <CTAButton as="button" onClick={cancelEditingVote} disabled={voteLoading}>
                                취소
                            </CTAButton>
                            <CTAButton as="button" onClick={handleVote} disabled={!canVote || voteLoading}>
                                {voteLoading ? "저장 중..." : "저장하기"}
                            </CTAButton>
                        </>
                    ) : (
                        <CTAButton as="button" onClick={handleVote} disabled={!canVote || voteLoading}>
                            {voteLoading ? "투표 중..." : "투표 제출"}
                        </CTAButton>
                    )}
                </div>
            </SectionCard>

            {/* 댓글 */}
            <SectionCard className="!px-5 !py-5 mt-6">
                <h2 className="mb-3 text-[15px] font-bold">댓글 {comments.length}</h2>

                <div className="space-y-4">
                    {comments.map((c) => (
                        <div key={c.id} className="rounded-2xl border p-4">
                            <div className="mb-1 flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-[12.5px] font-bold">
                                    {c.username?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div className="leading-tight">
                                    <div className="text-[13px] font-semibold text-neutral-900">{c.username}</div>
                                    <div className="text-[12px] text-neutral-500">
                                        {new Date(c.createdAt).toLocaleDateString('ko-KR', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                            </div>
                            <div className="whitespace-pre-wrap text-[13.5px] leading-7 text-neutral-800">{c.comment}</div>
                        </div>
                    ))}
                </div>

                {/* 댓글 입력 */}
                {isChallengeEnded ? (
                    <div className="mt-5 rounded-2xl border p-4 bg-gray-50">
                        <div className="flex items-center gap-2 text-gray-600">
                            <span>🔒</span>
                            <span className="text-sm">이 챌린지는 종료되어 댓글을 작성할 수 없습니다.</span>
                        </div>
                    </div>
                ) : (
                    <div className="mt-5 rounded-2xl border p-4">
                        <textarea
                            className="h-24 w-full resize-none rounded-xl border bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                            placeholder="댓글을 작성해보세요."
                            value={cText}
                            onChange={(e) => setCText(e.target.value)}
                        />
                        <div className="mt-2 flex justify-end">
                            <button
                                onClick={submitComment}
                                disabled={!cText.trim()}
                                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:bg-gray-300"
                            >
                                등록하기
                            </button>
                        </div>
                    </div>
                )}
            </SectionCard>
        </div>
    );
}
