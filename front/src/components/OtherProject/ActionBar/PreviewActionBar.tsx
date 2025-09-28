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
	const cloudfrontBase = (process.env.REACT_APP_CLOUDFRONT_BASE || "").replace(/\/$/, "");
	const numericPath = project.ownerId && project.id ? `/${project.ownerId}/${project.id}/` : undefined;
	const cfUrl = numericPath ? (cloudfrontBase ? `${cloudfrontBase}${numericPath}` : numericPath) : undefined;
	const serverShare = project.shareUrl || undefined;
	const serverLooksNumericOrCf = !!serverShare && /(cloudfront\.net|\/\d+\/\d+\/?$)/.test(serverShare);
	const shareUrlFinal = serverLooksNumericOrCf ? serverShare : (cfUrl || serverShare);
	const liveUrl = shareUrlFinal || cfUrl;

	return (
		<aside className="flex flex-col items-center gap-4">
			<ProfileAction targetUserId={project.ownerId} userName={project.owner} />
			<LikeAction targetType="PROJECT" targetId={project.id} />
			<CollectionAction />
			<CommentAction onClick={onCommentClick} />
			<ShareAction shareUrl={shareUrlFinal} thumbnailUrl={project.coverUrl} title={project.name} />
			<QrCodeAction qrImageUrl={project.qrImageUrl} title={project.name} thumbnailUrl={project.coverUrl} />
			<LiveDemoAction url={liveUrl} />
		</aside>
	);
} 