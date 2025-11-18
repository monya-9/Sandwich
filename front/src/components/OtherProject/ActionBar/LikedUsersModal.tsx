import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

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

  const handleUserClick = (userId: number) => {
    onClose();
    navigate(`/users/${userId}`);
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-3 sm:p-4">
      <div className="bg-white dark:bg-[var(--surface)] rounded-lg sm:rounded-xl shadow-xl max-w-md w-full max-h-[80vh] sm:max-h-[85vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-[var(--border-color)]">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            {targetType === 'COMMENT' ? '댓글 좋아요' : '좋아요'} {totalElements}개
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 사용자 목록 */}
        <div className="overflow-y-auto max-h-[calc(80vh-80px)] sm:max-h-[calc(85vh-90px)]">
          {users.length === 0 && !loading ? (
            <div className="p-6 sm:p-8 text-center text-gray-500 dark:text-gray-400 text-sm sm:text-base">
              아직 좋아요가 없습니다.
            </div>
          ) : (
            <div className="p-3 sm:p-4">
              {users.map((user, index) => (
                <div
                  key={user.userId}
                  className="flex items-center py-2 sm:py-3 border-b border-gray-100 dark:border-[var(--border-color)] last:border-b-0"
                >
                  <div
                    onClick={() => handleUserClick(user.userId)}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-200 dark:bg-[var(--avatar-bg)] flex items-center justify-center mr-2 sm:mr-3 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                  >
                    {user.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt={user.nickname}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8c0 2.208-1.79 4-3.998 4-2.208 0-3.998-1.792-3.998-4s1.79-4 3.998-4c2.208 0 3.998 1.792 3.998 4z" />
                      </svg>
                    )}
                  </div>
                  <span
                    onClick={() => handleUserClick(user.userId)}
                    className="text-gray-900 dark:text-white font-medium cursor-pointer hover:underline text-sm sm:text-base truncate"
                  >
                    {user.nickname}
                  </span>
                </div>
              ))}
              
              {/* 더보기 버튼 */}
              {hasMore && (
                <div className="pt-3 sm:pt-4">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="w-full py-2 px-4 bg-gray-100 dark:bg-[var(--surface)] hover:bg-gray-200 dark:hover:bg-[#1a1a1a] text-gray-700 dark:text-white rounded-lg transition-colors disabled:opacity-50 text-sm sm:text-base"
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