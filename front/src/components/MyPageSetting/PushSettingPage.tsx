import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { NotificationPrefsApi } from "../../api/notificationPrefsApi";

const ACTIVE_COLOR = "#22C55E";

const ToggleSwitch: React.FC<{ checked: boolean; onChange?: (v: boolean) => void; disabled?: boolean }> = ({ checked, onChange, disabled }) => (
	<button
		type="button"
		disabled={disabled}
		className={["relative inline-flex h-[22px] w-[40px] items-center rounded-full transition-colors duration-150", disabled ? "opacity-60 cursor-not-allowed" : ""].join(" ")}
		style={{ backgroundColor: checked ? ACTIVE_COLOR : "#E5E7EB" }}
		onClick={() => !disabled && onChange && onChange(!checked)}
	>
		<span className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white transition-transform duration-150 shadow ${checked ? "translate-x-[18px]" : "translate-x-[2px]"}`} />
	</button>
);

// 페이지 상태(프론트 표현)
type PushPrefs = {
	like: boolean;
	collection: boolean;
	follow: boolean;
	workComment: boolean;
	communityComment: boolean;
	workStats: boolean;
	messageGeneral: boolean;
	messageProjectOffer: boolean; // 끄기 불가
	messageHiringOffer: boolean; // 끄기 불가
	eventNewsletter: boolean;
};

const defaults: PushPrefs = {
	like: false,
	collection: false,
	follow: false,
	workComment: false,
	communityComment: false,
	workStats: false,
	messageGeneral: false,
	messageProjectOffer: true,
	messageHiringOffer: true,
	eventNewsletter: false,
};

const Row: React.FC<{ title: string; desc?: string; value: boolean; onChange?: (v: boolean) => void; disabled?: boolean }> = ({ title, desc, value, onChange, disabled }) => (
	<div className="flex items-start justify-between py-4">
		<div>
			<div className={`text-[14px] ${disabled ? "text-[#9CA3AF]" : "text-[#111827]"}`}>{title}</div>
			{desc ? <p className={`text-[14px] mt-1 leading-relaxed ${disabled ? "text-[#9CA3AF]" : "text-[#6B7280]"}`}>{desc}</p> : null}
		</div>
		<div className="ml-4 mt-1">
			<ToggleSwitch checked={value} onChange={onChange} disabled={disabled} />
		</div>
	</div>
);

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
	<section className="bg-white border border-[#E5E7EB] rounded-xl p-6 box-border">
		<div className="text-[16px] font-medium text-[#111827] mb-2">{title}</div>
		<hr className="border-[#E5E7EB] mb-2" />
		<div>{children}</div>
	</section>
);

const PushSettingPage: React.FC = () => {
	const [prefs, setPrefs] = useState<PushPrefs>(defaults);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		let mounted = true;
		(async () => {
			setLoading(true);
			try {
				const d = await NotificationPrefsApi.getMy();
				if (!mounted) return;
				setPrefs({
					like: d.pushLike,
					collection: !!d.pushCollection,
					follow: d.pushFollow,
					workComment: d.pushComment,
					communityComment: d.pushComment, // 서버에 구분 없으면 동일 스위치 적용
					workStats: d.pushWorkDigest,
					messageGeneral: d.pushMessage,
					messageProjectOffer: true,
					messageHiringOffer: true,
					eventNewsletter: d.pushEvent,
				});
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, []);

	const save = async (partial: Partial<PushPrefs>) => {
		setPrefs(prev => ({ ...prev, ...partial }));
		setSaving(true);
		try {
			const next = { ...prefs, ...partial };
			await NotificationPrefsApi.updateMy({
				pushLike: next.like,
				pushCollection: next.collection,
				pushFollow: next.follow,
				pushComment: next.workComment || next.communityComment,
				pushWorkDigest: next.workStats,
				pushMessage: next.messageGeneral,
				pushEvent: next.eventNewsletter,
			});
		} finally {
			setSaving(false);
		}
	};

	const setField = (k: keyof PushPrefs) => (v: boolean) => save({ [k]: v } as any);

	return (
		<div className="min-h-screen font-gmarket pt-5 bg-[#F5F7FA] text-black">
			<div className="mx-auto max-w-[1400px] px-4 md:px-6">
				<div className="flex gap-6">
					<aside className="w-[320px] shrink-0"><Sidebar /></aside>
					<main className="flex-1 space-y-6">
						{/* 계정 활동 알림 — 좋아요/컬렉션/팔로우/작업 댓글/커뮤니티 댓글 */}
						<Card title="계정 활동 알림">
							<Row title="좋아요" desc="내 작업을 다른 사람이 좋아했을 때 알림을 받겠습니다." value={prefs.like} onChange={setField("like")} />
							<hr className="border-[#F2F4F7]" />
							<Row title="컬렉션" desc="내 작업을 다른 사람이 컬렉션에 추가했을 때 알림을 받겠습니다." value={prefs.collection} onChange={setField("collection")} />
							<hr className="border-[#F2F4F7]" />
							<Row title="팔로우" desc="다른 사람이 나를 팔로우 하였을 때 알림을 받겠습니다." value={prefs.follow} onChange={setField("follow")} />
							<hr className="border-[#F2F4F7]" />
							<Row title="작업 댓글" desc="작업 댓글 관련한 알림을 받겠습니다." value={prefs.workComment} onChange={setField("workComment")} />
							<hr className="border-[#F2F4F7]" />
							<Row title="커뮤니티 댓글" desc="커뮤니티 댓글 관련한 알림을 받겠습니다." value={prefs.communityComment} onChange={setField("communityComment")} />
						</Card>

						{/* 작업 통계 알림 — 작업/업로드 */}
						<Card title="작업 통계 알림">
							<Row title="작업/업로드" desc="내 작업 조회수, 좋아요, 컬렉션, 업로드 수가 특정 지점에 도달할 때 알림을 받겠습니다." value={prefs.workStats} onChange={setField("workStats")} />
						</Card>

						{/* 메시지 알림 */}
						<Card title="메시지 알림">
							<Row title="프로젝트/프리랜서 제안(알림 끄기 불가능)" desc="새로운 프로젝트/프리랜서 제안 메시지가 왔을 때 알림을 받겠습니다." value={true} disabled />
							<hr className="border-[#F2F4F7]" />
							<Row title="채용 제안(알림 끄기 불가능)" desc="새로운 채용 제안 메시지가 왔을 때 알림을 받겠습니다." value={true} disabled />
							<hr className="border-[#F2F4F7]" />
							<Row title="일반 메시지" desc="새로운 일반 메시지가 왔을 때 알림을 받겠습니다." value={prefs.messageGeneral} onChange={setField("messageGeneral")} />
						</Card>

						{/* 이벤트 알림 */}
						<Card title="이벤트 알림">
							<Row title="이벤트 혜택/정보" desc="창작자와 디자이너에게 도움이 되는 다양한 소식과 혜택 정보를 받겠습니다." value={prefs.eventNewsletter} onChange={setField("eventNewsletter")} />
						</Card>
					</main>
				</div>
			</div>
		</div>
	);
};

export default PushSettingPage; 