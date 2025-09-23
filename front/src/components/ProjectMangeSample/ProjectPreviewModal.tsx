import React, { useEffect, useRef } from "react";
// import ProjectTopInfo from "../OtherProject/ProjectTopInfo";
import ProjectThumbnail from "../OtherProject/ProjectThumbnail";
import ProjectStatsBox from "../OtherProject/ProjectStatsBox";
import UserProfileBox from "../OtherProject/UserProfileBox";
// import ActionBar from "../OtherProject/ActionBar/ActionBar";
import PreviewActionBar from "../OtherProject/ActionBar/PreviewActionBar";
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
	rawHtml?: string; // 에디터 HTML을 직접 주입
	viewsCount?: number;
	likesCount?: number;
	commentsCount?: number;
	onEdit?: () => void;
	onDelete?: () => void;
}

export default function ProjectPreviewModal({ open, onClose, projectName = "프로젝트 이름", ownerName = "사용자 이름", category = "UI/UX", coverUrl, backgroundColor = "#FFFFFF", contentGapPx = 10, children, rawHtml, viewsCount = 0, likesCount = 0, commentsCount = 0, onEdit, onDelete }: ProjectPreviewModalProps) {
	const scrollRef = useRef<HTMLDivElement | null>(null);
	useEffect(() => {
		if (!open) return;
		try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch {}
		const syncNaturalImageWidth = () => {
			try {
				const imgs = document.querySelectorAll('.pm-preview-content .ql-editor img');
				imgs.forEach((node) => {
					const img = node as HTMLImageElement;
					const nw = img.naturalWidth || img.width || 0;
					if (nw > 0) {
						img.style.maxWidth = nw + 'px';
						img.style.width = 'auto';
					}
				});
			} catch {}
		};
		syncNaturalImageWidth();
		const t = window.setTimeout(syncNaturalImageWidth, 60);
		return () => { try { window.clearTimeout(t); } catch {}; };
	}, [open, rawHtml]);
	if (!open) return null;

	// 닉네임/이메일 기반 표시 이름과 이니셜 계산
	const storedNickname = (localStorage.getItem("userNickname") || sessionStorage.getItem("userNickname") || "").trim();
	const storedEmail = (localStorage.getItem("userEmail") || sessionStorage.getItem("userEmail") || "").trim();
	const finalOwnerName = storedNickname || ownerName;
	const emailInitial = storedEmail ? storedEmail[0].toUpperCase() : "";
	const ownerInitial = emailInitial || (finalOwnerName?.[0] || "").toUpperCase();

	const projectForBar = {
		qrImageUrl: "",
		username: "preview",
		id: 0,
		name: projectName,
		owner: finalOwnerName,
		category,
		ownerId: 0,
		shareUrl: undefined as string | undefined,
		coverUrl: coverUrl || undefined as string | undefined,
	};

	const today = new Date();
	const dateLabel = `${today.getFullYear()}.${today.getMonth() + 1}.${today.getDate()}`;
	const displayTitle = projectName && projectName.trim().length > 0 ? projectName : "-";

	return (
		<div className="absolute inset-0 z-[10000] flex items-start justify-center overflow-visible" ref={scrollRef}>
							<style>{`
				.pm-preview-content { --pm-gap: ${contentGapPx}px; }
				.pm-preview-frame { width: 1200px; margin-left: auto; margin-right: auto; }
				/* 샘플 에디터와 동일한 간격 모델 (margin-top) */
				.pm-preview-content .ql-editor { --pm-top-gap: var(--pm-gap); padding: 0; width: 100%; max-width: none; margin-left: 0; margin-right: 0; }
				/* text start offset only */
				.pm-preview-content .ql-editor > p,
				.pm-preview-content .ql-editor > h1,
				.pm-preview-content .ql-editor > h2,
				.pm-preview-content .ql-editor > h3,
				.pm-preview-content .ql-editor > h4,
				.pm-preview-content .ql-editor > h5,
				.pm-preview-content .ql-editor > h6,
				.pm-preview-content .ql-editor > blockquote,
				.pm-preview-content .ql-editor > pre { text-indent: 40px; }
				.pm-preview-content .ql-editor > * + * { margin-top: var(--pm-top-gap, var(--pm-gap)) !important; }
				.pm-gap-0 .ql-editor > * + * { margin-top: 0 !important; }
				/* keep user media padding even when gap=0 */
				/* 마진 리셋: 기본 태그 마진을 제거 */
				.pm-preview-content .ql-editor h1,
				.pm-preview-content .ql-editor h2,
				.pm-preview-content .ql-editor h3,
				.pm-preview-content .ql-editor h4,
				.pm-preview-content .ql-editor h5,
				.pm-preview-content .ql-editor h6,
				.pm-preview-content .ql-editor p,
				.pm-preview-content .ql-editor blockquote,
				.pm-preview-content .ql-editor ul,
				.pm-preview-content .ql-editor ol,
				.pm-preview-content .ql-editor pre,
				.pm-preview-content .ql-editor table,
				.pm-preview-content .ql-editor figure { margin: 0; }
				/* 리스트 아이템 간격 유지 */
				.pm-preview-content .ql-editor li + li { margin-top: calc(var(--pm-gap) / 2) !important; }
				/* Collapse empty paragraphs Quill inserts between embeds */
				.pm-preview-content .ql-editor p:has(> br:only-child) { margin: 0 !important; height: 0; line-height: 0; padding: 0; }
				/* Remove line box extra space when paragraph wraps only an embed */
				.pm-preview-content .ql-editor p:has(> iframe:only-child),
				.pm-preview-content .ql-editor p:has(> img:only-child) { line-height: 0; font-size: 0; }
				.pm-preview-content img, .pm-preview-content iframe { display: block; margin-left: auto; margin-right: auto; }
				.pm-preview-content img { height: auto !important; max-width: 100% !important; width: auto !important; }
				.pm-preview-content iframe { width: 100% !important; height: auto !important; aspect-ratio: 16 / 9; }
				/* 강제: 동영상은 항상 컨테이너 폭에 맞춤 */
				.pm-preview-content iframe.ql-video, .pm-preview-content .ql-editor iframe.ql-video { width: 100% !important; max-width: none !important; height: auto !important; aspect-ratio: 16 / 9; display: block; }
				/* 풀폭 처리: 미리보기에서는 iframe만 강제 풀폭 */
				.pm-preview-content iframe.pm-embed-full, .pm-preview-content .ql-editor iframe.pm-embed-full { width: 100% !important; height: auto !important; aspect-ratio: 16 / 9; }
				/* 이미지 기본 크기 강제 확장 금지: 에디터와 동일하게 자연 크기(컨테이너 이내) 유지 */
				.pm-preview-content img:not(.pm-embed-padded), .pm-preview-content .ql-editor img:not(.pm-embed-padded) { max-width: 100% !important; height: auto !important; }
				.pm-preview-content iframe:not(.pm-embed-padded), .pm-preview-content .ql-editor iframe:not(.pm-embed-padded) { width: 100% !important; margin-left: 0 !important; margin-right: 0 !important; height: auto !important; aspect-ratio: 16 / 9; }
				/* 패딩 컴포저: 간격 0이면 하단 패딩 제거로 완전 밀착 */
				.pm-preview-content img.pm-embed-padded,
				.pm-preview-content iframe.pm-embed-padded,
				.pm-preview-content .ql-editor img.pm-embed-padded,
				.pm-preview-content .ql-editor iframe.pm-embed-padded {
					padding: 0 var(--pm-pad, 0px) var(--pm-pad, 0px) var(--pm-pad, 0px);
					margin-bottom: calc(-1 * var(--pm-pad, 0px));
					background: transparent; box-sizing: border-box;
				}
				/* 에디터에서 설정한 --pm-pad 사용: 패딩 적용 + 하단 음수 마진으로 총 간격 유지 */
				.pm-preview-content img.pm-embed-padded, .pm-preview-content iframe.pm-embed-padded,
				.pm-preview-content .ql-editor img.pm-embed-padded, .pm-preview-content .ql-editor iframe.pm-embed-padded {
					padding: 0 var(--pm-pad, 0px) var(--pm-pad, 0px) var(--pm-pad, 0px);
					margin-bottom: calc(-1 * var(--pm-pad, 0px));
					background: transparent; border-radius: 0; box-sizing: border-box;
				}
				/* Keep outer gap when previous block is padded media */
				.pm-preview-content img.pm-embed-padded + *,
				.pm-preview-content iframe.pm-embed-padded + *,
				.pm-preview-content .ql-editor img.pm-embed-padded + *,
				.pm-preview-content .ql-editor iframe.pm-embed-padded + * { margin-top: calc(var(--pm-gap) + var(--pm-pad, 0px)) !important; }
				/* 연속 미디어 간격 */
				.pm-preview-content .ql-editor img + img,
				.pm-preview-content .ql-editor img + iframe,
				.pm-preview-content .ql-editor iframe + img,
				.pm-preview-content .ql-editor iframe + iframe { margin-top: var(--pm-gap) !important; display: block; }
				/* if previous embed is padded, add pad back to keep exact outer gap */
				.pm-preview-content .ql-editor img.pm-embed-padded + img,
				.pm-preview-content .ql-editor img.pm-embed-padded + iframe,
				.pm-preview-content .ql-editor iframe.pm-embed-padded + img,
				.pm-preview-content .ql-editor iframe.pm-embed-padded + iframe { margin-top: calc(var(--pm-gap) + var(--pm-pad, 0px)) !important; }
			`}</style>
			<div className="fixed inset-0 bg-black/80" onClick={onClose} />
			<div className="relative w-full max-w-[1440px] mx-auto px-0 py-10">
				<div className="flex flex-row items-start">
					<section
						className="bg-white rounded-2xl shadow-2xl py-8 w-full"
						style={{ boxShadow: "0 8px 32px 0 rgba(34,34,34,.16)" }}
					>
						{/* 상단 헤더: 제목(-), 닉네임, 수정/삭제 */}
						<div className="px-8">
							<div className="w-full flex items-start gap-3 mb-6">
								<div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-700 flex-shrink-0">
									{ownerInitial}
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 flex-wrap">
										<h1 className="text-2xl font-bold text-black truncate">{displayTitle}</h1>
										<div className="flex items-center gap-2 ml-20">
											<button className="bg-white border border-[#E5E7EB] text-gray-700 hover:bg-gray-50 rounded-full px-4 py-1.5 text-sm font-semibold" onClick={onEdit}>수정하기</button>
											<button className="bg-[#F6323E] text-white hover:bg-[#e42b36] rounded-full px-4 py-1.5 text-sm font-semibold" onClick={onDelete}>삭제하기</button>
										</div>
									</div>
									<div className="text-gray-600 text-sm mt-1 truncate">{finalOwnerName}</div>
									<div className="text-gray-500 text-sm mt-0.5 truncate">프로젝트 한줄 소개</div>
								</div>
							</div>
						</div>
						<div>
							{/* 커버/본문 */}
							<div className="mb-6">
								{coverUrl ? (
									<ProjectThumbnail imgUrl={coverUrl} />
								) : (
									<div className="rounded-xl overflow-hidden" style={{ background: backgroundColor }}>
										<div className="px-0 py-8">
											<div className="w-full">
												{rawHtml ? (
													<div className="pm-preview-content" style={{ ['--pm-gap' as any]: `${contentGapPx}px` }}>
														<div className="ql-editor" dangerouslySetInnerHTML={{ __html: rawHtml }} />
														<script dangerouslySetInnerHTML={{ __html: `
															(function(){
															  try{
															    var root = document.currentScript && document.currentScript.previousElementSibling;
															    if(!root) return;
															    var imgs = root.querySelectorAll('img');
															    var iframes = root.querySelectorAll('iframe');
															    function setPad(el){
																  var s = getComputedStyle(el);
																  var pad = parseFloat(s.getPropertyValue('--pm-pad')||'0');
																  if(!pad){
																    var pl = parseFloat(s.paddingLeft||'0');
																    var pr = parseFloat(s.paddingRight||'0');
																    var pb = parseFloat(s.paddingBottom||'0');
																    pad = Math.max(pl,pr,pb);
																  }
																  el.style.setProperty('--pm-pad', pad + 'px');
																}
																imgs.forEach(setPad); iframes.forEach(setPad);
															  }catch(e){}
															})();` }} />
													</div>
												) : (
													<div className="pm-preview-content" style={{ ['--pm-gap' as any]: `${contentGapPx}px` }}>{children}</div>
												)}
											</div>
										</div>
									</div>
								)}
							</div>
							<div className="mb-8 px-8">
								<ProjectStatsBox
									likes={likesCount}
									views={viewsCount}
									comments={commentsCount}
									projectName={projectName}
									date={dateLabel}
									category={category}
								/>
							</div>
							<div className="px-8">
								<UserProfileBox userName={finalOwnerName} />
							</div>
						</div>

						{/* 본문 콘텐츠 미리보기 (커버가 있을 때는 하단에 표시) */}
						{coverUrl && (
							<div className="mt-8 rounded-xl overflow-hidden" style={{ background: backgroundColor }}>
								<div className="px-0 py-8">
									<div className="w-full">
										{rawHtml ? (
											<div className="pm-preview-content" style={{ ['--pm-gap' as any]: `${contentGapPx}px` }}>
												<div className="ql-editor" dangerouslySetInnerHTML={{ __html: rawHtml }} />
												<script dangerouslySetInnerHTML={{ __html: `
												(function(){
												  try{
												    var root = document.currentScript && document.currentScript.previousElementSibling;
												    if(!root) return;
												    var imgs = root.querySelectorAll('img');
												    var iframes = root.querySelectorAll('iframe');
												    function setPad(el){
													  var s = getComputedStyle(el);
													  var pad = parseFloat(s.getPropertyValue('--pm-pad')||'0');
													  if(!pad){
													    var pl = parseFloat(s.paddingLeft||'0');
													    var pr = parseFloat(s.paddingRight||'0');
													    var pb = parseFloat(s.paddingBottom||'0');
													    pad = Math.max(pl,pr,pb);
													  }
													  el.style.setProperty('--pm-pad', pad + 'px');
													}
													imgs.forEach(setPad); iframes.forEach(setPad);
												  }catch(e){}
												})();` }} />
										</div>
										) : (
											<div className="pm-preview-content" style={{ ['--pm-gap' as any]: `${contentGapPx}px` }}>{children}</div>
										)}
									</div>
								</div>
							</div>
						)}

					</section>
					{/* 액션바 (미리보기에서는 클릭 비활성화) */}
					<div className="hidden lg:flex flex-col" style={{ width: 80, minWidth: 80, marginLeft: 25 }}>
						<div className="pointer-events-none">
							<PreviewActionBar onCommentClick={() => {}} project={projectForBar as any} />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}