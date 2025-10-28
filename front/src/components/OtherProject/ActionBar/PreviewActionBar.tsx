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
	const normalizeBase = (u?: string) => {
		let s = String(u || "").trim();
		if (!s) return "";
		if (!/^https?:\/\//i.test(s)) s = `https://${s.replace(/^\/+/, "")}`;
		return s.replace(/\/$/, "");
	};
	const cloudfrontBase = normalizeBase(process.env.REACT_APP_CLOUDFRONT_BASE as any);
	const numericPath = project.ownerId && project.id ? `/${project.ownerId}/${project.id}/` : undefined;
	const cfUrl = numericPath ? (cloudfrontBase ? `${cloudfrontBase}${numericPath}` : numericPath) : undefined;
	const serverShare = project.shareUrl || undefined;

	const ensureIndexHtml = (u?: string) => {
		if (!u) return undefined;
		if (/index\.html$/i.test(u)) return u;
		if (/\/\d+\/\d+\/?$/.test(u) || /\/$/.test(u)) return u.replace(/\/?$/, "/index.html");
		return u;
	};

	const serverLooksNumericOrCf = !!serverShare && /(cloudfront\.net|\/\d+\/\d+\/?$)/.test(serverShare);
	const shareUrlFinal = serverLooksNumericOrCf ? serverShare : (cfUrl || serverShare);
	const liveUrl = ensureIndexHtml(shareUrlFinal || cfUrl) || (typeof window !== "undefined" ? window.location.href : "#");

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