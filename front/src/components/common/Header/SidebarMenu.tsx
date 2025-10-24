import React, { useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import ProfileCircle from "./ProfileCircle";
import logo from "../../../assets/logo.png";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => void;
}

function isAdminFromStoredToken(): boolean {
    try {
        const token =
            (typeof window !== 'undefined' && (localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken'))) || '';
        if (!token) return false;
        const parts = token.split('.');
        if (parts.length !== 3) return false;
        const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const json = typeof window !== 'undefined' ? atob(b64) : Buffer.from(b64, 'base64').toString('utf-8');
        const payload = JSON.parse(decodeURIComponent(Array.prototype.map.call(json, (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
        const candidates = [payload.roles, payload.authorities, payload.auth, payload.scope, payload.scopes, payload.role];
        const toStr = (v: any) => (typeof v === 'string' ? v : Array.isArray(v) ? v.join(' ') : '');
        const txt = toStr(candidates.find(Boolean)).toUpperCase();
        return txt.includes('ROLE_ADMIN') || txt.split(/[ ,]/).includes('ADMIN');
    } catch {
        return false;
    }
}

const SidebarMenu = ({ isOpen, onClose, onLogout }: Props) => {
    const { isLoggedIn, email } = useContext(AuthContext);
    const isAdmin = isAdminFromStoredToken();

    // ✅ 안전한 이메일 (JWT 혼입 방지)
    const safeEmail = useMemo(() => {
        if (!email) return "";
        const looksLikeJwt = email.split(".").length === 3 && email.length > 50;
        return looksLikeJwt ? "" : email;
    }, [email]);

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
    }, [safeEmail]);

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
                        <img src={logo} alt="Sandwich" className="w-[80px] mb-5 mt-4" />
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
