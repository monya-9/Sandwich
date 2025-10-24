import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { UserApi, type UserProfileResponse } from "../../api/userApi";
import { CareerApi } from "../../api/careerApi";
import { EducationApi } from "../../api/educationApi";
import { AwardApi } from "../../api/awardApi";
import { CareerProjectApi } from "../../api/careerProjectApi";

type CareerItem = {
	id: number;
	role: string;
	companyName: string;
	startYear: number;
	startMonth?: number | null;
	endYear?: number | null;
	endMonth?: number | null;
	isWorking?: boolean;
	description?: string | null;
	isRepresentative?: boolean;
};

type EducationItem = {
	id: number;
	schoolName: string;
	degree?: string;
	level?: string;
	status?: string;
	startYear: number;
	startMonth?: number | null;
	endYear?: number | null;
	endMonth?: number | null;
	description?: string | null;
	isRepresentative?: boolean;
};

type AwardItem = {
	id: number;
	title: string;
	issuer: string;
	year: number;
	month: number;
	description?: string | null;
	isRepresentative?: boolean;
};

type ProjectItem = {
	id: number;
	title: string;
	role: string;
	startYear: number;
	startMonth?: number | null;
	endYear?: number | null;
	endMonth?: number | null;
	description?: string | null;
	isRepresentative?: boolean;
};

const MAJOR_PREFIX = "__MAJOR__:";
const STATUS_PREFIX = "__STATUS__:";

function formatYearMonth(y?: number | null, m?: number | null): string {
	if (!y) return "";
	if (!m) return `${y}`;
	return `${y}.${m}`;
}

