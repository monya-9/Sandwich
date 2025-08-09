import React, { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../../../assets/logo.png';
import { AuthContext } from '../../../context/AuthContext';
import SearchBar from './SearchBar';
import ProfileCircle from './ProfileCircle';
import ProfileDropdown from './dropdowns/ProfileDropdown';
import MessageIcon from '../Header/icons/MessageIcon';
import NotificationIcon from '../Header/icons/NotificationIcon';
import MessageDropdown from './dropdowns/MessageDropdown';
import NotificationDropdown from './dropdowns/NotificationDropdown';
import { dummyNotifications } from '../../../data/dummyNotifications';
import { dummyMessages } from '../../../data/dummyMessages';
import type { Notification } from '../../../types/Notification';
import type { Message } from '../../../types/Message';

interface Props {
    onLogout: () => void;
}

const DesktopNav = ({ onLogout }: Props) => {
    const location = useLocation();
    const { isLoggedIn } = useContext(AuthContext);

    const email = localStorage.getItem('userEmail') || '';

    const [showProfile, setShowProfile] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [showMessage, setShowMessage] = useState(false);

    const [notifications, setNotifications] = useState<Notification[]>(dummyNotifications);
    const [messages] = useState<Message[]>(dummyMessages); // 메시지는 읽음 처리 안 하는 경우

    const unreadNotiCount = notifications.filter(n => !n.isRead).length;
    const unreadMessageCount = messages.filter(m => !m.isRead).length;

    const handleMarkAllNotificationsAsRead = () => {
        const updated = notifications.map(n => ({ ...n, isRead: true }));
        setNotifications(updated);
    };

    return (
        <div className="flex items-center justify-between w-full relative">
            {/* 왼쪽: 로고 + 네비 */}
            <div className="flex items-center gap-3">
                <Link to="/">
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

            {/* 오른쪽 */}
            <div className="flex items-center gap-5 ml-auto relative">
                <SearchBar />

                {isLoggedIn ? (
                    <div className="flex items-center gap-5 relative">
                        {/* 메시지 아이콘 */}
                        <div className="relative">
                            <button
                                className="relative"
                                onClick={() => {
                                    setShowMessage((prev) => !prev);
                                    setShowNotification(false);
                                    setShowProfile(false);
                                }}
                            >
                                <MessageIcon hasNew={unreadMessageCount > 0} />
                            </button>
                            {showMessage && (
                                <div className="absolute right-0 z-50">
                                    <MessageDropdown messages={messages} />
                                </div>
                            )}
                        </div>

                        {/* 알림 아이콘 */}
                        <div className="relative">
                            <button
                                className="relative"
                                onClick={() => {
                                    setShowNotification((prev) => !prev);
                                    setShowMessage(false);
                                    setShowProfile(false);
                                }}
                            >
                                <NotificationIcon hasNew={unreadNotiCount > 0} />
                            </button>
                            {showNotification && (
                                <div className="absolute right-0 z-50">
                                    <NotificationDropdown
                                        notifications={notifications}
                                        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
                                    />
                                </div>
                            )}
                        </div>

                        {/* 프로필 아이콘 */}
                        <div className="relative mb-1">
                            <button
                                onClick={() => {
                                    setShowProfile((prev) => !prev);
                                    setShowNotification(false);
                                    setShowMessage(false);
                                }}
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
                        <Link to="/login">로그인</Link>
                        <Link to="/join">회원가입</Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DesktopNav;
