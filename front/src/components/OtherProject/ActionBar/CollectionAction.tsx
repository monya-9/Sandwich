import React, { useState } from "react";
import { FaFolderMinus } from "react-icons/fa6";
import LoginPrompt from "../LoginPrompt";
import { useNavigate } from "react-router-dom";

export default function CollectionAction() {
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
    if (!token) {
      setShowLoginPrompt(true);
      return;
    }
    // TODO: 컬렉션 추가 동작 (로그인 상태에서만)
  };

  return (
    <div className="relative">
      {showLoginPrompt && (
        <LoginPrompt
          onLoginClick={() => { setShowLoginPrompt(false); navigate("/login"); }}
          onSignupClick={() => { setShowLoginPrompt(false); navigate("/join"); }}
          onClose={() => setShowLoginPrompt(false)}
        />
      )}
      <button
        className="flex flex-col items-center gap-1 group"
        onClick={handleClick}
      >
        <div className="w-14 h-14 rounded-full bg-white shadow flex items-center justify-center mb-1">
          <FaFolderMinus className="w-6 h-6" />
        </div>
        		<span className="text-xs text-white font-semibold text-center">컬렉션</span>
      </button>
    </div>
  );
}
