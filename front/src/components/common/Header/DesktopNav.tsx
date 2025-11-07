// src/components/common/Header/DesktopNav.tsx
import React, { useContext, useState, useMemo, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

import { getStaticUrl } from "../../../config/staticBase";
import { AuthContext } from "../../../context/AuthContext";

import SearchBar from "./SearchBar";
import ProfileCircle from "./ProfileCircle";
import ProfileDropdown from "./dropdowns/ProfileDropdown";
import MessageDropdown from "./dropdowns/MessageDropdown";
import NotificationDropdown from "./dropdowns/NotificationDropdown";
import MessageIcon from "./icons/MessageIcon";
import NotificationIcon from "./icons/NotificationIcon";

import type { Message } from "../../../types/Message";
import type { NotifyItem } from "../../../types/Notification";
import { fetchRooms } from "../../../api/messages";
import { onMessagesRefresh } from "../../../lib/messageEvents";
import { useNotificationStream } from "../../../hooks/useNotificationStream";

// (옵션) 더미 확인용
// import { dummyNotifications } from "../../../data/dummyNotifications";
// const USE_DUMMY_NOTI = true;

const USE_DUMMY_NOTI = false;

const DesktopNav: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const { isLoggedIn, email } = useContext(AuthContext);
    const location = useLocation();
    
    // 검색 페이지인지 확인
    const isSearchPage = location.pathname === '/search';

    const safeEmail = useMemo(() => {
        if (!email) return "";
        const looksLikeJwt = email.split(".").length === 3 && email.length > 50;
        return looksLikeJwt ? "" : email;
    }, [email]);

    // 닉네임 변경 감지를 위한 상태
    const [nicknameUpdateTrigger, setNicknameUpdateTrigger] = useState(0);

    const displayName = useMemo(() => {
        const getItem = (k: string) =>
            (typeof window !== "undefined" &&
                (localStorage.getItem(k) || sessionStorage.getItem(k))) || "";
        const nick = getItem("userNickname")?.trim();
        // 계정별 스코프 username 우선
        const userEmail = getItem("userEmail");
        const scopedKey = userEmail ? `userUsername:${userEmail}` : "userUsername";
        const user = getItem(scopedKey)?.trim() || getItem("userUsername")?.trim();
        if (nick) return nick;
        if (user) return user;
        if (safeEmail) return safeEmail.split("@")[0];
        return "사용자";
    }, [safeEmail, nicknameUpdateTrigger]);

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

    const myId = Number(
        localStorage.getItem("userId") || "0"
    );

    // ✅ httpOnly 쿠키 기반: 버튼/드롭다운 표시 여부(로그인만 체크)
    const notiReady = isLoggedIn;
    // WS 연결은 useNotificationStream 훅 내부에서 처리됨 (쿠키로 인증)

    // ▼ 드롭다운 토글
    const [showProfile, setShowProfile] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [showMessage, setShowMessage] = useState(false);

    // ▼ 메시지 상단 5개
    const [messages, setMessages] = useState<Message[]>([]);
    const loadHeaderMessages = React.useCallback(async () => {
        if (!notiReady) {
            setMessages([]);
            return;
        }
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
    }, [notiReady]);

    useEffect(() => {
        if (notiReady) loadHeaderMessages();
    }, [notiReady, loadHeaderMessages]);

    useEffect(() => onMessagesRefresh(loadHeaderMessages), [loadHeaderMessages]);

    const markMessageRead = (id: number | string) => {
        setMessages((prev) =>
            prev.map((m) => (m.id === id ? { ...m, isRead: true, unreadCount: 0 } : m))
        );
    };

    // ▼ 알림 스트림(WS + API)
    const noti = useNotificationStream({
        enabled: notiReady,// ★ 항상 연결 유지 (실시간 알림 수신 보장)
        userId: myId || 0,
        wsUrl: "/stomp",
        topicBase: "/topic/users",
        pageSize: 20,
        // ✅ httpOnly 쿠키 기반: getToken 불필요 (쿠키로 자동 인증)
        getToken: () => null,
        resetOnDisable: false,
        debug: false,
        dropdownOpen: showNotification, // ★ 드롭다운 열림 상태 전달
    });

    // 드롭다운 열릴 때 첫 페이지 로드 (훅 내부에서 자동 처리됨)

    // 드롭다운 데이터 원천
    const notiItems: NotifyItem[] = USE_DUMMY_NOTI
        ? [] // dummyNotifications
        : (noti.items as NotifyItem[]);
    const notiUnread = USE_DUMMY_NOTI
        ? 0 // dummyNotifications.filter((x) => !x.read).length
        : noti.unread;

    const navCls = ({ isActive }: { isActive: boolean }) =>
        `text-black dark:text-gray-100 ${isActive ? "font-semibold" : "font-medium"}`;

    return (
        <div className="flex items-center justify-between w-full relative">
            <div className="flex items-center gap-3 min-w-0">
                <Link to="/" className="shrink-0">
                    <img src={getStaticUrl("assets/logo.png")} alt="Sandwich" className="w-[120px] h-auto" />
                </Link>
                <nav className="flex gap-6 text-[18px] ml-6">
                    <NavLink to="/" className={navCls} end>둘러보기</NavLink>
                    <NavLink to="/challenge" className={navCls}>챌린지</NavLink>
                </nav>
            </div>

            <div className="flex items-center gap-5 ml-auto relative">
                {!isSearchPage && <SearchBar />}

                {isLoggedIn ? (
                    <div className="flex items-center gap-5 relative">
                        {/* 메시지 */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setShowMessage((prev) => !prev);
                                    setShowNotification(false);
                                    setShowProfile(false);
                                    if (!showMessage) void loadHeaderMessages();
                                }}
                                aria-haspopup="menu"
                                aria-expanded={showMessage}
                                aria-label="메시지 열기"
                            >
                                <MessageIcon
                                    hasNew={
                                        messages.reduce((a, m) => a + (m.unreadCount ?? 0), 0) > 0
                                    }
                                />
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
                                disabled={!notiReady && !USE_DUMMY_NOTI}
                            >
                                <NotificationIcon hasNew={notiUnread > 0} />
                            </button>

                            {showNotification && (
                                <div className="absolute right-0 z-50">
                                    <NotificationDropdown
                                        items={notiItems}
                                        unreadCount={notiUnread}
                                        initializing={!noti.initialized}
                                        loading={noti.loading}
                                        onMarkAllAsRead={() => { if (!USE_DUMMY_NOTI) void noti.markAll(); }}
                                        onClickItem={(id) => { if (!USE_DUMMY_NOTI) void noti.markOneRead(id); }}
                                        hasMore={!USE_DUMMY_NOTI && noti.hasMore}
                                        onLoadMore={() => { if (!USE_DUMMY_NOTI) void noti.loadMore(); }}
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
                    <div className="flex gap-3 text-[14px] text-black dark:text-gray-100">
                        <Link to="/login" className="hover:underline">로그인</Link>
                        <Link to="/join" className="hover:underline">회원가입</Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DesktopNav;
