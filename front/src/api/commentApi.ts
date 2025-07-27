// src/api/commentApi.ts
import axios from "axios";

// 타입 정의 (실제 backend와 동일하게 맞추세요)
export interface CommentResponse {
  id: number;
  comment: string;
  username: string;
  profileImageUrl?: string;
  createdAt: string;
  subComments: CommentResponse[];
}
export interface CommentPostPayload {
  projectId: number;
  comment: string;
  parentCommentId?: number;
}

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8080", // 환경변수 혹은 기본값
  withCredentials: true,
});

// 댓글 목록 조회
export async function fetchComments(projectId: number) {
  return api.get<CommentResponse[]>("/api/comments", {
    params: { type: "Project", id: projectId }
  });
}

// 댓글 작성 (대댓글/일반댓글 통합)
export async function postComment({ projectId, comment, parentCommentId }: CommentPostPayload) {
  return api.post("/api/comments", {
    commentableType: "Project",
    commentableId: projectId,
    parentCommentId: parentCommentId ?? null,
    comment,
  });
}

// 댓글 수정
export async function updateComment({ commentId, comment }: { commentId: number, comment: string }) {
  return api.put(`/api/comments/${commentId}`, { comment });
}

// 댓글 삭제
export async function deleteComment(commentId: number) {
  return api.delete(`/api/comments/${commentId}`);
}
