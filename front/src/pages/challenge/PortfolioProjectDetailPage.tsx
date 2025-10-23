import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SectionCard, CTAButton, ChallengeCommentSection, CommentResponse } from "../../components/challenge/common";
import { ChevronLeft, Star, ExternalLink, Heart, Eye, MessageSquare, Edit2, Trash2 } from "lucide-react";
import Toast from "../../components/common/Toast";
import { fetchChallengeSubmissionDetail, deleteChallengeSubmission, type SubmissionDetailResponse } from "../../api/submissionApi";
import { 
    fetchChallengeDetail, 
    createVote, 
    updateMyVote, 
    getMyVote,
    type VoteRequest,
    type MyVoteResponse
} from "../../api/challengeApi";
import { getMe } from "../../api/users";
import api from "../../api/axiosInstance";
import { isAdmin } from "../../utils/authz";

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
    const admin = isAdmin();

    const [item, setItem] = useState<SubmissionDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [comments, setComments] = useState<CommentResponse[]>([]);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    
    // 챌린지 상태 확인
    const [challengeStatus, setChallengeStatus] = useState<string | null>(null);
    const [timeline, setTimeline] = useState<{ startAt?: string; endAt?: string; voteStartAt?: string; voteEndAt?: string }>({});
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

    // 현재 사용자 및 소유자 확인
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [isOwner, setIsOwner] = useState(false);

    // 현재 사용자 정보 로드
    useEffect(() => {
        const loadCurrentUser = async () => {
            try {
                const me = await getMe();
                setCurrentUserId(me.id);
            } catch (error) {
                console.error('사용자 정보 로드 실패:', error);
                setCurrentUserId(null);
            }
        };

        loadCurrentUser();
    }, []);

    // 소유자 확인
    useEffect(() => {
        if (currentUserId && item?.owner?.userId) {
            setIsOwner(currentUserId === item.owner.userId);
        } else {
            setIsOwner(false);
        }
    }, [currentUserId, item]);

    // 챌린지 상태 로드
    useEffect(() => {
        const loadChallengeData = async () => {
            setChallengeLoading(true);
            try {
                const backendChallenge = await fetchChallengeDetail(id);
                setChallengeStatus(backendChallenge.status);
                setTimeline({
                    startAt: backendChallenge.startAt,
                    endAt: backendChallenge.endAt,
                    voteStartAt: backendChallenge.voteStartAt,
                    voteEndAt: backendChallenge.voteEndAt,
                });
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
                const response = await api.get('/comments', {
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
                const response = await api.get('/likes', {
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
            const myVoteData = await getMyVote(id);
                setMyVote(myVoteData);
                
                // 기존 투표가 있고, 현재 제출물에 대한 투표인 경우에만 별점 초기화
                if (myVoteData && myVoteData.submissionId === item?.id) {
                    setUx(myVoteData.uiUx);
                    setTech(myVoteData.codeQuality);
                    setCre(myVoteData.creativity);
                    setPlan(myVoteData.difficulty);
                } else if (myVoteData) {
                    // 다른 제출물에 투표한 경우 별점을 0으로 초기화
                    setUx(0);
                    setTech(0);
                    setCre(0);
                    setPlan(0);
                } else {
                    setUx(0);
                    setTech(0);
                    setCre(0);
                    setPlan(0);
                }
            } catch (error) {
                console.error('투표 데이터 로드 실패:', error);
                setMyVote(null);
            }
        };

        // 투표 가능한 상태이거나 이미 투표한 상태라면 투표 데이터 로드
        // 투표 가능한 기간에만 투표 데이터 로드
        const parseTs = (v?: string) => {
            if (!v) return null;
            const s = v.includes('T') ? v : v.replace(' ', 'T');
            const d = new Date(s);
            return isNaN(d.getTime()) ? null : d;
        };
        const now = new Date();
        const vStart = parseTs(timeline.voteStartAt);
        const vEnd = parseTs(timeline.voteEndAt);
        const votingNow = !!(vStart && now >= vStart && (!vEnd || now <= vEnd));
        if (votingNow && item) {
            loadVoteData();
        }
    }, [id, challengeStatus, item, timeline.voteStartAt, timeline.voteEndAt]);

    // 페이지 로드 시 투표 상태 확인 (추가 보장)
    useEffect(() => {
        const checkVoteStatus = async () => {
            if (item && (challengeStatus === "OPEN" || challengeStatus === "VOTING")) {
                try {
                    const myVoteData = await getMyVote(id);
                    if (myVoteData && !myVote) {
                        setMyVote(myVoteData);
                        
                        // 현재 제출물에 대한 투표인 경우에만 별점 표시
                        if (myVoteData.submissionId === item?.id) {
                            setUx(myVoteData.uiUx);
                            setTech(myVoteData.codeQuality);
                            setCre(myVoteData.creativity);
                            setPlan(myVoteData.difficulty);
                        } else {
                            setUx(0);
                            setTech(0);
                            setCre(0);
                            setPlan(0);
                        }
                    }
                } catch (error) {
                    console.error('투표 상태 확인 실패:', error);
                }
            }
        };

        // 약간의 지연 후 실행 (다른 useEffect들이 완료된 후)
        const timer = setTimeout(checkVoteStatus, 100);
        return () => clearTimeout(timer);
    }, [item, challengeStatus, id, myVote]);

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
            
            // 별점 상태도 업데이트 (현재 제출물에 대한 투표인 경우에만)
            if (updatedVote && updatedVote.submissionId === item?.id) {
                console.log('⭐ 투표 후 별점 업데이트:', {
                    submissionId: updatedVote.submissionId,
                    currentItemId: item?.id,
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
            
            // 409 DUPLICATE_VOTE 에러인 경우 기존 투표 정보를 불러와서 표시
            if (error?.response?.status === 409) {
                try {
                    console.log('🔄 중복 투표 감지 - 기존 투표 정보 불러오기');
                    const existingVote = await getMyVote(id);
                    if (existingVote) {
                        console.log('✅ 기존 투표 정보 발견:', {
                            submissionId: existingVote.submissionId,
                            currentItemId: item?.id
                        });
                        setMyVote(existingVote);
                        
                        // 현재 제출물에 대한 투표인 경우에만 별점 표시
                        if (existingVote.submissionId === item?.id) {
                            console.log('⭐ 현재 제출물에 대한 기존 투표 - 별점 표시');
                            setUx(existingVote.uiUx);
                            setTech(existingVote.codeQuality);
                            setCre(existingVote.creativity);
                            setPlan(existingVote.difficulty);
                            
                            setToast({
                                visible: true,
                                message: "이미 투표한 제출물입니다. 기존 투표가 표시됩니다.",
                                type: 'info'
                            });
                        } else {
                            console.log('⚠️ 다른 제출물에 대한 기존 투표 - 별점 초기화');
                            setUx(0);
                            setTech(0);
                            setCre(0);
                            setPlan(0);
                            
                            setToast({
                                visible: true,
                                message: "다른 제출물에 이미 투표했습니다.",
                                type: 'info'
                            });
                        }
                    } else {
                        setToast({
                            visible: true,
                            message: "이미 투표한 제출물입니다.",
                            type: 'error'
                        });
                    }
                } catch (voteError) {
                    console.error('기존 투표 정보 불러오기 실패:', voteError);
                    setToast({
                        visible: true,
                        message: "이미 투표한 제출물입니다.",
                        type: 'error'
                    });
                }
            } else {
                let errorMessage = "투표에 실패했습니다.";
                if (error?.response?.status === 400) {
                    errorMessage = "투표 기간이 아닙니다.";
                } else if (error?.response?.status === 403) {
                    errorMessage = "자신의 작품에는 투표할 수 없습니다.";
                }

                setToast({
                    visible: true,
                    message: errorMessage,
                    type: 'error'
                });
            }
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
    const parseTs = (v?: string) => {
        if (!v) return null;
        const s = v.includes('T') ? v : v.replace(' ', 'T');
        const d = new Date(s);
        return isNaN(d.getTime()) ? null : d;
    };
    const now = new Date();
    const endAt = parseTs(timeline.endAt);
    const vStart = parseTs(timeline.voteStartAt);
    const vEnd = parseTs(timeline.voteEndAt);
    const isVoting = !!(vStart && now >= vStart && (!vEnd || now <= vEnd));
    const isChallengeEnded = !!(vEnd && now > vEnd);
    const canVote = ux > 0 && tech > 0 && cre > 0 && plan > 0 && isVoting && !isChallengeEnded;

    // handleVote 함수는 위에서 이미 정의됨 (API 연결 버전)


    const toggleLike = async () => {
        if (isChallengeEnded) return; // 종료된 챌린지에서는 좋아요 불가
        try {
            const response = await api.post('/likes', {
                targetType: 'PORTFOLIO_SUBMISSION',
                targetId: pid
            });
            setLiked(response.data.likedByMe);
            setLikeCount(response.data.likeCount);
        } catch (error) {
            console.error('좋아요 처리 실패:', error);
        }
    };

    // 제출 기간 확인 (포트폴리오는 제출 기간 내에서만 수정/삭제 가능)
    const canEditOrDelete = () => {
        if (!isOwner) return false;
        
        const now = new Date();
        const endAt = parseTs(timeline.endAt);
        
        // 제출 기간(now < challenge.endAt) 내에서만 가능
        return !!(endAt && now < endAt);
    };

    // 제출물 삭제
    const handleDelete = async () => {
        if (!canEditOrDelete()) {
            setToast({
                visible: true,
                message: '제출 기간이 종료되어 삭제할 수 없습니다.',
                type: 'error'
            });
            return;
        }

        if (!window.confirm('정말로 이 제출물을 삭제하시겠습니까?')) {
            return;
        }

        try {
            await deleteChallengeSubmission(id, pid);
            setToast({
                visible: true,
                message: '제출물이 삭제되었습니다.',
                type: 'success'
            });
            setTimeout(() => {
                nav(`/challenge/portfolio/${id}/vote`);
            }, 1000);
        } catch (error) {
            console.error('제출물 삭제 실패:', error);
            setToast({
                visible: true,
                message: '제출물 삭제에 실패했습니다.',
                type: 'error'
            });
        }
    };

    // 제출물 수정
    const handleEdit = () => {
        if (!canEditOrDelete()) {
            setToast({
                visible: true,
                message: '제출 기간이 종료되어 수정할 수 없습니다.',
                type: 'error'
            });
            return;
        }
        
        nav(`/challenge/portfolio/${id}/submit?edit=${pid}`);
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
                {/* 상태 배지 */}
                {(() => {
                    const now = new Date();
                    const parseTs = (v?: string) => {
                        if (!v) return null; const s = v.includes('T') ? v : v.replace(' ', 'T');
                        const d = new Date(s); return isNaN(d.getTime()) ? null : d;
                    };
                    const vStart = parseTs(timeline.voteStartAt);
                    const vEnd = parseTs(timeline.voteEndAt);
                    const isEnded = !!(vEnd && now > vEnd);
                    const isVoting = !!(vStart && now >= vStart && (!vEnd || now <= vEnd));
                    const badge = isEnded
                        ? { t: '종료', c: 'border-neutral-300 text-neutral-600' }
                        : isVoting
                        ? { t: '투표중', c: 'border-purple-300 text-purple-700 bg-purple-50' }
                        : { t: '투표대기', c: 'border-amber-300 text-amber-700 bg-amber-50' };
                    return (
                        <span className={`ml-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[11.5px] ${badge.c}`}>{badge.t}</span>
                    );
                })()}
                {/* 관리자 수정 버튼 제거 요청에 따라 숨김 */}
            </div>


            <SectionCard className="!px-5 !py-5">
                {/* 작성자 */}
                <div className="mb-3 flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
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
                    
                    {/* 수정/삭제 버튼 (소유자이고 제출 기간 내이며 챌린지가 종료되지 않았을 때만 표시) */}
                    {isOwner && canEditOrDelete() && challengeStatus !== "ENDED" && !isChallengeEnded && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleEdit}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-[12px] text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                title="수정"
                            >
                                <Edit2 className="h-3.5 w-3.5" />
                                수정
                            </button>
                            <button
                                onClick={handleDelete}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-[12px] text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                title="삭제"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                삭제
                            </button>
                        </div>
                    )}
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

                {/* 투표 섹션 */}
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
                ) : !isVoting ? (
                    <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center gap-2 text-amber-800">
                            <span className="text-lg">⏳</span>
                            <div>
                                <div className="font-semibold">투표 대기 중</div>
                                <div className="text-sm">현재는 제출물만 확인할 수 있어요. 투표 시작 후 별점 입력이 활성화됩니다.</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    // 투표 섹션 표시 조건
                    myVote && myVote.submissionId === item?.id ? (
                        // 현재 제출물에 투표한 경우 - 투표한 별점 표시
                        <div className="mt-6 space-y-2">
                            <Stars 
                                label="UI/UX" 
                                value={ux} 
                                onChange={setUx} 
                                disabled={!isEditingVote}
                            />
                            <Stars 
                                label="기술력" 
                                value={tech} 
                                onChange={setTech} 
                                disabled={!isEditingVote}
                            />
                            <Stars 
                                label="창의성" 
                                value={cre} 
                                onChange={setCre} 
                                disabled={!isEditingVote}
                            />
                            <Stars 
                                label="기획력" 
                                value={plan} 
                                onChange={setPlan} 
                                disabled={!isEditingVote}
                            />
                        </div>
                    ) : myVote && myVote.submissionId !== item?.id ? (
                        // 다른 제출물에 투표한 경우 - 안내 메시지
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 text-blue-700">
                                <span className="text-lg">ℹ️</span>
                                <div>
                                    <div className="font-semibold">이미 다른 제출물에 투표했습니다</div>
                                    <div className="text-sm text-blue-600">한 챌린지당 하나의 제출물에만 투표할 수 있습니다.</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // 아직 투표하지 않은 경우 - 투표 섹션 표시
                        <div className="mt-6 space-y-2">
                            <Stars 
                                label="UI/UX" 
                                value={ux} 
                                onChange={setUx} 
                                disabled={false}
                            />
                            <Stars 
                                label="기술력" 
                                value={tech} 
                                onChange={setTech} 
                                disabled={false}
                            />
                            <Stars 
                                label="창의성" 
                                value={cre} 
                                onChange={setCre} 
                                disabled={false}
                            />
                            <Stars 
                                label="기획력" 
                                value={plan} 
                                onChange={setPlan} 
                                disabled={false}
                            />
                </div>
                    )
                )}

                {/* 투표 버튼 */}
                {!isChallengeEnded && (
                    <div className="mt-4 flex justify-end gap-2">
                        {myVote && myVote.submissionId === item?.id ? (
                            // 현재 제출물에 투표한 경우
                            !isEditingVote ? (
                                <CTAButton as="button" onClick={startEditingVote}>
                                    투표 수정
                                </CTAButton>
                            ) : (
                                <>
                                    <CTAButton as="button" onClick={cancelEditingVote} disabled={voteLoading}>
                                        취소
                                    </CTAButton>
                                    <CTAButton as="button" onClick={handleVote} disabled={!canVote || voteLoading}>
                                        {voteLoading ? "저장 중..." : "저장하기"}
                                    </CTAButton>
                                </>
                            )
                        ) : !myVote ? (
                            // 아직 투표하지 않은 경우
                            <CTAButton as="button" onClick={handleVote} disabled={!canVote || voteLoading}>
                                {voteLoading ? "투표 중..." : "투표 제출"}
                    </CTAButton>
                        ) : null}
                        {/* 다른 제출물에 투표한 경우는 버튼 없음 */}
                </div>
                )}
            </SectionCard>

            {/* 댓글 */}
            <ChallengeCommentSection
                commentableType="PORTFOLIO_SUBMISSION"
                commentableId={pid}
                challengeStatus={challengeStatus}
                comments={comments}
                onCommentsChange={setComments}
            />
        </div>
    );
}
