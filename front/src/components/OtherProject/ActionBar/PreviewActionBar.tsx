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
	};
}

export default function PreviewActionBar({ onCommentClick, project }: PreviewActionBarProps) {
	return (
		<aside className="flex flex-col items-center gap-4">
			<ProfileAction targetUserId={project.ownerId} userName={project.owner} />
			<LikeAction targetType="PROJECT" targetId={project.id} />
			<CollectionAction />
			<CommentAction onClick={onCommentClick} />
			<ShareAction shareUrl={project.shareUrl} thumbnailUrl={project.coverUrl} title={project.name} />
			<QrCodeAction qrImageUrl={project.qrImageUrl} title={project.name} thumbnailUrl={project.coverUrl} />
			<LiveDemoAction />
		</aside>
	);
} 