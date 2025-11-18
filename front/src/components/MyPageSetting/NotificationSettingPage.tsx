// TODO: 이메일/SMS 알림 기능이 아직 개발되지 않아 임시로 비활성화되었습니다.
// 백엔드 API 개발 완료 후 App.tsx와 Sidebar.tsx의 주석을 해제해주세요.

import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { useNavigate } from "react-router-dom";
import { NotificationPrefsApi } from "../../api/notificationPrefsApi";

// 공통 토글 색상 (청록)
const ACTIVE_COLOR = "#22C55E";

// 간단한 스위치 컴포넌트
const ToggleSwitch: React.FC<{
	checked: boolean;
	onChange?: (v: boolean) => void;
	disabled?: boolean;
	ariaLabel?: string;
}> = ({ checked, onChange, disabled, ariaLabel }) => {
	return (
		<button
			type="button"
			aria-label={ariaLabel}
			disabled={disabled}
			className={[
				"relative inline-flex h-[22px] w-[40px] items-center rounded-full transition-colors duration-150",
				checked ? "" : "",
				disabled ? "opacity-60 cursor-not-allowed" : "",
			].join(" ")}
			style={{ backgroundColor: checked ? ACTIVE_COLOR : "#E5E7EB" }}
			onClick={() => !disabled && onChange && onChange(!checked)}
		>
			<span
				className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white transition-transform duration-150 shadow ${checked ? "translate-x-[18px]" : "translate-x-[2px]"}`}
			/>
		</button>
	);
};

export type NotificationPrefs = {
	accountActivity: boolean; // 커뮤니티 멘션 → emailComment
	workStats: boolean; // 작업/업로드 → emailWorkDigest
	messageGeneral: boolean; // 일반 메시지 → emailMessage
	messageProjectOffer: boolean; // 끄기 불가 (서버 측 정책이면 emailMessage로만 운영, 유지)
	messageHiringOffer: boolean; // 끄기 불가
	eventNewsletter: boolean; // 이벤트 → emailEvent
};

const defaultPrefs: NotificationPrefs = {
	accountActivity: false,
	workStats: false,
	messageGeneral: false,
	messageProjectOffer: true,
	messageHiringOffer: true,
	eventNewsletter: false,
};

const Row: React.FC<{
	title: string;
	desc?: string;
	value: boolean;
	onChange?: (v: boolean) => void;
	disabled?: boolean;
}> = ({ title, desc, value, onChange, disabled }) => {
    const titleClass = `text-[14px] ${disabled ? "text-[#9CA3AF]" : "text-[#111827] dark:text-white"}`;
    const descClass = `text-[14px] mt-1 leading-relaxed ${disabled ? "text-[#9CA3AF]" : "text-[#6B7280] dark:text-white/60"}`;
	return (
		<div className="flex items-start justify-between py-4">
			<div>
				<div className={titleClass}>{title}</div>
				{desc ? <p className={descClass}>{desc}</p> : null}
			</div>
			<div className="ml-4 mt-1">
				<ToggleSwitch checked={value} onChange={onChange} disabled={disabled} />
			</div>
		</div>
	);
};

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="bg-white dark:bg-[var(--surface)] border border-[#E5E7EB] dark:border-[var(--border-color)] rounded-xl p-6 box-border">
        <div className="text-[16px] font-medium text-[#111827] dark:text-white mb-2">{title}</div>
        <hr className="border-[#E5E7EB] dark:border-[var(--border-color)] mb-2" />
		<div>
			{children}
		</div>
	</section>
);

const NotificationSettingPage: React.FC = () => {
    const navigate = useNavigate();
	const [prefs, setPrefs] = useState<NotificationPrefs>(defaultPrefs);
	const [loading, setLoading] = useState<boolean>(true);
	const [saving, setSaving] = useState<boolean>(false);

	// 서버에서 불러오기
	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const d = await NotificationPrefsApi.getMy();
				if (!mounted) return;
				setPrefs({
					accountActivity: d.emailComment,
					workStats: d.emailWorkDigest,
					messageGeneral: d.emailMessage,
					messageProjectOffer: true,
					messageHiringOffer: true,
					eventNewsletter: d.emailEvent,
				});
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, []);

	const save = async (partial: Partial<NotificationPrefs>) => {
		setPrefs(prev => ({ ...prev, ...partial }));
		setSaving(true);
		try {
			const next = { ...prefs, ...partial };
			await NotificationPrefsApi.updateMy({
				emailComment: next.accountActivity,
				emailWorkDigest: next.workStats,
				emailMessage: next.messageGeneral,
				emailEvent: next.eventNewsletter,
			});
		} finally {
			setSaving(false);
		}
	};

	const setField = (key: keyof NotificationPrefs) => (v: boolean) => save({ [key]: v } as any);

    return (
        <div className="min-h-screen font-gmarket pt-5 bg-[#F5F7FA] dark:bg-[var(--bg)] text-black dark:text-white">
			<div className="mx-auto max-w-[1400px] px-4 md:px-6">
				<div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
					{/* 좌측 사이드바 */}
					<aside className="hidden lg:block w-full lg:w-[320px] shrink-0">
						<Sidebar />
					</aside>

					{/* 우측 콘텐츠 */}
					<main className="flex-1 space-y-0">
						{/* 모바일 상단 헤더: 좌측 고정 ‹, 중앙 제목 정렬 */}
						<div className="lg:hidden grid grid-cols-[40px_1fr_40px] items-center mb-3">
							<button type="button" aria-label="뒤로가기" onClick={() => navigate("/mypage")} className="justify-self-start px-2 py-1 -ml-2 text-[30px] leading-none text-[#111827]">‹</button>
							<div className="justify-self-center text-[16px] font-medium text-center">이메일/SMS 알림</div>
							<span />
						</div>
						<div className="space-y-6">
						<Card title="계정 활동 알림">
							<Row
								title="커뮤니티 댓글 멘션"
								desc="커뮤니티에서 다른 사람이 나를 멘션했을 때 알림을 받겠습니다."
								value={prefs.accountActivity}
								onChange={setField("accountActivity")}
							/>
						</Card>

						<Card title="작업 통계 알림">
							<Row
								title="작업/업로드"
								desc="내 작업 조회수, 좋아요, 컬렉션, 업로드 수가 특정 지점에 도달할 때 알림을 받겠습니다."
								value={prefs.workStats}
								onChange={setField("workStats")}
							/>
						</Card>

						<Card title="메시지 알림">
							<Row
								title="프로젝트/프리랜서 제안(알림 끄기 불가능)"
								desc="새로운 프로젝트/프리랜서 제안 메시지가 왔을 때 알림을 받겠습니다."
								value={true}
								disabled
							/>
							<hr className="border-[#F2F4F7]" />
							<Row
								title="채용 제안(알림 끄기 불가능)"
								desc="새로운 채용 제안 메시지가 왔을 때 알림을 받겠습니다."
								value={true}
								disabled
							/>
							<hr className="border-[#F2F4F7]" />
							<Row
								title="일반 메시지"
								desc="새로운 일반 메시지가 왔을 때 알림을 받겠습니다."
								value={prefs.messageGeneral}
								onChange={setField("messageGeneral")}
							/>
						</Card>

						<Card title="이벤트 알림">
							<Row
								title="이벤트 혜택/정보"
								desc="창작자와 디자이너에게 도움이 되는 다양한 소식과 혜택 정보를 받겠습니다."
								value={prefs.eventNewsletter}
								onChange={setField("eventNewsletter")}
							/>
						</Card>
						</div>
					</main>
				</div>
			</div>
		</div>
	);
};

export default NotificationSettingPage; 