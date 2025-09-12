import React, { useEffect, useState, useCallback } from "react";
import {
  fetchComments, postComment, updateComment, deleteComment,
  CommentResponse
} from "../../../api/commentApi";
import CommentLikeAction from "./CommentLikeAction";

interface CommentPanelProps {
  onClose: () => void;
  username: string; // 추가!
  projectId: number;
  projectName: string;
  category: string;
  width?: number | string;
  isLoggedIn: boolean;
}

type EditState = { id: number; value: string } | null;
type ReplyState = { parentId: number; value: string } | null;

export default function CommentPanel({
  onClose, username, projectId, projectName, category, width = 440, isLoggedIn
}: CommentPanelProps) {
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [edit, setEdit] = useState<EditState>(null);
  const [reply, setReply] = useState<ReplyState>(null);

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
        alert("댓글을 불러올 수 없습니다");
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
    await postComment({ username, projectId, comment: input });
    setInput("");
    loadComments();
  };
  const handleReply = async (parentId: number, value: string) => {
    if (!value.trim() || !isLoggedIn) return;
    await postComment({ username, projectId, comment: value, parentCommentId: parentId });
    setReply(null);
    loadComments();
  };
  const handleDelete = async (id: number) => {
    if (!window.confirm("정말 삭제할까요?") || !isLoggedIn) return;
    await deleteComment(id);
    loadComments();
  };
  const handleEdit = async () => {
    if (edit && edit.value.trim() && isLoggedIn) {
      await updateComment({ commentId: edit.id, comment: edit.value });
      setEdit(null);
      loadComments();
    }
  };

  // 댓글 렌더링
  const renderComment = (c: CommentResponse) => (
    <li key={c.id} className="mb-3 border-b pb-2">
      <div className="flex items-center gap-2">
        <b>{c.username}</b>
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
        <button
          onClick={() => isLoggedIn ? setEdit({ id: c.id, value: c.comment }) : undefined}
          disabled={!isLoggedIn}
          className={!isLoggedIn ? "text-gray-300 cursor-not-allowed" : ""}
        >수정</button>
        <button
          className={"text-red-500" + (!isLoggedIn ? " text-gray-300 cursor-not-allowed" : "")}
          onClick={() => isLoggedIn ? handleDelete(c.id) : undefined}
          disabled={!isLoggedIn}
        >삭제</button>
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
    <aside
      className="bg-white shadow-2xl border border-gray-200 flex flex-col z-40 transition-all rounded-2xl"
      style={{
        width,
        minWidth: 320,
        maxWidth: 560,
        height: "100%",
        borderRadius: "16px",
        background: "#fff",
        border: "none",
      }}
    >
      {/* 상단 영역 */}
      <div className="relative pt-8 pb-3 px-8 bg-white rounded-t-2xl border-b border-gray-100">
        <button
          className="absolute right-6 top-7 text-2xl text-gray-400 hover:text-black transition"
          aria-label="닫기"
          onClick={onClose}
        >×</button>
        <div className="text-base font-bold text-gray-900 mb-0.5">{projectName}</div>
        <div className="text-xs text-gray-500">{category}</div>
      </div>
      {/* 댓글 작성 영역 */}
      <div className="flex flex-col gap-2 px-8 py-4 border-b border-gray-100">
        {isLoggedIn ? (
          <>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              className="w-full h-20 p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm resize-none"
              placeholder="댓글을 남겨주세요"
            />
            <button
              className="px-5 py-2 bg-black text-white rounded-full font-bold text-sm self-end"
              onClick={handlePost}
            >
              댓글 작성
            </button>
          </>
        ) : (
          <div className="w-full h-20 flex items-center justify-center text-gray-400 text-base">
            댓글을 작성하려면 <button
              className="ml-1 text-blue-600 underline"
              onClick={() => window.location.href = "/login"}
            >로그인</button>이 필요합니다.
          </div>
        )}
      </div>
      {/* 댓글 리스트 */}
      <div className="flex-1 overflow-y-auto px-8 py-4">
        {loading ? (
          <div>로딩중...</div>
        ) : (
          <ul>
            {comments.map(renderComment)}
            {comments.length === 0 && <div>아직 댓글이 없습니다.</div>}
          </ul>
        )}
      </div>
    </aside>
  );
}
