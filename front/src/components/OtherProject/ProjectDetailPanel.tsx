import React from "react";
import ProjectTopInfo from "./ProjectTopInfo";
import ProjectThumbnail from "./ProjectThumbnail";
import TagList from "./TagList";
import ProjectStatsBox from "./ProjectStatsBox";
import UserProfileBox from "./UserProfileBox";
import ProjectGrid from "./ProjectGrid";
import { getStaticUrl } from "../../config/staticBase";

// 샘플 props로 전달
export default function ProjectDetailPanel({ isShrink }: { isShrink: boolean }) {
  return (
    <section
      className={`
        transition-all duration-500
        bg-white rounded-2xl shadow-2xl
        px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-12 lg:px-16 lg:py-16
        ${isShrink ? "max-w-[900px] mr-8" : "max-w-[1400px]"}
        w-full
      `}
      style={{
        minWidth: 0,
      }}
    >
      <ProjectTopInfo projectName="프로젝트 이름" userName="사용자 이름" intro="프로젝트 한줄 소개" />
      <div className="-mx-4 sm:-mx-6 md:-mx-10 lg:-mx-16 mb-6">
        <ProjectThumbnail imgUrl={getStaticUrl("assets/images/Queen.jpg")} />
      </div>
      <TagList tags={["포트폴리오", "프론트엔드"]} />
      <div className="-mx-4 sm:-mx-6 md:-mx-10 lg:-mx-16 mb-8">
        <ProjectStatsBox likes={0} views={0} comments={0} projectName="프로젝트 이름" date="2025.5.11" category="UI/UX" projectId={0} />
      </div>
      <UserProfileBox userName="사용자 이름" />
      <ProjectGrid works={[]} />
    </section>
  );
}
