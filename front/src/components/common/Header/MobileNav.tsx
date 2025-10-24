import React, { useContext, useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../../assets/logo.png";
import SearchBar from "./SearchBar";
import MessageIcon from "../Header/icons/MessageIcon";
import NotificationIcon from "../Header/icons/NotificationIcon";
import { AuthContext } from "../../../context/AuthContext";
import type { Message } from "../../../types/Message";
import { fetchRooms } from "../../../api/messages";
import { useNotificationStream } from "../../../hooks/useNotificationStream";
import { onMessagesRefresh } from "../../../lib/messageEvents";

interface Props {
    onOpenMenu: () => void;
    onLogout: () => void;
}

const MobileNav: React.FC<Props> = ({ onOpenMenu }) => {
    const { isLoggedIn } = useContext(AuthContext);
    const navigate = useNavigate();
    const [messages, setMessages] = useState<Message[]>([]);
    
    const myId = Number(
        localStorage.getItem("userId") || sessionStorage.getItem("userId") || "0"
    );
    
    const accessToken =
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken") ||
        "";
    
    const notiReady = isLoggedIn && !!accessToken;
    
    // 알림 스트림
    const noti = useNotificationStream({
        enabled: notiReady,
        userId: myId || 0,
        wsUrl: "/stomp",
        topicBase: "/topic/users",
        pageSize: 20,
        getToken: () =>
            localStorage.getItem("accessToken") ||
            sessionStorage.getItem("accessToken") ||
            null,
        resetOnDisable: false,
        debug: false,
        dropdownOpen: false,
    });
    
    const notiUnread = noti.unread;
    
    // 메시지 로드
    const loadMessages = useCallback(async () => {
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
        if (notiReady) loadMessages();
    }, [notiReady, loadMessages]);
    
    // 메시지 갱신 이벤트 리스너
    useEffect(() => onMessagesRefresh(loadMessages), [loadMessages]);
    
    const hasNewMessage = useMemo(() => {
        return messages.reduce((a, m) => a + (m.unreadCount ?? 0), 0) > 0;
    }, [messages]);
    
    const hasNewNotification = notiUnread > 0;

    return (
        <div className="flex items-center justify-between w-full md:hidden">
            {/* 왼쪽: 햄버거 메뉴 + 로고 */}
            <div className="flex items-center gap-4">
                <button onClick={onOpenMenu} className="block">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-8 h-8"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <Link to="/" className="flex-shrink-0">
                    <img src={logo} alt="Sandwich" className="w-[100px] h-auto" />
                </Link>
            </div>

            {/* 오른쪽: 검색, 메시지, 알림 아이콘 */}
            <div className="flex items-center gap-4 ml-auto">
                <SearchBar />
                {isLoggedIn ? (
                    <>
                        <MessageIcon 
                            hasNew={hasNewMessage} 
                            onClick={() => navigate('/messages')}
                            className="cursor-pointer"
                        />
                        <NotificationIcon 
                            hasNew={hasNewNotification} 
                            onClick={() => navigate('/notifications')}
                            className="cursor-pointer"
                        />
                    </>
                ) : (
                    <>
                        <MessageIcon hasNew={false} className="opacity-50" />
                        <NotificationIcon hasNew={false} className="opacity-50" />
                    </>
                )}
            </div>
        </div>
    );
};

export default MobileNav;
