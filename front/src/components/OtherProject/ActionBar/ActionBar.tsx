import React from "react";
import ProfileAction from "./ProfileAction";
import SuggestAction from "./SuggestAction";
import LikeAction from "./LikeAction";
import CollectionAction from "./CollectionAction";
import CommentAction from "./CommentAction";
import ShareAction from "./ShareAction";
import QrCodeAction from "./QrCodeAction";
import LiveDemoAction from "./LiveDemoAction";

interface ActionBarProps {
  onCommentClick: () => void;
  project: {
    id: number;
    qrImageUrl: string;
    name: string;
    owner: string;
    category: string;
    ownerId: number; // 팔로우 대상 사용자 ID
    shareUrl?: string;
    coverUrl?: string;
    isOwner?: boolean;
    ownerEmail?: string;
    ownerImageUrl?: string;
    initialIsFollowing?: boolean;
  };
}

export default function ActionBar({ onCommentClick, project }: ActionBarProps) {
  const { isOwner } = project;
  // 라이브/공유 URL 우선순위: 서버 제공 shareUrl(이미 CF 또는 숫자 경로면 유지) > CloudFront 기본 경로 구성
  const cloudfrontBase = (process.env.REACT_APP_CLOUDFRONT_BASE || "").replace(/\/$/, "");
  const numericPath = project.ownerId && project.id ? `/${project.ownerId}/${project.id}/` : undefined;
  const cfUrl = numericPath ? (cloudfrontBase ? `${cloudfrontBase}${numericPath}` : numericPath) : undefined;
  const serverShare = project.shareUrl || undefined;
  const serverLooksNumericOrCf = !!serverShare && /(cloudfront\.net|\/\d+\/\d+\/?$)/.test(serverShare);
  const shareUrlFinal = serverLooksNumericOrCf ? serverShare : (cfUrl || serverShare);
  const liveUrl = shareUrlFinal || cfUrl;

  return (
    <aside className="flex flex-col items-center gap-4">
      <ProfileAction targetUserId={project.ownerId} userName={project.owner} email={project.ownerEmail} profileImageUrl={project.ownerImageUrl} isOwner={isOwner} initialIsFollowing={project.initialIsFollowing} />
      {!isOwner && <SuggestAction targetUserId={project.ownerId} />}
      <LikeAction targetType="PROJECT" targetId={project.id} />
      <CollectionAction projectId={project.id} />
      <CommentAction onClick={onCommentClick} />
      <ShareAction thumbnailUrl={project.coverUrl} title={project.name} />
      <QrCodeAction qrImageUrl={project.qrImageUrl} title={project.name} thumbnailUrl={project.coverUrl} />
      <LiveDemoAction url={liveUrl} />
    </aside>
  );
}
