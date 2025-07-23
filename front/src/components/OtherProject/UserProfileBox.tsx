import React from "react";

type Props = {
  userName: string;
  onFollow?: () => void;
  onSuggest?: () => void;
};

export default function UserProfileBox({
  userName,
  onFollow,
  onSuggest,
}: Props) {
  return (
    <div className="flex flex-col items-center mb-16">
      <div className="w-24 h-24 bg-green-600 rounded-full mb-4" />
      <div className="text-2xl font-bold mb-3">{userName}</div>
      <div className="flex gap-6">
        <button className="bg-white border-2 border-black text-black px-14 py-5 rounded-full text-xl font-bold shadow hover:bg-gray-100 transition" onClick={onFollow}>
          + 팔로우
        </button>
        <button className="bg-cyan-400 text-white px-14 py-5 rounded-full text-xl font-bold shadow hover:bg-cyan-500 transition" onClick={onSuggest}>
          제안하기
        </button>
      </div>
    </div>
  );
}
