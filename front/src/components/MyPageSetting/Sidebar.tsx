import React from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar: React.FC = () => {
    const { pathname, search } = useLocation();
    const isProfile = pathname === "/mypage";
	const isCareer = pathname.startsWith("/mypage/career");
	const isNotifications = pathname.startsWith("/mypage/notifications");
	const isPush = pathname.startsWith("/mypage/push");

    const item = (
        label: string,
        to: string,
        active: boolean,
    ) => (
        <Link
            to={to}
            className={
                [
                    "flex items-center justify-between text-[16px] mb-2 px-2 py-2 rounded-lg",
                    // 데스크톱에서만 활성 글자 진하게, 모바일은 기본 두께 유지
                    active ? "lg:font-semibold" : "",
                    "hover:bg-[#F9FAFB] dark:hover:bg-white/5"
                ].join(" ")
            }
        >
            <span className="truncate">{label}</span>
            <span className="lg:hidden text-[#111827] text-[30px] leading-none ml-3">›</span>
        </Link>
    );

	return (
        <div className="bg-white dark:bg-[var(--surface)] border border-[#E5E7EB] dark:border-[var(--border-color)] rounded-xl p-4 sm:p-6">
            <div className="text-[#ADADAD] dark:text-white/40 text-[14px] sm:text-[16px] mb-3 sm:mb-4">내 정보</div>
            {item("프로필 설정", "/mypage?view=profile", isProfile)}
            {item("커리어 설정", "/mypage/career", isCareer)}
            <hr className="border-[#E5E7EB] dark:border-[var(--border-color)] my-4 sm:my-6" />
            <div className="text-[#ADADAD] dark:text-white/40 text-[14px] sm:text-[16px] mb-3 sm:mb-4">알림 설정</div>
            {item("이메일/SMS 알림", "/mypage/notifications", isNotifications)}
            {item("푸시 알림(APP)", "/mypage/push", isPush)}
        </div>
	);
};

export default Sidebar; 