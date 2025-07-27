import React from "react";
import ProfileAction from "./ProfileAction";
import SuggestAction from "./SuggestAction";
import LikeAction from "./LikeAction";
import CollectionAction from "./CollectionAction";
import CommentAction from "./CommentAction";
import ShareAction from "./ShareAction";
import QrCodeAction from "./QrCodeAction";
import LiveDemoAction from "./LiveDemoAction";

// ✅ props 타입에 project 추가
interface ActionBarProps {
  onCommentClick: () => void;
  project: {
    qrImageUrl: string;
  };
}

export default function ActionBar({ onCommentClick, project }: ActionBarProps) {
  return (
    <aside className="flex flex-col items-center gap-4">
      <ProfileAction />
      <SuggestAction />
      <LikeAction />
      <CollectionAction />
      <CommentAction onClick={onCommentClick} />
      <ShareAction />
      {/* ✅ QR 코드 액션에 project의 qrImageUrl 전달 */}
      <QrCodeAction qrImageUrl={project.qrImageUrl} />
      <LiveDemoAction />
    </aside>
  );
}
