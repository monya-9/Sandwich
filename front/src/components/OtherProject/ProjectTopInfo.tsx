import React from "react";

type Props = {
  projectName: string;
  userName: string;
  intro: string;
};

export default function ProjectTopInfo({ projectName, userName, intro }: Props) {
  return (
    <div className="w-full flex items-start gap-4 mb-8">
      <div className="w-14 h-14 rounded-full bg-green-600 flex-shrink-0" />
      <div>
        <h1 className="text-2xl font-bold text-black">{projectName}</h1>
        <div className="flex items-center gap-2 text-gray-600 text-base mt-1">
          <span>{userName}</span>
          <span className="font-bold text-green-700 ml-2 cursor-pointer hover:underline">팔로우</span>
        </div>
        <div className="text-gray-500 text-base mt-1">{intro}</div>
      </div>
    </div>
  );
}
