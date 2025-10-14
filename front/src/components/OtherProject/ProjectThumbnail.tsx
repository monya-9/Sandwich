import React from "react";

type Props = { imgUrl: string };

export default function ProjectThumbnail({ imgUrl }: Props) {
  return (
    <div className="w-full aspect-[4/3] overflow-hidden border bg-gray-100 max-w-[1800px] mb-6">
      <img
        src={imgUrl}
        alt="프로젝트 메인 이미지"
        className="object-cover w-full h-full"
      />
    </div>
  );
}
