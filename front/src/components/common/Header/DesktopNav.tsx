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
import { fetchRooms } from "../../../api/messages";
import { onMessagesRefresh } from "../../../lib/messageEvents";

// 알림 API 아직 없으면 임시 더미 유지
import { dummyNotifications } from "../../../data/dummyNotifications";

const DesktopNav: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const location = useLocation();
    const { isLoggedIn, email } = useContext(AuthContext);

    const safeEmail = useMemo(() => {
        if (!email) return "";
        const looksLikeJwt = email.split(".").length === 3 && email.length > 50;
        return looksLikeJwt ? "" : email;
    }, [email]);

    // 닉네임 변경 이벤트 수신용 리비전
    const [nickRevision, setNickRevision] = useState(0);
    useEffect(() => {
        const onNickUpdate = () => setNickRevision((v) => v + 1);
        window.addEventListener("user-nickname-updated", onNickUpdate as any);
        return () => window.removeEventListener("user-nickname-updated", onNickUpdate as any);
    }, []);

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
    }, [safeEmail, nickRevision]);

    // ▼ 드롭다운 토글
    const [showProfile, setShowProfile] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [showMessage, setShowMessage] = useState(false);

    // ▼ 데이터 상태
    const [notifications, setNotifications] = useState<Notification[]>(dummyNotifications);
    const [messages, setMessages] = useState<Message[]>([]);

    const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;
    const unreadMessagesCount = messages.filter((m) => !m.isRead && (m.unreadCount ?? 0) > 0).length
        || messages.reduce((acc, m) => acc + (m.unreadCount ?? 0), 0);

    const handleMarkAllNotiAsRead = () =>
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    // 헤더 메시지 로더(최신 5개)
    const loadHeaderMessages = React.useCallback(async () => {
        try {
            const rooms = await fetchRooms(0, 5);
            const mapped: Message[] = rooms.map((r) => ({
                id: r.roomId,
                roomId: r.roomId,
                title: r.peerName,
                sender: r.peerName,
                content: r.lastContent,
                createdAt: r.lastAt,
                isRead: r.unreadCount === 0,
                unreadCount: r.unreadCount,
            }));
            setMessages(mapped);
        } catch {
            setMessages([]);
        }
    }, []);

    useEffect(() => { loadHeaderMessages(); }, [loadHeaderMessages]);
    useEffect(() => onMessagesRefresh(loadHeaderMessages), [loadHeaderMessages]);

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

    const navCls = ({ isActive }: { isActive: boolean }) =>
        `text-black ${isActive ? "font-semibold" : "font-medium"}`;

    return (
        <div className="flex items-center justify-between w-full relative">
            {/* 왼쪽: 로고 + 네비게이션 */}
            <div className="flex items-center gap-3 min-w-0">
                <Link to="/" className="shrink-0">
                    <img src={logo} alt="Sandwich" className="w-[120px] h-auto" />
                </Link>

                <nav className="flex gap-6 text-[18px] ml-6">
                    <NavLink to="/" className={navCls} end>둘러보기</NavLink>
                    <NavLink to="/community" className={navCls}>커뮤니티</NavLink>
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
                                    if (!showMessage) loadHeaderMessages(); // 열 때 갱신
                                }}
                                aria-haspopup="menu"
                                aria-expanded={showMessage}
                                aria-label="메시지 열기"
                            >
                                <MessageIcon hasNew={(messages.reduce((a,m)=>a+(m.unreadCount??0),0)) > 0} />
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
                        <Link to="/login" className="hover:underline">로그인</Link>
                        <Link to="/join" className="hover:underline">회원가입</Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DesktopNav;
