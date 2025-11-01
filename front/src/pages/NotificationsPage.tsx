// src/pages/NotificationsPage.tsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useNotificationStream } from "../hooks/useNotificationStream";
import { toRelativeTime } from "../utils/time";
import type { NotifyItem } from "../types/Notification";

const NotificationsPage: React.FC = () => {
    const navigate = useNavigate();
    const [initialized, setInitialized] = useState(false);

    const myId = Number(
        localStorage.getItem("userId") || sessionStorage.getItem("userId") || "0"
    );

    const accessToken =
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken") ||
        "";

    const notiReady = !!accessToken && myId > 0;

    // 알림 스트림
    const noti = useNotificationStream({
        enabled: notiReady,
        userId: myId || 0,
        wsUrl: "/stomp",
        topicBase: "/topic/users",
        pageSize: 30,
        getToken: () =>
            localStorage.getItem("accessToken") ||
            sessionStorage.getItem("accessToken") ||
            null,
        resetOnDisable: false,
        debug: false,
        dropdownOpen: true, // 페이지가 열려있으므로 true
    });

    useEffect(() => {
        if (noti.initialized && !initialized) {
            setInitialized(true);
        }
    }, [noti.initialized, initialized]);

    const items = useMemo(() => noti.items as NotifyItem[], [noti.items]);

    // 스켈레톤 로딩
    if (!initialized || noti.loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-black">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
                    {/* 헤더 */}
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={() => navigate("/")}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
                            aria-label="뒤로가기"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">알림</h1>
                    </div>

                    {/* 스켈레톤 */}
                    <div className="bg-white dark:bg-[var(--surface)] rounded-lg border dark:border-[var(--border-color)] divide-y divide-gray-200 dark:divide-[var(--border-color)]">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="p-4 sm:p-6 animate-pulse">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10" />
                                    <div className="flex-1 min-w-0">
                                        <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-3/4 mb-2" />
                                        <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-full mb-1" />
                                        <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-2/3" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate("/")}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
                            aria-label="뒤로가기"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">알림</h1>
                        {noti.unread > 0 && (
                            <span className="px-2 py-1 bg-green-600 text-white text-xs sm:text-sm rounded-full">
                                {noti.unread}개
                            </span>
                        )}
                    </div>
                    {items.length > 0 && noti.unread > 0 && (
                        <button
                            onClick={() => noti.markAll()}
                            className="text-xs sm:text-sm text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400 font-medium"
                        >
                            모두 읽음
                        </button>
                    )}
                </div>

                {/* 알림 목록 */}
                {items.length === 0 ? (
                    <div className="bg-white dark:bg-[var(--surface)] rounded-lg border dark:border-[var(--border-color)] p-12 text-center">
                        <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-white/20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <p className="text-gray-500 dark:text-white/60 text-sm sm:text-base">새로운 알림이 없습니다</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-[var(--surface)] rounded-lg border dark:border-[var(--border-color)] divide-y divide-gray-200 dark:divide-[var(--border-color)]">
                        {items.map((n) => {
                            const actorName = n.extra?.actorName;
                            const profileUrl = n.thumbnail || n.extra?.profileImageUrl || null;

                            const unknown =
                                !actorName || actorName === "누군가" || /^\d+$/.test(actorName);

                            const initialSource =
                                n.extra?.actorEmail?.split("@")?.[0] ||
                                actorName ||
                                n.title;
                            const initial = (initialSource?.[0] || "?").toUpperCase();

                            return (
                                <button
                                    key={String(n.id)}
                                    onClick={() => {
                                        noti.markOneRead(n.id);
                                        if (n.deepLink) {
                                            navigate(n.deepLink);
                                        }
                                    }}
                                    className={`w-full text-left p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors relative ${
                                        !n.read ? "bg-green-50/50 dark:bg-green-900/10" : ""
                                    }`}
                                >
                                    {/* 읽지 않음 표시 */}
                                    {!n.read && (
                                        <div className="absolute inset-0 bg-green-500/5 dark:bg-green-500/10 pointer-events-none rounded-lg" />
                                    )}

                                    <div className="relative z-[1] flex items-start gap-3">
                                        {/* 아바타 */}
                                        {!unknown && (
                                            profileUrl ? (
                                                <img
                                                    src={profileUrl}
                                                    alt=""
                                                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full shrink-0 object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center shrink-0 text-sm sm:text-base font-medium">
                                                    {initial}
                                                </div>
                                            )
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base mb-1">
                                                {n.title}
                                            </p>
                                            {n.body && (
                                                <p className="text-gray-600 dark:text-white/70 text-xs sm:text-sm mb-2 line-clamp-2">
                                                    {n.body}
                                                </p>
                                            )}
                                            <span className="text-gray-400 dark:text-white/50 text-xs">
                                                {toRelativeTime(n.createdAt)}
                                            </span>
                                        </div>

                                        {/* 읽지 않음 점 */}
                                        {!n.read && (
                                            <div className="w-2 h-2 bg-green-600 rounded-full flex-shrink-0 mt-2" />
                                        )}
                                    </div>
                                </button>
                            );
                        })}

                        {/* 더 보기 */}
                        {noti.hasMore && (
                            <button
                                onClick={() => noti.loadMore()}
                                disabled={noti.loading}
                                className="w-full py-4 text-sm text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 transition-colors"
                            >
                                {noti.loading ? "불러오는 중..." : "더 보기"}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;

