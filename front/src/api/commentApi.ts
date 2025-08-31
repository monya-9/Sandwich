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

// LikeAction과 동일한 방식으로 토큰을 헤더에 추가하는 함수
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// 댓글 목록 조회
export async function fetchComments(username: string, projectId: number) {
  return axios.get<CommentResponse[]>("/api/comments", {
    params: { type: "Project", username, id: projectId },
    withCredentials: true,
    headers: getAuthHeaders(),
  });
}

// 댓글 작성
export async function postComment({
  username, projectId, comment, parentCommentId
}: CommentPostPayload) {
  return axios.post("/api/comments", {
    commentableType: "Project",
    commentableUsername: username,
    commentableId: projectId,
    parentCommentId: parentCommentId ?? null,
    comment,
  }, {
    withCredentials: true,
    headers: getAuthHeaders(),
  });
}

// 댓글 수정
export async function updateComment({ commentId, comment }: { commentId: number, comment: string }) {
  return axios.put(`/api/comments/${commentId}`, { comment }, {
    withCredentials: true,
    headers: getAuthHeaders(),
  });
}

// 댓글 삭제
export async function deleteComment(commentId: number) {
  return axios.delete(`/api/comments/${commentId}`, {
    withCredentials: true,
    headers: getAuthHeaders(),
  });
}
