import React from "react";

interface LoginPromptProps {
  onLoginClick?: () => void;
  onSignupClick?: () => void;
  onClose?: () => void;
}

export default function LoginPrompt({
  onLoginClick,
  onSignupClick,
  onClose,
}: LoginPromptProps) {
  return (
    <div className="fixed inset-0 bg-black/40 z-[100000] flex items-center justify-center" onClick={onClose}>
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-[380px] max-w-full pt-8 pb-6 px-7 flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        {/* 샌드위치 이모지 (혹은 이미지로 대체) */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2">
          <span className="text-6xl">🥪</span>
        </div>
        {/* 닫기(X) */}
        <button className="absolute right-4 top-4 text-xl text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white transition" onClick={onClose} aria-label="닫기">×</button>

        <div className="mt-7 mb-2 text-lg font-bold text-center dark:text-white">
          로그인하고<br />샌드위치 시작하기
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-300 text-center mb-6">
          샌드위치에는 다양한 창작자들이 활동하고 있습니다.<br />
          로그인하고 당신의 창작 활동을 시작해보세요!
        </div>

        {/* 로그인 버튼 */}
        <button
          className="w-full py-3 rounded-full bg-black dark:bg-green-600 text-white font-bold text-base mb-3 hover:bg-gray-800 dark:hover:bg-green-700 transition"
          onClick={onLoginClick}
        >
          로그인 하러가기
        </button>

        <div className="text-xs text-gray-400 text-center">
          아직 회원이 아닌가요?{" "}
          <button
            className="text-black dark:text-white underline ml-1"
            onClick={onSignupClick}
          >
            회원가입
          </button>
        </div>
      </div>
    </div>
  );
}