function CareerDetailsPage() {
	const [me, setMe] = useState<UserProfileResponse | null>(null);
	const [careers, setCareers] = useState<CareerItem[]>([]);
	const [educations, setEducations] = useState<EducationItem[]>([]);
	const [awards, setAwards] = useState<AwardItem[]>([]);
	const [projects, setProjects] = useState<ProjectItem[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const [meRes, cRes, eRes, aRes, pRes] = await Promise.all([
					UserApi.getMe(),
					(CareerApi.list() as any).then((r: any) => r.data).catch(() => []),
					(EducationApi.list() as any).then((r: any) => r.data).catch(() => []),
					(AwardApi.list() as any).then((r: any) => r.data).catch(() => []),
					(CareerProjectApi.list() as any).then((r: any) => r.data).catch(() => []),
				]);
				if (!mounted) return;
				setMe(meRes);
				// 비공개 필터 적용 (항목별 id 기반)
				const isPrivate = (prefix: string, id: number) => {
					try { return localStorage.getItem(`privacy:${prefix}:${id}`) === "1"; } catch { return false; }
				};
				setCareers((cRes || []).filter((c: any) => !isPrivate("career", c.id)));
				setEducations((eRes || []).filter((e: any) => !isPrivate("education", e.id)));
				setAwards((aRes || []).filter((a: any) => !isPrivate("award", a.id)));
				setProjects((pRes || []).filter((p: any) => !isPrivate("project", p.id)));
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, []);

	// 비공개 변경 이벤트 반영
	useEffect(() => {
		const onPrivacy = () => {
			const isPrivate = (prefix: string, id: number) => {
				try { return localStorage.getItem(`privacy:${prefix}:${id}`) === "1"; } catch { return false; }
			};
			setCareers((prev) => prev.filter((c: any) => !isPrivate("career", c.id)));
			setProjects((prev) => prev.filter((p: any) => !isPrivate("project", p.id)));
			setEducations((prev) => prev.filter((e: any) => !isPrivate("education", e.id)));
			setAwards((prev) => prev.filter((a: any) => !isPrivate("award", a.id)));
		};
		window.addEventListener("privacy-changed", onPrivacy as any);
		return () => window.removeEventListener("privacy-changed", onPrivacy as any);
	}, []);

	// 계정별 스코프 키 우선
	const userEmailScoped = (typeof window !== "undefined" && (localStorage.getItem("userEmail") || sessionStorage.getItem("userEmail"))) || "";
	const usernameScopedKey = userEmailScoped ? `userUsername:${userEmailScoped}` : "userUsername";
	const scopedUsernameLocal = (typeof window !== "undefined" && (localStorage.getItem(usernameScopedKey) || sessionStorage.getItem(usernameScopedKey))) || "";
	const profileUrlScopedKey = userEmailScoped ? `profileUrlSlug:${userEmailScoped}` : "profileUrlSlug";
	const scopedProfileUrl = (typeof window !== "undefined" && (localStorage.getItem(profileUrlScopedKey) || sessionStorage.getItem(profileUrlScopedKey))) || "";
	// ✅ profileSlug 우선 사용, 없으면 기존 로직 유지
	const profileUrlSlug = me?.profileSlug || scopedProfileUrl || scopedUsernameLocal || me?.username || (localStorage.getItem("userUsername") || sessionStorage.getItem("userUsername") || "");
	const displayName = (me?.nickname && me.nickname.trim()) || (localStorage.getItem("userNickname") || sessionStorage.getItem("userNickname") || "").trim() || me?.username || "사용자";
	const profileImageUrl = me?.profileImage || "";
	// 한줄 프로필: 현재 로그인 스코프 키에서만 읽고, 없으면 표시하지 않음
	const storedEmail = (typeof window !== "undefined" && (localStorage.getItem("userEmail") || sessionStorage.getItem("userEmail"))) || "";
	const scopedKey = storedEmail ? `profileOneLine:${storedEmail}` : "profileOneLine";
	let oneLineScoped = "";
	try {
		oneLineScoped = localStorage.getItem(scopedKey) || sessionStorage.getItem(scopedKey) || "";
	} catch {}
	const rawOneLiner = (me as any)?.profileName || oneLineScoped || "";
	const oneLiner = rawOneLiner && (rawOneLiner as any).trim ? (rawOneLiner as string).trim() : rawOneLiner;
	const bioText = (me?.bio || "").trim();

	const parsedEducations = useMemo(() => {
		return (educations || []).map((e) => {
			let major = "";
			let status = "";
			(e.description || "").split("\n").forEach((line) => {
				if (line.startsWith(MAJOR_PREFIX)) major = line.slice(MAJOR_PREFIX.length).trim();
				else if (line.startsWith(STATUS_PREFIX)) status = line.slice(STATUS_PREFIX.length).trim();
			});
			return { ...e, major, status } as any;
		});
	}, [educations]);

	useEffect(() => {
		const onUserUpdated = async () => {
			try {
				const meRes = await UserApi.getMe();
				setMe(meRes);
			} catch {}
		};
		window.addEventListener("user-username-updated", onUserUpdated as any);
		window.addEventListener("user-nickname-updated", onUserUpdated as any);
		return () => {
			window.removeEventListener("user-username-updated", onUserUpdated as any);
			window.removeEventListener("user-nickname-updated", onUserUpdated as any);
		};
	}, []);

	if (loading) {
		return (
			<div className="w-full flex justify-center">
				<div className="w-full min-h-screen bg-[#F5F7FA] font-gmarket px-4 md:px-8 xl:px-14 py-10">로딩중...</div>
			</div>
		);
	}

	return (
		<div className="w-full flex justify-center">
			<div className="w-full min-h-screen bg-[#F5F7FA] font-gmarket px-4 md:px-8 xl:px-14 py-10">
				<div className="max-w-[1100px] mx-auto bg-white border border-[#E5E7EB] rounded-[12px] p-6 md:p-10">
					{/* 헤더: 닉네임 좌측, 사진 우측 */}
					<div className="flex items-center justify-between">
						<div>
							<div className="text-[24px] md:text-[28px] text-black font-medium">{displayName}</div>
							{oneLiner ? (
								<div className="mt-1 text-[14px] text-black/80">{oneLiner}</div>
							) : null}
							<div className="mt-1 text-[13px] md:text-[14px] text-black/70 underline break-all">
								{profileUrlSlug ? `sandwich.com/${profileUrlSlug}` : "sandwich.com"}
							</div>
							{bioText ? (
								<div className="mt-4 text-[14px] text-black/80 whitespace-pre-line">{bioText}</div>
							) : null}
						</div>
						<div className="w-[64px] h-[64px] rounded-full bg-[#F3F4F6] overflow-hidden shrink-0">
							{profileImageUrl ? (
								<img src={profileImageUrl} alt="profile" className="w-full h-full object-cover" />
							) : null}
						</div>
					</div>

					{/* 회색 구분선 */}
					<div className="mt-6 h-px w-full bg-[#E5E7EB]" />

					{/* 섹션: 공통 레이아웃 - 좌측 라벨, 우측 리스트 */}
					<div className="divide-y divide-[#E5E7EB]">
						{/* 경력 */}
						<section className="py-10">
							<div className="grid grid-cols-[110px_1fr] gap-6">
								<div className="text-[14px] text-black/80">경력</div>
								<div className="space-y-8">
									{careers.map((c) => {
										const start = formatYearMonth(c.startYear, c.startMonth || undefined);
										const end = c.isWorking ? "현재" : formatYearMonth(c.endYear || undefined, c.endMonth || undefined);
										return (
											<div key={c.id}>
												<div className="text-[12px] text-black/55">{start} ~ {end}</div>
												<div className="mt-1 text-[16px] text-black font-medium">{c.companyName}</div>
												<div className="mt-1 text-[14px] text-black/70">{c.role}</div>
												{c.description ? (
													<div className="mt-2 text-[14px] text-black/80 whitespace-pre-wrap">{c.description}</div>
												) : null}
											</div>
										);
									})}
								</div>
							</div>
						</section>

						{/* 프로젝트 */}
						<section className="py-10">
							<div className="grid grid-cols-[110px_1fr] gap-6">
								<div className="text-[14px] text-black/80">프로젝트</div>
								<div className="space-y-8">
									{projects.map((p) => {
										const start = formatYearMonth(p.startYear, p.startMonth || undefined);
										const end = formatYearMonth(p.endYear || undefined, p.endMonth || undefined);
										return (
											<div key={p.id}>
												<div className="text-[12px] text-black/55">{start} ~ {end}</div>
												<div className="mt-1 text-[16px] text-black font-medium">{p.title}</div>
												<div className="mt-1 text-[14px] text-black/70">{p.role}</div>
												{p.description ? (
													<div className="mt-2 text-[14px] text-black/80 whitespace-pre-wrap">{p.description}</div>
												) : null}
											</div>
										);
									})}
								</div>
							</div>
						</section>

						{/* 수상 */}
						<section className="py-10">
							<div className="grid grid-cols-[110px_1fr] gap-6">
								<div className="text-[14px] text-black/80">수상</div>
								<div className="space-y-8">
									{awards.map((a) => (
										<div key={a.id}>
											<div className="text-[12px] text-black/55">{a.year}년 {a.month}월 수상</div>
											<div className="mt-1 text-[16px] text-black font-medium">{a.title}</div>
											<div className="mt-1 text-[14px] text-black/70">{a.issuer}</div>
											{a.description ? (
												<div className="mt-2 text-[14px] text-black/80 whitespace-pre-wrap">{a.description}</div>
											) : null}
										</div>
									))}
								</div>
							</div>
						</section>

						{/* 학력 */}
						<section className="py-10">
							<div className="grid grid-cols-[110px_1fr] gap-6">
								<div className="text-[14px] text-black/80">학력</div>
								<div className="space-y-8">
									{parsedEducations.map((e: any) => {
										const start = formatYearMonth(e.startYear, e.startMonth || undefined);
										const end = formatYearMonth(e.endYear || undefined, e.endMonth || undefined);
										const top = e.level === "HIGH_SCHOOL" 
											? "고등학교"
											: e.degree ? `${e.schoolName}(${e.degree})` : e.schoolName;
										return (
											<div key={e.id}>
												<div className="text-[12px] text-black/55">{start} ~ {end}</div>
												<div className="mt-1 text-[16px] text-black font-medium">{top}</div>
												{e.major ? (<div className="mt-1 text-[14px] text-black/70">{e.major}</div>) : null}
												{e.status ? (<div className="mt-0.5 text-[13px] text-black/55">{e.status}</div>) : null}
												{e.description ? (
													<div className="mt-2 text-[14px] text-black/80 whitespace-pre-wrap">{(e.description as string).split("\n").filter((ln: string)=> !ln.startsWith(MAJOR_PREFIX) && !ln.startsWith(STATUS_PREFIX)).join("\n")}</div>
												) : null}
											</div>
										);
									})}
								</div>
							</div>
						</section>
					</div>

					{/* 하단으로 돌아가기 */}
					<div className="mt-12">
						<Link to="/profile" className="text-[14px] text-black/60 hover:underline">프로필로 돌아가기</Link>
					</div>
					</div>
				</div>
			</div>
	);
}

export default CareerDetailsPage; 