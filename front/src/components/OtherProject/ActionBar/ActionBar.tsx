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
}

export default function ActionBar({ onCommentClick }: ActionBarProps) {
  return (
    <aside className="flex flex-col items-center gap-4">
      <ProfileAction />
      <SuggestAction />
      <LikeAction />
      <CollectionAction />
      <CommentAction onClick={onCommentClick} />
      <ShareAction />
      <QrCodeAction />
      <LiveDemoAction />
    </aside>
  );
}
