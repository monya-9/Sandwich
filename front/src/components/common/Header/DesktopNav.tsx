import React, { useContext, useState, useMemo, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

import logo from "../../../assets/logo.png";
import { AuthContext } from "../../../context/AuthContext";

import SearchBar from "./SearchBar";
import ProfileCircle from "./ProfileCircle";
import ProfileDropdown from "./dropdowns/ProfileDropdown";
import MessageDropdown from "./dropdowns/MessageDropdown";
import NotificationDropdown from "./dropdowns/NotificationDropdown";
import MessageIcon from "./icons/MessageIcon";
import NotificationIcon from "./icons/NotificationIcon";

import type { Message } from "../../../types/Message";
import type { Notification } from "../../../types/Notification";
import { dummyMessages } from "../../../data/dummyMessages";
import { dummyNotifications } from "../../../data/dummyNotifications";

const DesktopNav: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const location = useLocation();
    const { isLoggedIn, email } = useContext(AuthContext);

    const safeEmail = useMemo(() => {
        if (!email) return "";
        const looksLikeJwt = email.split(".").length === 3 && email.length > 50;
        return looksLikeJwt ? "" : email;
    }, [email]);

    const displayName = useMemo(() => {
        const getItem = (k: string) =>
            (typeof window !== "undefined" &&
                (localStorage.getItem(k) || sessionStorage.getItem(k))) ||
            "";
        const nick = getItem("userNickname")?.trim();
        const user = getItem("userUsername")?.trim();
        if (nick) return nick;
        if (user) return user;
        if (safeEmail) return safeEmail.split("@")[0];
        return "사용자";
    }, [safeEmail]);

    // ▼ 드롭다운 토글
    const [showProfile, setShowProfile] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [showMessage, setShowMessage] = useState(false);

    // ▼ 데이터 상태(더미)
    const [notifications, setNotifications] = useState<Notification[]>(dummyNotifications);
    const [messages, setMessages] = useState<Message[]>(dummyMessages);

    const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;
    const unreadMessagesCount = messages.filter((m) => !m.isRead).length;

    const handleMarkAllNotiAsRead = () =>
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    // 드롭다운 닫기 이벤트 동기화
    useEffect(() => {
        const closeAll = () => {
            setShowMessage(false);
            setShowNotification(false);
            setShowProfile(false);
        };
        window.addEventListener("hide-dropdowns", closeAll);
        return () => window.removeEventListener("hide-dropdowns", closeAll);
    }, []);

    // 드롭다운에서 읽음 처리
    const markMessageRead = (id: number | string) => {
        setMessages((prev) =>
            prev.map((m) => (m.id === id ? { ...m, isRead: true, unreadCount: 0 } : m)),
        );
    };

    // NavLink 클래스
    const navCls = ({ isActive }: { isActive: boolean }) =>
        `text-black ${isActive ? "font-semibold" : "font-medium"}`;

    return (
        <div className="flex items-center justify-between w-full relative">
            {/* 왼쪽: 로고 + 네비게이션 */}
            <div className="flex items-center gap-3 min-w-0">
                <Link to="/" className="shrink-0">
                    <img src={logo} alt="Sandwich" className="w-[120px] h-auto" />
                </Link>

                {/* ✅ 커뮤니티 복구 */}
                <nav className="flex gap-6 text-[18px] ml-6">
                    <NavLink to="/" className={navCls} end>
                        둘러보기
                    </NavLink>
                    <NavLink to="/community" className={navCls}>
                        커뮤니티
                    </NavLink>
                </nav>
            </div>

            {/* 오른쪽: 검색 + 아이콘들 */}
            <div className="flex items-center gap-5 ml-auto relative">
                <SearchBar />

                {isLoggedIn ? (
                    <div className="flex items-center gap-5 relative">
                        {/* 메시지 */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setShowMessage((prev) => !prev);
                                    setShowNotification(false);
                                    setShowProfile(false);
                                }}
                                aria-haspopup="menu"
                                aria-expanded={showMessage}
                                aria-label="메시지 열기"
                            >
                                <MessageIcon hasNew={unreadMessagesCount > 0} />
                            </button>

                            {showMessage && (
                                <div className="absolute right-0 z-50">
                                    <MessageDropdown messages={messages} onRead={markMessageRead} />
                                </div>
                            )}
                        </div>

                        {/* 알림 */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setShowNotification((prev) => !prev);
                                    setShowMessage(false);
                                    setShowProfile(false);
                                }}
                                aria-haspopup="menu"
                                aria-expanded={showNotification}
                                aria-label="알림 열기"
                            >
                                <NotificationIcon hasNew={unreadNotificationsCount > 0} />
                            </button>

                            {showNotification && (
                                <div className="absolute right-0 z-50">
                                    <NotificationDropdown
                                        notifications={notifications}
                                        onMarkAllAsRead={handleMarkAllNotiAsRead}
                                    />
                                </div>
                            )}
                        </div>

                        {/* 프로필 */}
                        <div className="relative mb-1">
                            <button
                                onClick={() => {
                                    setShowProfile((prev) => !prev);
                                    setShowNotification(false);
                                    setShowMessage(false);
                                }}
                                aria-haspopup="menu"
                                aria-expanded={showProfile}
                                aria-label="프로필 열기"
                                className="flex items-center gap-2 max-w-[180px]"
                            >
                                <ProfileCircle email={safeEmail} size={32} />
                                {/* <span className="text-sm max-w-[120px] truncate">{displayName}</span> */}
                            </button>

                            {showProfile && (
                                <div className="absolute right-0 z-50">
                                    <ProfileDropdown email={safeEmail} username={displayName} onLogout={onLogout} />
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex gap-3 text-[14px] text-black">
                        <Link to="/login" className="hover:underline">
                            로그인
                        </Link>
                        <Link to="/join" className="hover:underline">
                            회원가입
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DesktopNav;
