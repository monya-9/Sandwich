// src/components/common/Header/DesktopNav.tsx
import React, { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import logo from '../../../assets/logo.png';
import { AuthContext } from '../../../context/AuthContext';

import SearchBar from './SearchBar';
import ProfileCircle from './ProfileCircle';
import ProfileDropdown from './dropdowns/ProfileDropdown';
import MessageDropdown from './dropdowns/MessageDropdown';
import NotificationDropdown from './dropdowns/NotificationDropdown';
import MessageIcon from './icons/MessageIcon';
import NotificationIcon from './icons/NotificationIcon';

import type { Message } from '../../../types/Message';
import type { Notification } from '../../../types/Notification';

// 더미 데이터 (한 곳에서만 관리)
import { dummyMessages } from '../../../data/dummyMessages';
import { dummyNotifications } from '../../../data/dummyNotifications';

interface Props {
    onLogout: () => void;
}

const DesktopNav: React.FC<Props> = ({ onLogout }) => {
    const location = useLocation();
    const { isLoggedIn } = useContext(AuthContext);

    const email = localStorage.getItem('userEmail') || '';

    // 드롭다운 토글
    const [showProfile, setShowProfile] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [showMessage, setShowMessage] = useState(false);

    // 상태: 더미로 초기화 (전체 데이터 노출)
    const [notifications, setNotifications] = useState<Notification[]>(dummyNotifications);
    const [messages] = useState<Message[]>(dummyMessages);

    // 읽지 않은 개수
    const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;
    const unreadMessagesCount = messages.filter(m => !m.isRead).length;

    // 모두 읽음
    const handleMarkAllNotiAsRead = () =>
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

    return (
        <div className="flex items-center justify-between w-full relative">
            {/* 왼쪽: 로고 + 네비게이션 */}
            <div className="flex items-center gap-3 min-w-0">
                <Link to="/" className="shrink-0">
                    <img src={logo} alt="Sandwich" className="w-[120px] h-auto" />
                </Link>

                <nav className="flex gap-6 text-[18px] ml-6">
                    <Link
                        to="/"
                        className={`text-black ${location.pathname === '/' ? 'font-semibold' : 'font-medium'}`}
                    >
                        둘러보기
                    </Link>
                    <Link
                        to="/community"
                        className={`text-black ${location.pathname === '/community' ? 'font-semibold' : 'font-medium'}`}
                    >
                        커뮤니티
                    </Link>
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
                                    setShowMessage(prev => !prev);
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
                                    {/* Dropdown 내부에서 max-h + overflow로 5개 이상일 때 스크롤 */}
                                    <MessageDropdown messages={messages} />
                                </div>
                            )}
                        </div>

                        {/* 알림 */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setShowNotification(prev => !prev);
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
                                    setShowProfile(prev => !prev);
                                    setShowNotification(false);
                                    setShowMessage(false);
                                }}
                                aria-haspopup="menu"
                                aria-expanded={showProfile}
                                aria-label="프로필 열기"
                            >
                                <ProfileCircle email={email} size={32} />
                            </button>

                            {showProfile && (
                                <ProfileDropdown
                                    email={email}
                                    username={email.split('@')[0]}
                                    onLogout={onLogout}
                                />
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