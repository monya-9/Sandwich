import React from "react";
import ProfileAction from "./ProfileAction";
import LikeAction from "./LikeAction";
import CollectionAction from "./CollectionAction";
import CommentAction from "./CommentAction";
import ShareAction from "./ShareAction";
import QrCodeAction from "./QrCodeAction";
import LiveDemoAction from "./LiveDemoAction";

interface PreviewActionBarProps {
	onCommentClick: () => void;
	project: {
		id: number;
		qrImageUrl: string;

		name: string;
		owner: string;
		category: string;
		ownerId: number;
		shareUrl?: string;
		coverUrl?: string;
		qrCodeEnabled?: boolean;
	};
}

export default function PreviewActionBar({ onCommentClick, project }: PreviewActionBarProps) {
	// 백엔드에서 제공하는 shareUrl 사용 (이미 올바른 CloudFront URL)
	const shareUrlFinal = project.shareUrl?.replace(/\/$/, "") || undefined;
	
	// 라이브/QR용: index.html 추가
	const liveUrl = shareUrlFinal ? `${shareUrlFinal}/index.html` : (typeof window !== "undefined" ? window.location.href : "#");

	return (
		<aside className="flex flex-col items-center gap-4">
			<ProfileAction targetUserId={project.ownerId} userName={project.owner} />
			<LikeAction targetType="PROJECT" targetId={project.id} />
			<CollectionAction />
			<CommentAction onClick={onCommentClick} />
			<ShareAction shareUrl={shareUrlFinal} thumbnailUrl={project.coverUrl} title={project.name} />
			<QrCodeAction qrImageUrl={project.qrImageUrl} title={project.name} thumbnailUrl={project.coverUrl} qrCodeEnabled={project.qrCodeEnabled} />
			<LiveDemoAction url={liveUrl} />
		</aside>
	);
} 