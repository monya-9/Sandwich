// src/api/commentApi.ts
import axios from "axios";

// 타입 정의 (동일)
export interface CommentResponse {
  id: number;
  comment: string;
  username: string;
  profileImageUrl?: string;
  createdAt: string;
  subComments: CommentResponse[];
}
export interface CommentPostPayload {
  username: string; // 추가됨!
  projectId: number;
  comment: string;
  parentCommentId?: number;
}

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8080",
  withCredentials: true,
});

// 댓글 목록 조회
export async function fetchComments(username: string, projectId: number) {
  return api.get<CommentResponse[]>("/api/comments", {
    params: { type: "Project", username, id: projectId }
  });
}

// 댓글 작성
export async function postComment({
  username, projectId, comment, parentCommentId
}: CommentPostPayload) {
  return api.post("/api/comments", {
    commentableType: "Project",
    commentableUsername: username,
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
