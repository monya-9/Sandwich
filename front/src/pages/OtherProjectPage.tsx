import React, { useState } from "react";
import Header from "../components/Main/Header";
import ActionBar from "../components/OtherProject/ActionBar/ActionBar";
import ProjectTopInfo from "../components/OtherProject/ProjectTopInfo";
import ProjectThumbnail from "../components/OtherProject/ProjectThumbnail";
import TagList from "../components/OtherProject/TagList";
import ProjectStatsBox from "../components/OtherProject/ProjectStatsBox";
import UserProfileBox from "../components/OtherProject/UserProfileBox";
import ProjectGrid from "../components/OtherProject/ProjectGrid";
import CommentPanel from "../components/OtherProject/ActionBar/CommentPanel";
import QueenImg from "../assets/images/Queen.jpg";

const MAX_WIDTH = 1440;
const PANEL_WIDTH = 440;
const GAP = 25;
const PROJECT_WIDE = 1440;
const PROJECT_NARROW = 1050;
const ACTIONBAR_WIDTH = 80;

export default function OtherProjectPage() {
  const [commentOpen, setCommentOpen] = useState(false);

  const projectWidth = commentOpen ? PROJECT_NARROW : PROJECT_WIDE;

  return (
    <div className="min-h-screen w-full bg-[#6c7178] font-gmarketsans">
      <Header />
      <main className="w-full flex justify-center min-h-[calc(100vh-64px)] py-12">
        {/* 중앙 컨테이너 */}
        <div
          className="flex flex-row items-start w-full relative"
          style={{ maxWidth: MAX_WIDTH }}
        >
          {/* 프로젝트 + 액션바 랩퍼 */}
          <div className="flex flex-row items-start">
            {/* 프로젝트 패널 */}
            <section
              className="bg-white rounded-2xl shadow-2xl px-8 py-8 transition-all duration-300"
              style={{
                width: projectWidth,
                minWidth: 360,
                maxWidth: PROJECT_WIDE,
                marginRight: 0,
                transition: "all 0.4s cubic-bezier(.62,.01,.3,1)",
                boxShadow: "0 8px 32px 0 rgba(34,34,34,.16)",
              }}
            >
              <ProjectTopInfo
                projectName="프로젝트 이름"
                userName="사용자 이름"
                intro="프로젝트 한줄 소개"
              />
              <div className="mb-6">
                <ProjectThumbnail imgUrl={QueenImg} />
              </div>
              <TagList tags={["포트폴리오", "프론트엔드", "백엔드", "알고리즘", "디자인"]} />
              <div className="mb-8">
                <ProjectStatsBox
                  likes={286}
                  collections={5}
                  views={286}
                  comments={12}
                  projectName="프로젝트 이름"
                  date="2025.5.11"
                  category="UI/UX"
                />
              </div>
              <UserProfileBox userName="사용자 이름" />
              <ProjectGrid
                works={[
                  { id: 1, title: "작업 1", thumbUrl: "/work-thumb1.jpg" },
                  { id: 2, title: "작업 2", thumbUrl: "/work-thumb2.jpg" },
                  { id: 3, title: "작업 3", thumbUrl: "/work-thumb3.jpg" },
                  { id: 4, title: "작업 4", thumbUrl: "/work-thumb4.jpg" },
                ]}
              />
            </section>

            {/* 항상 프로젝트 '옆'에 고정된 액션바 */}
            {!commentOpen && (
              <div
                className="hidden lg:flex flex-col"
                style={{
                  width: ACTIONBAR_WIDTH,
                  minWidth: ACTIONBAR_WIDTH,
                  marginLeft: GAP,
                  height: "100%",
                  position: "relative", // 절대 고정X, 프로젝트에 붙여서!
                }}
              >
                <ActionBar onCommentClick={() => setCommentOpen(true)} />
              </div>
            )}
          </div>

          {/* 댓글 패널: 프로젝트 옆에 딱 붙게 */}
          {commentOpen && (
            <div
              style={{
                width: PANEL_WIDTH,
                minWidth: PANEL_WIDTH,
                maxWidth: PANEL_WIDTH,
                borderRadius: "24px",
                boxShadow: "0 8px 32px 0 rgba(34,34,34,.14)",
                borderLeft: "1px solid #eee",
                background: "white",
                overflow: "hidden",
                marginLeft: GAP,
                height: "100%",
                transition: "all 0.4s cubic-bezier(.62,.01,.3,1)",
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
              }}
            >
              <CommentPanel
                onClose={() => setCommentOpen(false)}
                projectName="사용자 이름"
                category="UI·UX"
                width={PANEL_WIDTH}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
