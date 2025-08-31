import React, { useEffect, useRef } from "react";
import ProjectTopInfo from "../OtherProject/ProjectTopInfo";
import ProjectThumbnail from "../OtherProject/ProjectThumbnail";
import ProjectStatsBox from "../OtherProject/ProjectStatsBox";
import UserProfileBox from "../OtherProject/UserProfileBox";
import ActionBar from "../OtherProject/ActionBar/ActionBar";
import { FaEye, FaHeart, FaCommentDots } from "react-icons/fa";

interface ProjectPreviewModalProps {
	open: boolean;
	onClose: () => void;
	projectName?: string;
	ownerName?: string;
	category?: string;
	coverUrl?: string | null;
	backgroundColor?: string;
	contentGapPx?: number;
	children?: React.ReactNode;
	viewsCount?: number;
	likesCount?: number;
	commentsCount?: number;
}

export default function ProjectPreviewModal({ open, onClose, projectName = "프로젝트 이름", ownerName = "사용자 이름", category = "UI/UX", coverUrl, backgroundColor = "#FFFFFF", contentGapPx = 10, children, viewsCount = 0, likesCount = 0, commentsCount = 0 }: ProjectPreviewModalProps) {
	const scrollRef = useRef<HTMLDivElement | null>(null);
	useEffect(() => {
		if (open && scrollRef.current) {
			scrollRef.current.scrollTo({ top: 0, behavior: 'auto' });
		}
	}, [open]);
	if (!open) return null;

	const projectForBar = {
		qrImageUrl: "",
		username: "preview",
		id: 0,
		name: projectName,
		owner: ownerName,
		category,
		ownerId: 0,
		shareUrl: undefined as string | undefined,
		coverUrl: coverUrl || undefined as string | undefined,
	};

	const today = new Date();
	const dateLabel = `${today.getFullYear()}.${today.getMonth() + 1}.${today.getDate()}`;

	return (
		<div className="fixed inset-0 z-[10000] flex items-start justify-center overflow-auto" ref={scrollRef}>
			<style>{`
				.pm-preview-content { --pm-gap: ${contentGapPx}px; }
				.pm-preview-content > * + * { margin-top: var(--pm-gap) !important; }
				.pm-preview-content > * + *::before { content: ""; display: block; height: var(--pm-gap); margin-top: calc(-1 * var(--pm-gap)); }
				.pm-preview-content img, .pm-preview-content iframe { display: block; margin-left: auto; margin-right: auto; }
				.pm-preview-content img { max-width: 100%; height: auto; }
				.pm-preview-content iframe { width: 100% !important; height: auto !important; aspect-ratio: 16 / 9; }
				.pm-preview-content img.pm-embed-full { }
				.pm-preview-content iframe.pm-embed-full { width: 100% !important; height: auto !important; aspect-ratio: 16 / 9; }
				.pm-preview-content img.pm-embed-padded, .pm-preview-content iframe.pm-embed-padded { padding: 0 40px 40px 40px; background: transparent; border-radius: 0; box-sizing: border-box; }
				.pm-preview-content li + li { margin-top: calc(var(--pm-gap) / 2) !important; }
			`}</style>
			<div className="absolute inset-0 bg-black/50" onClick={onClose} />
			<div className="relative w-full max-w-[1440px] mx-auto px-6 py-10">
				<button
					className="absolute top-4 right-6 bg-white/90 hover:bg-white rounded-full px-4 py-2 shadow text-sm"
					onClick={onClose}
					type="button"
				>
					닫기
				</button>
				<div className="flex flex-row items-start">
					<section
						className="bg-white rounded-2xl shadow-2xl px-8 py-8 w-full"
						style={{ boxShadow: "0 8px 32px 0 rgba(34,34,34,.16)" }}
					>
						<div className="pointer-events-none select-none">
							<ProjectTopInfo projectName={projectName} userName={ownerName} intro="프로젝트 한줄 소개" />
							<div className="mb-6">
								{coverUrl ? (
									<ProjectThumbnail imgUrl={coverUrl} />
								) : (
									<div className="rounded-xl overflow-hidden" style={{ background: backgroundColor }}>
										<div className="px-6 py-8">
											<div className="max-w-[1200px] mx-auto">
												<div className="pm-preview-content">
													{children}
												</div>
											</div>
										</div>
									</div>
								)}
							</div>
                            <div className="mb-8">
                                <ProjectStatsBox
                                    likes={likesCount}
                                    views={viewsCount}
                                    comments={commentsCount}
                                    projectName={projectName}
                                    date={dateLabel}
                                    category={category}
                                />
                            </div>
							<UserProfileBox userName={ownerName} />
						</div>

						{/* 본문 콘텐츠 미리보기 (커버가 있을 때는 하단에 표시) */}
						{coverUrl && (
							<div className="mt-8 rounded-xl overflow-hidden" style={{ background: backgroundColor }}>
								<div className="px-6 py-8">
									<div className="max-w-[1200px] mx-auto">
										<div className="pm-preview-content">
											{children}
										</div>
									</div>
								</div>
							</div>
						)}

					</section>
					{/* 액션바 (미리보기에서는 클릭 비활성화) */}
					<div className="hidden lg:flex flex-col" style={{ width: 80, minWidth: 80, marginLeft: 25 }}>
						<div className="pointer-events-none">
							<ActionBar onCommentClick={() => {}} project={projectForBar as any} />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
} 