import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosInstance";
import { clearAllUserData } from "../../utils/tokenStorage";
import Toast from "../../components/common/Toast";

const AccountDeletionPage: React.FC = () => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const navigate = useNavigate();

    const handleDeleteAccount = async () => {
        if (confirmText !== "탈퇴") {
            setError("정확히 '탈퇴'라고 입력해주세요.");
            return;
        }

        setIsDeleting(true);
        setError(null);

        try {
            // 회원탈퇴 API 호출
            await api.delete("/users/me");
            
            // 모든 사용자 데이터 삭제
            clearAllUserData();
            
            // 성공 토스트 표시
            setShowSuccessToast(true);
            
            // 토스트 표시 후 로그인 페이지로 이동
            setTimeout(() => {
                navigate("/login", { replace: true });
                window.location.reload();
            }, 2000);
        } catch (err: any) {
            console.error("회원탈퇴 오류:", err);
            setError(err?.response?.data?.message || "회원탈퇴 중 오류가 발생했습니다.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                        <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                        회원탈퇴
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        계정을 영구적으로 삭제합니다
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                    <div className="mb-6">
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                            정말로 회원탈퇴를 하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                        </p>
                        
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                            <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">탈퇴 시 삭제되는 데이터:</h3>
                            <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                                <li>• 프로필 정보 및 설정</li>
                                <li>• 업로드한 프로젝트 및 파일</li>
                                <li>• 챌린지 참여 기록</li>
                                <li>• 커뮤니티 활동 기록</li>
                                <li>• 모든 개인 데이터</li>
                            </ul>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                확인을 위해 <span className="font-semibold text-red-600">"탈퇴"</span>라고 입력해주세요:
                            </label>
                            <input
                                type="text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder="탈퇴"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                                disabled={isDeleting}
                            />
                        </div>

                        {error && (
                            <div className="text-red-600 text-sm mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                                {error}
                            </div>
                        )}
                    </div>

                    <div className="flex space-x-3">
                        <button
                            onClick={() => navigate("/mypage")}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                        >
                            취소
                        </button>
                        <button
                            onClick={handleDeleteAccount}
                            disabled={isDeleting || confirmText !== "탈퇴"}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isDeleting ? "탈퇴 중..." : "회원탈퇴"}
                        </button>
                    </div>
                </div>
            </div>
            
            <Toast
                message="회원탈퇴가 완료되었습니다."
                type="success"
                size="medium"
                visible={showSuccessToast}
                onClose={() => setShowSuccessToast(false)}
                autoClose={2000}
            />
        </div>
    );
};

export default AccountDeletionPage;
