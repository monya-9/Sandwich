import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import api from "../../../api/axiosInstance";

interface LikedUser {
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
}

interface LikedUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: "PROJECT" | "POST" | "COMMENT" | "CODE_SUBMISSION" | "PORTFOLIO_SUBMISSION";
  targetId: number;
}

export default function LikedUsersModal({ isOpen, onClose, targetType, targetId }: LikedUsersModalProps) {
  const [users, setUsers] = useState<LikedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchLikedUsers = async (page: number = 0) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/likes/users`, {
        params: {
          targetType,
          targetId,
          page,
          size: 10
        }
      });

      const { content, last, totalElements: total } = response.data;
      
      if (page === 0) {
        setUsers(content);
      } else {
        setUsers(prev => [...prev, ...content]);
      }
      
      setHasMore(!last);
      setCurrentPage(page);
      setTotalElements(total);
    } catch (error) {
      console.error("좋아요 사용자 목록 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setUsers([]);
      setCurrentPage(0);
      setHasMore(true);
      fetchLikedUsers(0);
    }
  }, [isOpen, targetType, targetId]);

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchLikedUsers(currentPage + 1);
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[11000]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {targetType === 'COMMENT' ? '댓글 좋아요' : '좋아요'} {totalElements}개
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 사용자 목록 */}
        <div className="overflow-y-auto max-h-[60vh]">
          {users.length === 0 && !loading ? (
            <div className="p-8 text-center text-gray-500">
              아직 좋아요가 없습니다.
            </div>
          ) : (
            <div className="p-4">
              {users.map((user, index) => (
                <div key={user.userId} className="flex items-center py-3 border-b last:border-b-0">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3 overflow-hidden">
                    {user.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt={user.nickname}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8c0 2.208-1.79 4-3.998 4-2.208 0-3.998-1.792-3.998-4s1.79-4 3.998-4c2.208 0 3.998 1.792 3.998 4z" />
                      </svg>
                    )}
                  </div>
                  <span className="text-gray-900 font-medium">{user.nickname}</span>
                </div>
              ))}
              
              {/* 더보기 버튼 */}
              {hasMore && (
                <div className="pt-4">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? "로딩 중..." : "더보기"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}