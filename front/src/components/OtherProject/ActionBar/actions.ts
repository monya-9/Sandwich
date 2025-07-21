import {
  FaHeart, FaUser, FaCommentDots, FaCommentAlt, FaShareAlt, FaQrcode, FaLink
} from "react-icons/fa";
import { FaFolderMinus } from "react-icons/fa6";

export const actions = [
  { label: "프로필", key: "profile", icon: FaUser },
  { label: "제안하기", key: "suggest", icon: FaCommentDots },
  { label: "좋아요", key: "like", icon: FaHeart },
  { label: "컬렉션", key: "collection", icon: FaFolderMinus },
  { label: "댓글", key: "comment", icon: FaCommentAlt },
  { label: "공유하기", key: "share", icon: FaShareAlt },
  { label: "QR코드", key: "qrcode", icon: FaQrcode },
  { label: "라이브\n데모링크", key: "livedemo", icon: FaLink },
];
export type ActionKey = typeof actions[number]["key"];
