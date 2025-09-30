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
  // base 정규화: 프로토콜이 없으면 https://를 붙이고, 끝 슬래시는 제거
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

  // 예전 우선순위: 서버가 CF/숫자 경로를 주면 그걸 사용, 아니면 우리가 구성한 숫자 경로 사용
  const serverLooksNumericOrCf = !!serverShare && /(cloudfront\.net|\/\d+\/\d+\/?$)/.test(serverShare);
  const shareUrlFinal = serverLooksNumericOrCf ? serverShare : (cfUrl || serverShare);
  const liveUrl = ensureIndexHtml(shareUrlFinal || cfUrl);

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
