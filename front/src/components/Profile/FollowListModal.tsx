import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react";
import api from "../../api/axiosInstance";
import { useNavigate } from "react-router-dom";

interface FollowUser {
  id: number;
  nickname: string;
  profileImageUrl?: string;
}

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  type: "followers" | "following";
}

export default function FollowListModal({ isOpen, onClose, userId, type }: FollowListModalProps) {
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && userId) {
      fetchUsers();
    }
  }, [isOpen, userId, type]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const endpoint = type === "followers" ? `/users/${userId}/followers` : `/users/${userId}/following`;
      const response = await api.get(endpoint);
      setUsers(response.data || []);
    } catch (error) {
      console.error("팔로우 목록 조회 실패:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (clickedUserId: number) => {
    onClose();
    navigate(`/users/${clickedUserId}`);
  };

  if (!isOpen) return null;

  const title = type === "followers" ? "팔로워" : "팔로잉";

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[20050] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-[20051] w-full max-w-[480px] rounded-[12px] bg-white dark:bg-[var(--surface)] shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[var(--border-color)]">
          <h2 className="text-[18px] font-semibold text-black dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/5"
            aria-label="닫기"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* 사용자 목록 */}
        <div className="overflow-y-auto max-h-[60vh] min-h-[200px]">
          {loading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              불러오는 중...
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              {type === "followers" ? "아직 팔로워가 없습니다." : "아직 팔로잉이 없습니다."}
            </div>
          ) : (
            <div className="p-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserClick(user.id)}
                  className="flex items-center py-3 border-b last:border-b-0 border-gray-100 dark:border-[var(--border-color)] cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg px-2 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[var(--avatar-bg)] flex items-center justify-center mr-3 overflow-hidden">
                    {user.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt={user.nickname}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">
                        {user.nickname?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-900 dark:text-white font-medium">{user.nickname}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

