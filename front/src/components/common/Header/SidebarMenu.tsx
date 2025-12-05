import React, { useContext, useMemo, useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import ProfileCircle from "./ProfileCircle";
import { getStaticUrl } from "../../../config/staticBase";
import { MdComputer, MdLightMode, MdDarkMode } from "react-icons/md";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => void;
}

// ✅ httpOnly 쿠키 기반: JWT 디코딩 대신 서버 API로 권한 확인
// (deprecated - 이제 useEffect에서 비동기로 확인)

type ThemeMode = "system" | "light" | "dark";

const SidebarMenu = ({ isOpen, onClose, onLogout }: Props) => {
    const { isLoggedIn, email } = useContext(AuthContext);
    const [isAdmin, setIsAdmin] = React.useState(false);
    
    // ✅ httpOnly 쿠키 기반: 서버 API로 관리자 권한 확인
    React.useEffect(() => {
        if (isLoggedIn) {
            import('../../../utils/authz').then(({ isAdmin: checkAdmin }) => {
                checkAdmin().then(setIsAdmin).catch(() => setIsAdmin(false));
            }).catch(() => setIsAdmin(false));
        } else {
            setIsAdmin(false);
        }
    }, [isLoggedIn]);

    // ✅ 안전한 이메일 (JWT 혼입 방지)
    const safeEmail = useMemo(() => {
        if (!email) return "";
        const looksLikeJwt = email.split(".").length === 3 && email.length > 50;
        return looksLikeJwt ? "" : email;
    }, [email]);

    // 닉네임 변경 감지를 위한 상태
    const [nicknameUpdateTrigger, setNicknameUpdateTrigger] = useState(0);

    // ✅ 통일된 표시 이름: nickname > username > email 로컬파트 > "사용자"
    const displayName = useMemo(() => {
        const getItem = (k: string) =>
            (typeof window !== "undefined" &&
                (localStorage.getItem(k) || sessionStorage.getItem(k))) || "";

        const nick = getItem("userNickname").trim();
        // 계정별 스코프 username 우선
        const userEmail = getItem("userEmail");
        const scopedKey = userEmail ? `userUsername:${userEmail}` : "userUsername";
        const user = (getItem(scopedKey) || "").trim() || getItem("userUsername").trim();

        if (nick) return nick;
        if (user) return user;
        if (safeEmail) return safeEmail.split("@")[0];
        return "사용자";
    }, [safeEmail, nicknameUpdateTrigger]);

    // 테마 토글 상태
    const initialMode: ThemeMode = useMemo(() => {
        if (typeof window === "undefined") return "system";
        let saved = "";
        try {
            saved = (localStorage.getItem("theme") || "").toLowerCase();
        } catch {
            saved = "";
        }
        return saved === "dark" || saved === "light" ? (saved as ThemeMode) : "system";
    }, []);
    const [mode, setMode] = useState<ThemeMode>(initialMode);

    const resolveAndApply = useCallback((m: ThemeMode) => {
        if (typeof window === "undefined") return;
        const prefersDark =
            typeof window.matchMedia === "function"
                ? window.matchMedia("(prefers-color-scheme: dark)").matches
                : false;
        const isDark = m === "dark" ? true : m === "light" ? false : prefersDark;
        if (typeof document !== "undefined") {
            document.documentElement.classList.toggle("dark", isDark);
        }
        try {
            localStorage.setItem("theme", m);
        } catch {}
        setMode(m);
    }, []);

    const btnCls = (m: ThemeMode) =>
        [
            "h-8 w-8 flex items-center justify-center rounded-full transition-colors text-lg",
            mode === m
                ? "bg-green-500 text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
        ].join(" ");

    // 닉네임 변경 이벤트 리스너
    useEffect(() => {
        const handleNicknameUpdate = () => {
            setNicknameUpdateTrigger(prev => prev + 1);
        };

        window.addEventListener('user-nickname-updated', handleNicknameUpdate);
        return () => {
            window.removeEventListener('user-nickname-updated', handleNicknameUpdate);
        };
    }, []);

    return (
        <div
            className={`fixed inset-0 z-50 transition-all duration-300 ease-in-out ${
                isOpen
                    ? "bg-black/50 opacity-100 pointer-events-auto"
                    : "bg-black/0 opacity-0 pointer-events-none"
            }`}
            onClick={onClose}
        >
            <div
                className={`absolute left-0 top-0 h-full w-3/4 sm:w-1/2 bg-white shadow-lg p-6 flex flex-col transform transition-transform duration-300 ease-in-out ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                {isLoggedIn ? (
                    // 로그인 상태
                    <div className="mb-6 flex flex-col items-start gap-3">
                        <ProfileCircle email={safeEmail} name={displayName} size={56} />
                        <div className="flex flex-col">
                            <span className="font-semibold text-lg">{displayName}</span>
                            <span className="text-gray-500 text-sm">{safeEmail}</span>
                        </div>
                    </div>
                ) : (
                    // 비로그인 상태
                    <div className="mb-6 flex flex-col items-start w-full px-1">
                        <img src={getStaticUrl("assets/logo.png")} alt="Sandwich" className="w-[80px] mb-5 mt-4" />
                        <p className="text-gray-600 text-sm mb-6 leading-5">
                            회원가입 또는 로그인을 통해
                            <br />
                            샌드위치 프로젝트를 시작해보세요!
                        </p>
                        <Link
                            to="/join"
                            onClick={onClose}
                            className="w-full py-2 bg-green-500 text-white rounded-full text-center font-medium text-sm mb-3"
                        >
                            회원가입
                        </Link>
                        <Link
                            to="/login"
                            onClick={onClose}
                            className="w-full py-2 border border-gray-300 rounded-full text-center font-medium text-sm"
                        >
                            로그인
                        </Link>
                    </div>
                )}

                <nav className="flex flex-col gap-4">
                    <Link to="/" onClick={onClose} className="text-base font-medium">
                        둘러보기
                    </Link>
                    <Link to="/challenge" onClick={onClose} className="text-base font-medium">
                        챌린지
                    </Link>
                    
                    <hr className="my-2" />

                    {isLoggedIn && (
                        <>
                            <Link to="/profile" onClick={onClose} className="text-base font-medium">
                                나의 포트폴리오
                            </Link>
                            <Link to="/mypage" onClick={onClose} className="text-base font-medium">
                                마이페이지
                            </Link>
                            <div className="mt-1">
                                <div className="text-sm text-gray-900 dark:text-white mb-2">테마</div>
                                <div className="flex items-center gap-1 rounded-full border border-gray-300 dark:border-white/20 p-1 w-fit">
                                    <button
                                        type="button"
                                        aria-label="System theme"
                                        className={btnCls("system")}
                                        onClick={() => resolveAndApply("system")}
                                    >
                                        <MdComputer size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        aria-label="Light theme"
                                        className={btnCls("light")}
                                        onClick={() => resolveAndApply("light")}
                                    >
                                        <MdLightMode size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        aria-label="Dark theme"
                                        className={btnCls("dark")}
                                        onClick={() => resolveAndApply("dark")}
                                    >
                                        <MdDarkMode size={16} />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {isAdmin && (
                        <>
                            <Link to="/admin/security/otp" onClick={onClose} className="text-base font-medium">
                                보안 ▸ OTP 이력
                            </Link>
                            <Link to="/admin/security/devices" onClick={onClose} className="text-base font-medium">
                                보안 ▸ 사용자 관리
                            </Link>
                        </>
                    )}
                </nav>

                {isLoggedIn && (
                    <div className="mt-auto">
                        <button onClick={onLogout} className="text-red-500 text-sm mt-6">
                            로그아웃
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SidebarMenu;
