import React, { useEffect, useState, useCallback, useContext } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  fetchComments, postComment, updateComment, deleteComment,
  CommentResponse
} from "../../../api/commentApi";
import CommentLikeAction from "./CommentLikeAction";
import Toast from "../../common/Toast";
import ConfirmModal from "../../common/ConfirmModal";
import { AuthContext } from "../../../context/AuthContext";

interface CommentPanelProps {
  onClose: () => void;
  username: string; // 추가!
  projectId: number;
  projectName: string;
  category: string;
  width?: number | string;
  isLoggedIn: boolean;
  isMobile?: boolean;
}

type EditState = { id: number; value: string } | null;
type ReplyState = { parentId: number; value: string } | null;

export default function CommentPanel({
  onClose, username, projectId, projectName, category, width = 440, isLoggedIn, isMobile = false
}: CommentPanelProps) {
  const navigate = useNavigate();
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [edit, setEdit] = useState<EditState>(null);
  const [reply, setReply] = useState<ReplyState>(null);
  const [errorToast, setErrorToast] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: ''
  });
  const [successToast, setSuccessToast] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: ''
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ visible: boolean; commentId: number | null }>({
    visible: false,
    commentId: null
  });
  const { nickname } = useContext(AuthContext);
  const myNickname = nickname || localStorage.getItem("userNickname") || sessionStorage.getItem("userNickname") || "";
  const myId = Number(localStorage.getItem('userId') || sessionStorage.getItem('userId') || '0');

  // username, projectId 의존성 추가!
  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchComments(username, projectId);
      setComments(res.data);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401 || status === 404) {
        setComments([]);
      } else {
        setErrorToast({
          visible: true,
          message: "댓글을 불러올 수 없습니다"
        });
      }
    }
    setLoading(false);
  }, [username, projectId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // 댓글 작성/대댓글/수정/삭제 (로그인 상태에서만 동작)
  const handlePost = async () => {
    if (!input.trim() || !isLoggedIn) return;
    try {
      await postComment({ username, projectId, comment: input });
      setInput("");
      loadComments();
      setSuccessToast({
        visible: true,
        message: "댓글이 작성되었습니다!"
      });
      // 프로젝트 통계 갱신 이벤트 발생
      window.dispatchEvent(new CustomEvent("project:stats:refresh"));
    } catch (e: any) {
      setErrorToast({
        visible: true,
        message: "댓글 작성에 실패했습니다."
      });
    }
  };
  const handleReply = async (parentId: number, value: string) => {
    if (!value.trim() || !isLoggedIn) return;
    try {
      await postComment({ username, projectId, comment: value, parentCommentId: parentId });
      setReply(null);
      loadComments();
      setSuccessToast({
        visible: true,
        message: "답글이 작성되었습니다!"
      });
      // 프로젝트 통계 갱신 이벤트 발생
      window.dispatchEvent(new CustomEvent("project:stats:refresh"));
    } catch (e: any) {
      setErrorToast({
        visible: true,
        message: "답글 작성에 실패했습니다."
      });
    }
  };
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
      await deleteComment(deleteConfirm.commentId);
      loadComments();
      setSuccessToast({
        visible: true,
        message: "댓글이 삭제되었습니다."
      });
      // 프로젝트 통계 갱신 이벤트 발생
      window.dispatchEvent(new CustomEvent("project:stats:refresh"));
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
  const handleEdit = async () => {
    if (edit && edit.value.trim() && isLoggedIn) {
      try {
        await updateComment({ commentId: edit.id, comment: edit.value });
        setEdit(null);
        loadComments();
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
    onClose();
  };

  // 댓글 렌더링
  const renderComment = (c: CommentResponse) => (
    <li key={c.id} className="mb-2 sm:mb-3 border-b border-gray-100 dark:border-[var(--border-color)] pb-2">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <b 
          className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-xs sm:text-sm dark:text-white"
          onClick={() => handleUserClick(c.userId)}
        >
          {c.username}
        </b>
        <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">
          {typeof c.createdAt === "string" ? c.createdAt.slice(0, 16).replace("T", " ") : ""}
        </span>
      </div>
      {edit?.id === c.id ? (
        <div className="flex gap-1.5 sm:gap-2 mt-1">
          <input
            value={edit.value}
            onChange={e => setEdit({ id: c.id, value: e.target.value })}
            className="border border-gray-200 p-1 rounded text-xs sm:text-sm flex-1 bg-white text-gray-900"
            maxLength={1000}
            disabled={!isLoggedIn}
          />
          <button className="text-green-600 text-[10px] sm:text-xs whitespace-nowrap" onClick={handleEdit} disabled={!isLoggedIn}>저장</button>
          <button className="text-gray-400 text-[10px] sm:text-xs whitespace-nowrap" onClick={() => setEdit(null)}>취소</button>
        </div>
      ) : (
        <div className="mt-1 text-xs sm:text-sm dark:text-gray-200">{c.comment}</div>
      )}

      <div className="flex gap-1.5 sm:gap-2 mt-1 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
        <CommentLikeAction commentId={c.id} />
        <button
          onClick={() => isLoggedIn ? setReply({ parentId: c.id, value: "" }) : undefined}
          disabled={!isLoggedIn}
          className={!isLoggedIn ? "text-gray-300 cursor-not-allowed" : "hover:text-gray-700 dark:hover:text-gray-300"}
        >답글</button>
        {isLoggedIn && myNickname && c.username === myNickname && (
          <>
            <button
              onClick={() => isLoggedIn ? setEdit({ id: c.id, value: c.comment }) : undefined}
              disabled={!isLoggedIn}
              className={!isLoggedIn ? "text-gray-300 cursor-not-allowed" : "hover:text-gray-700 dark:hover:text-gray-300"}
            >수정</button>
            <button
              className={"text-red-500 hover:text-red-600" + (!isLoggedIn ? " text-gray-300 cursor-not-allowed" : "")}
              onClick={() => isLoggedIn ? handleDeleteClick(c.id) : undefined}
              disabled={!isLoggedIn}
            >삭제</button>
          </>
        )}
      </div>

      {reply?.parentId === c.id && isLoggedIn && (
        <div className="flex gap-1.5 sm:gap-2 mt-1">
          <input
            value={reply.value}
            onChange={e => setReply({ parentId: c.id, value: e.target.value })}
            className="border border-gray-200 p-1 rounded text-xs sm:text-sm flex-1 bg-white text-gray-900"
            maxLength={1000}
            placeholder="대댓글을 입력하세요"
          />
          <button className="text-blue-600 text-[10px] sm:text-xs whitespace-nowrap hover:text-blue-700" onClick={() => handleReply(c.id, reply.value)}>등록</button>
          <button className="text-gray-400 text-[10px] sm:text-xs whitespace-nowrap hover:text-gray-600" onClick={() => setReply(null)}>취소</button>
        </div>
      )}

      {c.subComments && c.subComments.length > 0 && (
        <ul className="pl-3 sm:pl-5 mt-2">
          {c.subComments.map(renderComment)}
        </ul>
      )}
    </li>
  );

  const panelContent = (
    <aside
      className="bg-white dark:bg-[var(--surface)] shadow-2xl border border-gray-200 dark:border-[var(--border-color)] flex flex-col z-40 transition-all rounded-2xl"
      style={{
        width: isMobile ? '100%' : width,
        minWidth: isMobile ? 'auto' : 320,
        maxWidth: isMobile ? '100vw' : 560,
        height: isMobile ? '85vh' : "100%",
        maxHeight: isMobile ? '85vh' : 'none',
        borderRadius: "16px",
        background: "#fff",
        border: "none",
      }}
    >
      {/* 상단 영역 */}
      <div className="relative pt-4 sm:pt-6 md:pt-8 pb-2 sm:pb-2.5 md:pb-3 px-4 sm:px-6 md:px-8 bg-white dark:bg-[var(--surface)] rounded-t-2xl border-b border-gray-100 dark:border-[var(--border-color)]">
        <button
          className="absolute right-3 sm:right-4 md:right-6 top-3 sm:top-5 md:top-7 text-xl sm:text-2xl text-gray-400 hover:text-black dark:hover:text-white transition"
          aria-label="닫기"
          onClick={onClose}
        >×</button>
        <div className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-0.5">{projectName}</div>
        <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{category}</div>
      </div>
      {/* 댓글 작성 영역 */}
      <div className="flex flex-col gap-2 px-4 sm:px-6 md:px-8 py-3 sm:py-3.5 md:py-4 border-b border-gray-100 dark:border-[var(--border-color)]">
        {isLoggedIn ? (
          <>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              className="w-full h-16 sm:h-18 md:h-20 p-2 sm:p-2.5 md:p-3 border border-gray-200 dark:border-[var(--border-color)] rounded-xl bg-gray-50 dark:bg-[var(--surface)] text-xs sm:text-sm resize-none dark:text-white"
              placeholder="댓글을 남겨주세요"
            />
            <button
              className="px-3 sm:px-4 md:px-5 py-1.5 sm:py-1.5 md:py-2 bg-black text-white rounded-full font-bold text-xs sm:text-sm self-end hover:bg-gray-800 transition"
              onClick={handlePost}
            >
              댓글 작성
            </button>
          </>
        ) : (
          <div className="w-full h-16 sm:h-18 md:h-20 flex items-center justify-center text-gray-400 text-xs sm:text-sm md:text-base px-2">
            댓글을 작성하려면 <button
              className="ml-1 text-blue-600 underline"
              onClick={() => window.location.href = "/login"}
            >로그인</button>이 필요합니다.
          </div>
        )}
      </div>
      {/* 댓글 리스트 */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-3 sm:py-3.5 md:py-4">
        {loading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">로딩중...</div>
        ) : (
          <ul>
            {comments.map(renderComment)}
            {comments.length === 0 && <div className="text-sm text-gray-500 dark:text-gray-400">아직 댓글이 없습니다.</div>}
          </ul>
        )}
      </div>
    </aside>
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
      {isMobile ? ReactDOM.createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3" onClick={onClose}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-[100001] w-full max-w-[95vw]" onClick={(e) => e.stopPropagation()}>
            {panelContent}
          </div>
        </div>,
        document.body
      ) : panelContent}
    </>
  );
}
