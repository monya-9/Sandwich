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

  // 단일 컴포넌트로 유지하되 레이아웃만 변경
  return (
    <aside 
      className={isMobile 
        ? "flex flex-row flex-nowrap items-center justify-around gap-2 py-3 px-4 overflow-x-auto"
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
      <div className={isMobile ? "flex-shrink-0" : ""}>
      <ProfileAction key="profile-action" targetUserId={project.ownerId} userName={project.owner} email={project.ownerEmail} profileImageUrl={project.ownerImageUrl} isOwner={isOwner} initialIsFollowing={project.initialIsFollowing} isMobile={isMobile} />
      </div>
      {!isOwner && (
        <div className={isMobile ? "flex-shrink-0" : ""}>
          <SuggestAction key="suggest-action" targetUserId={project.ownerId} isMobile={isMobile} />
        </div>
      )}
      <div className={isMobile ? "flex-shrink-0" : ""}>
      <LikeAction key="like-action" targetType="PROJECT" targetId={project.id} isMobile={isMobile} />
      </div>
      <div className={isMobile ? "flex-shrink-0" : ""}>
      <CollectionAction key="collection-action" projectId={project.id} isMobile={isMobile} />
      </div>
      <div className={isMobile ? "flex-shrink-0" : ""}>
      <CommentAction key="comment-action" onClick={onCommentClick} isMobile={isMobile} />
      </div>
      <div className={isMobile ? "flex-shrink-0" : ""}>
      <ShareAction key="share-action" thumbnailUrl={project.coverUrl} title={project.name} isMobile={isMobile} />
      </div>
      <div className={isMobile ? "flex-shrink-0" : ""}>
      <QrCodeAction key="qrcode-action" qrImageUrl={project.qrImageUrl} title={project.name} thumbnailUrl={project.coverUrl} isMobile={isMobile} qrCodeEnabled={project.qrCodeEnabled} />
      </div>
      <div className={isMobile ? "flex-shrink-0" : ""}>
      <LiveDemoAction key="livedemo-action" url={liveUrl} isMobile={isMobile} />
      </div>
    </aside>
  );
}
