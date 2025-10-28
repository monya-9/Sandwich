import React from "react";
import ProfileAction from "./ProfileAction";
import SuggestAction from "./SuggestAction";
import LikeAction from "./LikeAction";
import CollectionAction from "./CollectionAction";
import CommentAction from "./CommentAction";
import ShareAction from "./ShareAction";
import QrCodeAction from "./QrCodeAction";
import LiveDemoAction from "./LiveDemoAction";

export interface ActionBarProps {
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
    isOwner?: boolean;
    ownerEmail?: string;
    ownerImageUrl?: string;
    initialIsFollowing?: boolean;
    qrCodeEnabled?: boolean;
  };
  isMobile?: boolean;
}

export default function ActionBar({ onCommentClick, project, isMobile = false }: ActionBarProps) {
  const { isOwner } = project;
  
  // 백엔드에서 제공하는 shareUrl 사용 (이미 올바른 CloudFront URL)
  const shareUrlFinal = project.shareUrl?.replace(/\/$/, "") || undefined;
  
  // 라이브/QR용: index.html 추가
  const liveUrl = shareUrlFinal ? `${shareUrlFinal}/index.html` : undefined;

  // 단일 컴포넌트로 유지하되 레이아웃만 변경
  return (
    <aside 
      className={isMobile 
        ? "flex flex-row items-center justify-around gap-2 py-3 px-4 overflow-x-auto"
        : "flex flex-col items-center gap-4"
      }
      style={isMobile ? {
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch'
      } as React.CSSProperties : undefined}
    >
      {isMobile && (
        <style>{`
          aside::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      )}
      <ProfileAction key="profile-action" targetUserId={project.ownerId} userName={project.owner} email={project.ownerEmail} profileImageUrl={project.ownerImageUrl} isOwner={isOwner} initialIsFollowing={project.initialIsFollowing} isMobile={isMobile} />
      {!isOwner && <SuggestAction key="suggest-action" targetUserId={project.ownerId} isMobile={isMobile} />}
      <LikeAction key="like-action" targetType="PROJECT" targetId={project.id} isMobile={isMobile} />
      <CollectionAction key="collection-action" projectId={project.id} isMobile={isMobile} />
      <CommentAction key="comment-action" onClick={onCommentClick} isMobile={isMobile} />
      <ShareAction key="share-action" shareUrl={shareUrlFinal} thumbnailUrl={project.coverUrl} title={project.name} isMobile={isMobile} />
      <QrCodeAction key="qrcode-action" qrImageUrl={project.qrImageUrl} title={project.name} thumbnailUrl={project.coverUrl} isMobile={isMobile} qrCodeEnabled={project.qrCodeEnabled} />
      <LiveDemoAction key="livedemo-action" url={liveUrl} isMobile={isMobile} />
    </aside>
  );
}
