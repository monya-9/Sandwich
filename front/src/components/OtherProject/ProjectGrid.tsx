import React from "react";

type Work = {
  id: number;
  title: string;
  thumbUrl: string;
};

type Props = {
  works: Work[];
  onProfileDetail?: () => void;
};

export default function ProjectGrid({ works, onProfileDetail }: Props) {
  return (
    <div>
      <div className="flex justify-end items-center mb-6">
        <button className="text-gray-500 text-base hover:underline flex items-center gap-1" onClick={onProfileDetail}>
          프로필 자세히 보기
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
            <path d="M10 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-4 gap-6">
        {works.map((work) => (
          <div
            key={work.id}
            className="aspect-[1/1] bg-black rounded-2xl flex items-end justify-start text-white text-lg font-bold relative overflow-hidden cursor-pointer"
            style={{
              backgroundImage: `url(${work.thumbUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="p-4 bg-gradient-to-t from-black/80 to-transparent w-full">
              {work.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
