// front/src/App.tsx
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

import { AuthProvider } from "./context/AuthContext";
import { MessagesProvider } from "./context/MessagesContext";
import AppLayout from "./layouts/AppLayout";

// 페이지
import MainPage from "./pages/MainPage";
import JoinPage from "./pages/Auth/JoinPage";
import LoginPage from "./pages/Auth/LoginPage";
import OtherProjectPage from "./pages/OtherProjectPage";
import ProjectForm from "./components/ProjectManage/ProjectForm";
import ProjectMangeSampleForm from "./components/ProjectMangeSample/ProjectMangeSampleForm";
import MessagesPage from "./pages/Messages/MessagesPage";

// 마이페이지
import MyPageSettingPage from "./components/MyPageSetting/MyPageSettingPage";
import CareerSettingPage from "./components/MyPageSetting/CareerSettingPage";
import NotificationSettingPage from "./components/MyPageSetting/NotificationSettingPage";
import PushSettingPage from "./components/MyPageSetting/PushSettingPage";

// 챌린지
import ChallengeListPage from "./pages/challenge/ChallengeListPage";
import ChallengeDetailPage from "./pages/challenge/ChallengeDetailPage";


// OAuth 콜백/스텝
import OAuthSuccessHandler from "./components/Auth/OAuth/OAuthSuccessHandler";
import OAuthErrorHandler from "./components/Auth/OAuth/OAuthErrorHandler";
import ProfileStep from "./components/Auth/OAuth/ProfileStep";

// ✅ 모든 import를 최상단으로
import { initFCM } from "./lib/fcm";
import { enableRecaptchaV3OnPaths } from "./api/axiosInstance";
import ProfilePage from "./components/Profile/ProfilePage";
import WorkTab from "./components/Profile/WorkTab";
import LikesTab from "./components/Profile/LikesTab";
import CollectionsTab from "./components/Profile/CollectionsTab";
import DraftsTab from "./components/Profile/DraftsTab";
import CareerDetailsPage from "./components/Profile/CareerDetailsPage";
import CodeSubmitPage from "./pages/challenge/CodeSubmitPage";
import PortfolioSubmitPage from "./pages/challenge/PortfolioSubmitPage";
import CodeEditPage from "./pages/challenge/CodeEditPage";
import CodeSubmissionListPage from "./pages/challenge/CodeSubmissionListPage";
import PortfolioVotePage from "./pages/challenge/PortfolioVotePage";
import PortfolioProjectDetailPage from "./pages/challenge/PortfolioProjectDetailPage";
import CodeSubmissionDetailPage from "./pages/challenge/CodeSubmissionDetailPage";

// ✅ 추가 2) 모듈 로드 시 1회 활성화 (컴포넌트 바깥)
enableRecaptchaV3OnPaths({
    "/auth/signup": "signup",
    // 필요하면 닉네임 중복 같은 경로도: "/users/check-nickname": "check_nickname"
});


/** /rooms/:id -> /messages/:id (v6 안전 리다이렉트) */
function RoomToMessagesRedirect() {
    const { id } = useParams();
    const to = id ? `/messages/${id}` : "/messages";
    return <Navigate to={to} replace />;
}

function App() {
    useEffect(() => {
        initFCM(); // 앱 시작 시 1회
    }, []);

    return (
        <GoogleOAuthProvider clientId="1009231740163-6ccfojs5atbc5g7dqjsevl1m5uolrhhb.apps.googleusercontent.com">
            <AuthProvider>
                <MessagesProvider>
                    <BrowserRouter>
                        <Routes>
                            <Route element={<AppLayout />}>
                                <Route index element={<MainPage />} />
                                <Route path="other-project" element={<OtherProjectPage />} />
                                <Route path="other-project/:ownerId/:projectId" element={<OtherProjectPage />} />
                                <Route path="project/new" element={<ProjectForm />} />

                                <Route path="/messages" element={<MessagesPage />} />
                                <Route path="/messages/:id" element={<MessagesPage />} />

                                <Route path="/rooms/:id" element={<RoomToMessagesRedirect />} />
                                <Route path="/rooms" element={<Navigate to="/messages" replace />} />

                                <Route path="/mypage" element={<MyPageSettingPage />} />
                                <Route path="/mypage/career" element={<CareerSettingPage />} />
                                <Route path="/mypage/notifications" element={<NotificationSettingPage />} />
                                <Route path="/mypage/push" element={<PushSettingPage />} />

                                {/* 프로필 페이지 */}
                                <Route path="/profile" element={<ProfilePage />} />
                                <Route path="/profile/work" element={<ProfilePage />} />
                                <Route path="/profile/likes" element={<ProfilePage />} />
                                <Route path="/profile/collections" element={<ProfilePage />} />
                                <Route path="/profile/drafts" element={<ProfilePage />} />
                                <Route path="/profile/careers" element={<CareerDetailsPage />} />
                                {/* ✅ 챌린지 라우팅 */}
                                <Route path="/challenge" element={<ChallengeListPage />} />
                                <Route path="/challenge/code/:id" element={<ChallengeDetailPage />} />
                                <Route path="/challenge/portfolio/:id" element={<ChallengeDetailPage />} />

                                {/* 제출 */}
                                <Route path="/challenge/code/:id/submit" element={<CodeSubmitPage />} />
                                <Route path="/challenge/portfolio/:id/submit" element={<PortfolioSubmitPage />} />

                                {/* 리스트/투표 등 세부 라우트 */}
                                <Route path="/challenge/code/:id/submissions" element={<CodeSubmissionListPage />} />
                                <Route path="/challenge/portfolio/:id/vote" element={<PortfolioVotePage />} />
                                <Route path="/challenge/portfolio/:id/vote/:projectId" element={<PortfolioProjectDetailPage />} />
                                <Route path="/challenge/code/:id/submissions/:submissionId" element={<CodeSubmissionDetailPage />} />


                                {/* (예시) 코드 제출 수정 */}
                                <Route path="/challenge/code/:id/edit/:submissionId" element={<CodeEditPage />} />
                            </Route>

                            <Route path="join" element={<JoinPage />} />
                            <Route path="login" element={<LoginPage />} />
                            <Route path="/oauth2/success" element={<OAuthSuccessHandler />} />
                            <Route path="/oauth2/error" element={<OAuthErrorHandler />} />
                            <Route path="/oauth/profile-step" element={<ProfileStep />} />
                            <Route path="project/sample" element={<ProjectMangeSampleForm />} />

                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </BrowserRouter>
                </MessagesProvider>
            </AuthProvider>
        </GoogleOAuthProvider>
    );
}

export default App;
