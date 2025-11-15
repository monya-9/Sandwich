import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { SectionCard } from "./index";
import CommentLikeAction from "../../OtherProject/ActionBar/CommentLikeAction";
import Toast from "../../common/Toast";
import ConfirmModal from "../../common/ConfirmModal";
import { AuthContext } from "../../../context/AuthContext";
import api from "../../../api/axiosInstance";

// 댓글 타입 정의
export type CommentResponse = {
    id: number;
    comment: string;
    userId: number;
    username: string;
    profileImageUrl?: string;
    createdAt: string;
    subComments: CommentResponse[];
};

interface ChallengeCommentSectionProps {
    commentableType: 'CODE_SUBMISSION' | 'PORTFOLIO_SUBMISSION';
    commentableId: number;
    challengeStatus: string | null;
    comments: CommentResponse[];
    onCommentsChange: (comments: CommentResponse[]) => void;
}

type EditState = { id: number; value: string } | null;
type ReplyState = { parentId: number; value: string } | null;

export default function ChallengeCommentSection({
    commentableType,
    commentableId,
    challengeStatus,
    comments,
    onCommentsChange
}: ChallengeCommentSectionProps) {
    const navigate = useNavigate();
    const { nickname, isLoggedIn, isAuthChecking } = useContext(AuthContext);
    const [commentText, setCommentText] = useState("");
    const [commentLoading, setCommentLoading] = useState(false);
    const [edit, setEdit] = useState<EditState>(null);
    const [reply, setReply] = useState<ReplyState>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ visible: boolean; commentId: number | null }>({
        visible: false,
        commentId: null
    });
    const [errorToast, setErrorToast] = useState<{ visible: boolean; message: string }>({
        visible: false,
        message: ''
    });
    const [successToast, setSuccessToast] = useState<{ visible: boolean; message: string }>({
        visible: false,
        message: ''
    });

    // ✅ httpOnly 쿠키 기반: AuthContext에서 로그인 상태 및 사용자 정보 확인
    const myNickname = nickname || localStorage.getItem("userNickname") || sessionStorage.getItem("userNickname") || "";
    const myId = Number(localStorage.getItem('userId') || sessionStorage.getItem('userId') || '0');

    // 댓글 작성
    const submitComment = async () => {
        const text = commentText.trim();
        if (!text || challengeStatus === "ENDED" || !isLoggedIn) return;
        
        setCommentLoading(true);
        try {
            // 쓰기 작업은 리프레시 허용 (토큰 만료 시 자동 갱신)
            await api.post('/comments', {
                commentableType,
                commentableId,
                comment: text
            });
            
            // 댓글 목록 새로고침
            const response = await api.get('/comments', {
                params: {
                    type: commentableType,
                    id: commentableId
                }
            });
            onCommentsChange(response.data || []);
            setCommentText("");
            setSuccessToast({
                visible: true,
                message: "댓글이 작성되었습니다!"
            });
        } catch (error: any) {
            console.error('댓글 작성 실패:', error);
            setErrorToast({
                visible: true,
                message: "댓글 작성에 실패했습니다."
            });
        } finally {
            setCommentLoading(false);
        }
    };

    // 대댓글 작성
    const handleReply = async (parentId: number, value: string) => {
        if (!value.trim() || !isLoggedIn) return;
        try {
            // 쓰기 작업은 리프레시 허용 (토큰 만료 시 자동 갱신)
            await api.post('/comments', {
                commentableType,
                commentableId,
                parentCommentId: parentId,
                comment: value
            });
            setReply(null);
            
            // 댓글 목록 새로고침
            const response = await api.get('/comments', {
                params: {
                    type: commentableType,
                    id: commentableId
                }
            });
            onCommentsChange(response.data || []);
            setSuccessToast({
                visible: true,
                message: "답글이 작성되었습니다!"
            });
        } catch (e: any) {
            setErrorToast({
                visible: true,
                message: "답글 작성에 실패했습니다."
            });
        }
    };

    // 댓글 삭제
    const handleDeleteClick = (id: number) => {
        if (!isLoggedIn) return;
        setDeleteConfirm({
            visible: true,
            commentId: id
        });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirm.commentId) return;
        try {
            // 쓰기 작업은 리프레시 허용 (토큰 만료 시 자동 갱신)
            await api.delete(`/comments/${deleteConfirm.commentId}`);
            
            // 댓글 목록 새로고침
            const response = await api.get('/comments', {
                params: {
                    type: commentableType,
                    id: commentableId
                }
            });
            onCommentsChange(response.data || []);
            setSuccessToast({
                visible: true,
                message: "댓글이 삭제되었습니다."
            });
        } catch (e: any) {
            setErrorToast({
                visible: true,
                message: "댓글 삭제에 실패했습니다."
            });
        } finally {
            setDeleteConfirm({
                visible: false,
                commentId: null
            });
        }
    };

    const handleDeleteCancel = () => {
        setDeleteConfirm({
            visible: false,
            commentId: null
        });
    };

    // 댓글 수정
    const handleEdit = async () => {
        if (edit && edit.value.trim() && isLoggedIn) {
            try {
                // 쓰기 작업은 리프레시 허용 (토큰 만료 시 자동 갱신)
                await api.put(`/comments/${edit.id}`, {
                    comment: edit.value
                });
                setEdit(null);
                
                // 댓글 목록 새로고침
                const response = await api.get('/comments', {
                    params: {
                        type: commentableType,
                        id: commentableId
                    }
                });
                onCommentsChange(response.data || []);
                setSuccessToast({
                    visible: true,
                    message: "댓글이 수정되었습니다!"
                });
            } catch (e: any) {
                setErrorToast({
                    visible: true,
                    message: "댓글 수정에 실패했습니다."
                });
            }
        }
    };

    const handleUserClick = (userId: number) => {
        if (myId > 0 && myId === userId) {
            navigate('/profile');
        } else {
            navigate(`/users/${userId}`);
        }
    };

    // 댓글 렌더링 함수
    const renderComment = (c: CommentResponse) => (
        <li key={c.id} className="mb-3 border-b pb-2">
            <div className="flex items-center gap-2">
                <b 
                    className="cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => handleUserClick(c.userId)}
                >
                    {c.username}
                </b>
                <span className="text-xs text-gray-400">
                    {typeof c.createdAt === "string" ? c.createdAt.slice(0, 16).replace("T", " ") : ""}
                </span>
            </div>
            {edit?.id === c.id ? (
                <div className="flex gap-2 mt-1">
                    <input
                        value={edit.value}
                        onChange={e => setEdit({ id: c.id, value: e.target.value })}
                        className="border p-1 rounded text-sm flex-1"
                        maxLength={1000}
                        disabled={!isLoggedIn}
                    />
                    <button className="text-green-600 text-xs" onClick={handleEdit} disabled={!isLoggedIn}>저장</button>
                    <button className="text-gray-400 text-xs" onClick={() => setEdit(null)}>취소</button>
                </div>
            ) : (
                <div className="mt-1">{c.comment}</div>
            )}

            <div className="flex gap-2 mt-1 text-xs text-gray-500">
                <CommentLikeAction commentId={c.id} />
                <button
                    onClick={() => isLoggedIn ? setReply({ parentId: c.id, value: "" }) : undefined}
                    disabled={!isLoggedIn}
                    className={!isLoggedIn ? "text-gray-300 cursor-not-allowed" : ""}
                >답글</button>
                {isLoggedIn && myNickname && c.username === myNickname && (
                    <>
                        <button
                            onClick={() => isLoggedIn ? setEdit({ id: c.id, value: c.comment }) : undefined}
                            disabled={!isLoggedIn}
                            className={!isLoggedIn ? "text-gray-300 cursor-not-allowed" : ""}
                        >수정</button>
                        <button
                            className={"text-red-500" + (!isLoggedIn ? " text-gray-300 cursor-not-allowed" : "")}
                            onClick={() => isLoggedIn ? handleDeleteClick(c.id) : undefined}
                            disabled={!isLoggedIn}
                        >삭제</button>
                    </>
                )}
            </div>

            {reply?.parentId === c.id && isLoggedIn && (
                <div className="flex gap-2 mt-1">
                    <input
                        value={reply.value}
                        onChange={e => setReply({ parentId: c.id, value: e.target.value })}
                        className="border p-1 rounded text-sm flex-1"
                        maxLength={1000}
                        placeholder="대댓글을 입력하세요"
                    />
                    <button className="text-blue-600 text-xs" onClick={() => handleReply(c.id, reply.value)}>등록</button>
                    <button className="text-gray-400 text-xs" onClick={() => setReply(null)}>취소</button>
                </div>
            )}

            {c.subComments && c.subComments.length > 0 && (
                <ul className="pl-5 mt-2">
                    {c.subComments.map(renderComment)}
                </ul>
            )}
        </li>
    );

    return (
        <>
            <Toast
                visible={errorToast.visible}
                message={errorToast.message}
                type="error"
                size="medium"
                autoClose={3000}
                closable={true}
                onClose={() => setErrorToast(prev => ({ ...prev, visible: false }))}
            />
            <Toast
                visible={successToast.visible}
                message={successToast.message}
                type="success"
                size="medium"
                autoClose={2000}
                closable={true}
                onClose={() => setSuccessToast(prev => ({ ...prev, visible: false }))}
            />
            <ConfirmModal
                visible={deleteConfirm.visible}
                title="댓글 삭제"
                message="정말 삭제할까요?"
                confirmText="삭제"
                cancelText="취소"
                confirmButtonColor="red"
                onConfirm={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
            />
            <SectionCard className="!px-5 !py-5 mt-6">
                <h2 className="mb-3 text-[15px] font-bold">댓글 {comments.length}</h2>

                {/* 댓글 목록 */}
                <div className="space-y-4 mb-6">
                    {comments.length > 0 ? (
                        <ul>
                            {comments.map(renderComment)}
                        </ul>
                    ) : (
                        <div className="text-center py-8 text-neutral-500 text-[13px]">
                            아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
                        </div>
                    )}
                </div>

                {/* 댓글 입력 */}
                {challengeStatus === "ENDED" ? (
                    <div className="rounded-2xl border p-4 bg-gray-50">
                        <div className="flex items-center gap-2 text-gray-600">
                            <span>🔒</span>
                            <span className="text-sm">이 챌린지는 종료되어 댓글을 작성할 수 없습니다.</span>
                        </div>
                    </div>
                ) : !isLoggedIn ? (
                    <div className="w-full h-20 flex items-center justify-center text-gray-400 text-base">
                        댓글을 작성하려면 <button
                            className="ml-1 text-blue-600 underline"
                            onClick={() => window.location.href = "/login"}
                        >로그인</button>이 필요합니다.
                    </div>
                ) : (
                    <div className="rounded-2xl border p-4">
                        <textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="댓글을 입력하세요..."
                            className="w-full resize-none rounded-lg border-0 bg-transparent p-0 text-[13.5px] leading-6 placeholder-neutral-500 focus:ring-0"
                            rows={3}
                        />
                        <div className="mt-2 flex justify-end">
                            <button
                                onClick={submitComment}
                                disabled={!commentText.trim() || commentLoading}
                                className="rounded-lg bg-emerald-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-emerald-700 disabled:bg-neutral-300"
                            >
                                {commentLoading ? '작성 중...' : '댓글 작성'}
                            </button>
                        </div>
                    </div>
                )}
            </SectionCard>
        </>
    );
}
