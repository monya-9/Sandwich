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
    username: string;
    name: string;
    owner: string;
    category: string;
  };
}

export default function ActionBar({ onCommentClick, project }: ActionBarProps) {
  return (
    <aside className="flex flex-col items-center gap-4">
      <ProfileAction />
      <SuggestAction />
      <LikeAction targetType="PROJECT" targetId={project.id} />
      <CollectionAction />
      <CommentAction onClick={onCommentClick} />
      <ShareAction />
      {/* ✅ QR 코드 액션에 project의 qrImageUrl 전달 */}
      <QrCodeAction qrImageUrl={project.qrImageUrl} />
      <LiveDemoAction />
    </aside>
  );
}
