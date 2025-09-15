import React from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar: React.FC = () => {
	const { pathname } = useLocation();
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
				`block text-[16px] mb-4 ` + (active ? "font-medium underline" : "")
			}
		>
			{label}
		</Link>
	);

	return (
		<div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
			<div className="text-[#ADADAD] text-[16px] mb-4">내 정보</div>
			{item("프로필 설정", "/mypage", isProfile)}
			{item("커리어 설정", "/mypage/career", isCareer)}
			<hr className="border-[#E5E7EB] my-6" />
			<div className="text-[#ADADAD] text-[16px] mb-4">알림 설정</div>
			{item("이메일/SMS 알림", "/mypage/notifications", isNotifications)}
			{item("푸시 알림(APP)", "/mypage/push", isPush)}
		</div>
	);
};

export default Sidebar; 