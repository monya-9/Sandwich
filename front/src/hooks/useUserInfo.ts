// src/hooks/useUserInfo.ts
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export function useUserInfo() {
    const { email, nickname } = useContext(AuthContext);
    
    return {
        authorInitial: nickname?.[0] || email?.[0] || "U",
        authorName: nickname || email || "사용자",
        authorRole: "개발자", // 기본값으로 설정
    };
}
