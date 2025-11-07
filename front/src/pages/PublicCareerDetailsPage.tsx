import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axiosInstance";
import { RepresentativeCareer } from "../api/userApi";

export default function PublicCareerDetailsPage() {
	const { userId } = useParams<{ userId: string }>();
	const navigate = useNavigate();
	const userIdNum = userId ? Number(userId) : 0;
	
	const [userInfo, setUserInfo] = useState<{
		nickname?: string | null;
		username?: string | null;
		profileImage?: string | null;
		email?: string | null;
	} | null>(null);
	const [repCareers, setRepCareers] = useState<RepresentativeCareer[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let mounted = true;
		(async () => {
			if (!userIdNum || userIdNum <= 0) {
				if (mounted) setLoading(false);
				return;
			}
			
			try {
				// 사용자 정보 가져오기
				const userRes = await api.get(`/users/${userIdNum}`);
				// 대표 커리어 목록 가져오기
				const careersRes = await api.get<RepresentativeCareer[]>(`/users/${userIdNum}/representative-careers`);
				
				if (!mounted) return;
				
				setUserInfo(userRes.data);
				setRepCareers(careersRes.data || []);
			} catch (error) {
				console.error("데이터 로드 실패:", error);
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		
		return () => {
			mounted = false;
		};
	}, [userIdNum]);

	const displayName = (userInfo?.nickname || userInfo?.username || "사용자").trim();
	const profileImageUrl = userInfo?.profileImage || "";

	if (loading) {
		return (
			<div className="w-full flex justify-center">
				<div className="w-full min-h-screen bg-[#F5F7FA] dark:bg-[var(--bg)] font-gmarket px-4 md:px-8 xl:px-14 py-10 text-black dark:text-white">로딩중...</div>
			</div>
		);
	}

	if (!userIdNum || userIdNum <= 0) {
		return (
			<div className="w-full flex justify-center">
				<div className="w-full min-h-screen bg-[#F5F7FA] dark:bg-[var(--bg)] font-gmarket px-4 md:px-8 xl:px-14 py-10 text-black dark:text-white">
					<div className="text-center">잘못된 사용자입니다.</div>
				</div>
			</div>
		);
	}

	// 타입별로 그룹화
	const careers = repCareers.filter(c => c.type === "CAREER");
	const educations = repCareers.filter(c => c.type === "EDUCATION");
	const awards = repCareers.filter(c => c.type === "AWARD");
	const projects = repCareers.filter(c => c.type === "PROJECT_RESUME" || c.type === "PROJECT_PORTFOLIO");

	return (
		<div className="w-full flex justify-center">
			<div className="w-full min-h-screen bg-[#F5F7FA] dark:bg-[var(--bg)] font-gmarket px-4 md:px-8 xl:px-14 py-10">
				<div className="max-w-[1100px] mx-auto bg-white dark:bg-[var(--surface)] border border-[#E5E7EB] dark:border-[var(--border-color)] rounded-[12px] p-6 md:p-10">
					{/* 헤더: 닉네임 좌측, 사진 우측 */}
					<div className="flex items-center justify-between">
						<div>
							<div className="text-[24px] md:text-[28px] text-black dark:text-white font-medium">{displayName}</div>
							<div className="mt-1 text-[13px] md:text-[14px] text-black/70 dark:text-white/70 underline break-all">
								{userInfo?.username ? `sandwich.com/${userInfo.username}` : `sandwich.com/user/${userIdNum}`}
							</div>
						</div>
						<div className="w-[80px] h-[80px] rounded-full bg-[#F3F4F6] dark:bg-[var(--avatar-bg)] overflow-hidden shrink-0 flex items-center justify-center">
							{profileImageUrl ? (
								<img src={profileImageUrl} alt="profile" className="w-full h-full object-cover" />
							) : (
								<span className="text-[28px] font-medium text-[#6B7280] dark:text-white">
									{userInfo?.email?.charAt(0)?.toUpperCase() || displayName.charAt(0).toUpperCase() || 'U'}
								</span>
							)}
						</div>
					</div>

					{/* 회색 구분선 */}
					<div className="mt-6 h-px w-full bg-[#E5E7EB] dark:bg-[var(--border-color)]" />

					{/* 섹션: 공통 레이아웃 - 좌측 라벨, 우측 리스트 */}
					<div className="divide-y divide-[#E5E7EB] dark:divide-[var(--border-color)]">
						{/* 경력 */}
						{careers.length > 0 && (
							<section className="py-10">
								<div className="grid grid-cols-[110px_1fr] gap-6">
									<div className="text-[14px] text-black/80 dark:text-white/80">경력</div>
									<div className="space-y-8">
										{careers.map((c, idx) => (
											<div key={idx}>
												<div className="text-[16px] text-black dark:text-white font-medium">{c.title}</div>
												<div className="mt-1 text-[14px] text-black/70 dark:text-white/70">{c.subtitle}</div>
												{c.description ? (
													<div className="mt-2 text-[14px] text-black/80 dark:text-white/80 whitespace-pre-wrap">{c.description}</div>
												) : null}
											</div>
										))}
									</div>
								</div>
							</section>
						)}

						{/* 프로젝트 */}
						{projects.length > 0 && (
							<section className="py-10">
								<div className="grid grid-cols-[110px_1fr] gap-6">
									<div className="text-[14px] text-black/80 dark:text-white/80">프로젝트</div>
									<div className="space-y-8">
										{projects.map((p, idx) => (
											<div key={idx}>
												<div className="text-[16px] text-black dark:text-white font-medium">{p.title}</div>
												<div className="mt-1 text-[14px] text-black/70 dark:text-white/70">{p.subtitle}</div>
												{p.description ? (
													<div className="mt-2 text-[14px] text-black/80 dark:text-white/80 whitespace-pre-wrap">{p.description}</div>
												) : null}
											</div>
										))}
									</div>
								</div>
							</section>
						)}

						{/* 수상 */}
						{awards.length > 0 && (
							<section className="py-10">
								<div className="grid grid-cols-[110px_1fr] gap-6">
									<div className="text-[14px] text-black/80 dark:text-white/80">수상</div>
									<div className="space-y-8">
										{awards.map((a, idx) => (
											<div key={idx}>
												<div className="text-[16px] text-black dark:text-white font-medium">{a.title}</div>
												<div className="mt-1 text-[14px] text-black/70 dark:text-white/70">{a.subtitle}</div>
												{a.description ? (
													<div className="mt-2 text-[14px] text-black/80 dark:text-white/80 whitespace-pre-wrap">{a.description}</div>
												) : null}
											</div>
										))}
									</div>
								</div>
							</section>
						)}

						{/* 학력 */}
						{educations.length > 0 && (
							<section className="py-10">
								<div className="grid grid-cols-[110px_1fr] gap-6">
									<div className="text-[14px] text-black/80 dark:text-white/80">학력</div>
									<div className="space-y-8">
										{educations.map((e, idx) => (
											<div key={idx}>
												<div className="text-[16px] text-black dark:text-white font-medium">{e.title}</div>
												<div className="mt-1 text-[14px] text-black/70 dark:text-white/70">{e.subtitle}</div>
												{e.description ? (
													<div className="mt-2 text-[14px] text-black/80 dark:text-white/80 whitespace-pre-wrap">{e.description}</div>
												) : null}
											</div>
										))}
									</div>
								</div>
							</section>
						)}
					</div>

					{/* 하단으로 돌아가기 */}
					<div className="mt-12">
						<button 
							onClick={() => navigate(`/users/${userIdNum}`)} 
							className="text-[14px] text-black/60 dark:text-white/60 hover:underline"
						>
							프로필로 돌아가기
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

