import React, { useState, useContext, useEffect } from "react";
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
import { AuthContext } from "../context/AuthContext";
import { useParams } from "react-router-dom";
import { fetchProjectDetail, type ProjectDetailResponse } from "../api/projectApi";

// 실 서비스라면 아래처럼 username을 동적으로 받아오세요
// import { useParams } from "react-router-dom";
// const { username } = useParams<{ username: string }>();

const MAX_WIDTH = 1440;
const PANEL_WIDTH = 440;
const GAP = 25;
const PROJECT_WIDE = 1440;
const PROJECT_NARROW = 1050;
const ACTIONBAR_WIDTH = 80;

export default function OtherProjectPage() {
    const [commentOpen, setCommentOpen] = useState(false);
    const projectWidth = commentOpen ? PROJECT_NARROW : PROJECT_WIDE;
    const { isLoggedIn } = useContext(AuthContext);

    // 경로 파라미터에서 실제 ownerId / projectId 수신
    const { ownerId: ownerIdParam, projectId: projectIdParam } = useParams<{ ownerId?: string; projectId?: string }>();
    const ownerId = ownerIdParam ? Number(ownerIdParam) : undefined;
    const projectId = projectIdParam ? Number(projectIdParam) : undefined;

    const [projectDetail, setProjectDetail] = useState<ProjectDetailResponse | null>(null);

    useEffect(() => {
        if (ownerId && projectId) {
            fetchProjectDetail(ownerId, projectId).then(setProjectDetail).catch(() => {
                // 실패 시에도 페이지는 동작하도록 무시
            });
        }
    }, [ownerId, projectId]);

    // ✅ 실제 프로젝트 API 응답이라고 가정 (데모 기본값 + 파라미터 우선 적용)
    const project = {
        qrImageUrl: projectDetail?.qrImageUrl ?? "https://your-bucket.s3.amazonaws.com/qr/sample.png",
        username: "sampleuser", // 실제 서비스에서는 동적으로!
        id: projectId ?? 123, // 파라미터 없으면 데모 값
        name: projectDetail?.title ?? "프로젝트 이름",
        owner: "사용자 이름",
        category: "UI·UX",
        ownerId: ownerId ?? 0, // 파라미터 없으면 0 (팔로우 대상 없음)
        shareUrl: projectDetail?.shareUrl,
        coverUrl: projectDetail?.coverUrl,
    };

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
                                projectName={project.name}
                                userName={project.owner}
                                intro="프로젝트 한줄 소개"
                                ownerId={project.ownerId}
                            />
                            <div className="mb-6">
                                <ProjectThumbnail imgUrl={project.coverUrl || QueenImg} />
                            </div>
                            <TagList tags={["포트폴리오", "프론트엔드", "백엔드", "알고리즘", "디자인"]} />
                            <div className="mb-8">
                                <ProjectStatsBox
                                    likes={286}
                                    collections={5}
                                    views={286}
                                    comments={12}
                                    projectName={project.name}
                                    date="2025.5.11"
                                    category={project.category}
                                />
                            </div>
                            <UserProfileBox userName={project.owner} ownerId={project.ownerId} />
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
                                    position: "relative",
                                }}
                            >
                                <ActionBar
                                    onCommentClick={() => setCommentOpen(true)}
                                    project={project} // ✅ QR 코드 URL 전달 + ownerId 전달
                                />
                            </div>
                        )}
                    </div>

                    {/* 댓글 패널 */}
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
                                username={project.username}   // ⭐️ username 반드시 전달!
                                projectId={project.id}
                                projectName={project.name}
                                category={project.category}
                                width={PANEL_WIDTH}
                                isLoggedIn={isLoggedIn} // AuthContext에서 로그인 상태 가져오기
                            />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}