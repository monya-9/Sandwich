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
import ProjectMangeSampleForm from "./components/ProjectMangeSample/ProjectMangeSampleForm";
import MessagesPage from "./pages/Messages/MessagesPage";
import NotificationsPage from "./pages/NotificationsPage";

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
import CareerDetailsPage from "./components/Profile/CareerDetailsPage";
import CodeSubmitPage from "./pages/challenge/CodeSubmitPage";
import PortfolioSubmitPage from "./pages/challenge/PortfolioSubmitPage";
import CodeEditPage from "./pages/challenge/CodeEditPage";
import CodeSubmissionListPage from "./pages/challenge/CodeSubmissionListPage";
import PortfolioVotePage from "./pages/challenge/PortfolioVotePage";
import PortfolioProjectDetailPage from "./pages/challenge/PortfolioProjectDetailPage";
import CodeSubmissionDetailPage from "./pages/challenge/CodeSubmissionDetailPage";
import NotFoundPage from "./pages/NotFoundPage";
import UserPublicProfilePage from "./pages/UserPublicProfilePage";
import ProjectFeedPage from "./pages/ProjectFeedPage";
import AccountSearchPage from "./pages/AccountSearchPage";
import ProjectDetailLightboxPage from "./pages/ProjectDetailLightboxPage";
import CollectionDetailPage from "./pages/CollectionDetailPage";
import PublicCollectionDetailPage from "./pages/PublicCollectionDetailPage";
import RequireAdmin from "./components/Auth/RequireAdmin";
import ChallengeFormPage from "./pages/admin/ChallengeFormPage";
import ChallengeEditSinglePage from "./pages/admin/ChallengeEditSinglePage";
import ChallengeEditCodePage from "./pages/admin/ChallengeEditCodePage";
import ChallengeEditPortfolioPage from "./pages/admin/ChallengeEditPortfolioPage";
import ChallengeManagePage from "./pages/admin/ChallengeManagePage";
import SecurityOtpHistoryPage from "./pages/admin/SecurityOtpHistoryPage";
import SecurityDeviceManagePage from "./pages/admin/SecurityDeviceManagePage";
import DeviceManagePage from "./pages/mypage/DeviceManagePage";
import AccountDeletionPage from "./pages/mypage/AccountDeletionPage";

// ✅ 추가 2) 모듈 로드 시 1회 활성화 (컴포넌트 바깥)
enableRecaptchaV3OnPaths({
    "/auth/signup": "signup",

});


/** /rooms/:id -> /messages/:id (v6 안전 리다이렉트) */
function RoomToMessagesRedirect() {
    const { id } = useParams();
    const to = id ? `/messages/${id}` : "/messages";
    return <Navigate to={to} replace />;
}

/** /:ownerId/:projectId -> /other-project/:ownerId/:projectId 리다이렉트 */
function RootProjectToOtherRedirect() {
    const { ownerId, projectId } = useParams();
    const to = ownerId && projectId ? `/other-project/${ownerId}/${projectId}` : "/search";
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
                                {/* Notefolio 스타일 상세 경로 */}
                                <Route path=":ownerId/:projectId" element={<RootProjectToOtherRedirect />} />
                                

                                {/* 신규/편집 업로드 경로 */}
                                <Route path="/project/edit" element={<ProjectMangeSampleForm />} />
                                <Route path="/project/edit/:ownerId/:projectId" element={<ProjectMangeSampleForm />} />

                                {/* 레거시/샘플 경로(유지 필요 시) */}
                                <Route path="other-project" element={<Navigate to="/search" replace />} />
                                <Route path="other-project/:ownerId/:projectId" element={<OtherProjectPage />} />
                                <Route path="l/:ownerId/:projectId" element={<ProjectDetailLightboxPage />} />
                                <Route path="search" element={<ProjectFeedPage />} />
                                <Route path="search/accounts" element={<AccountSearchPage />} />
                                
                                <Route path="/messages" element={<MessagesPage />} />
                                <Route path="/messages/:id" element={<MessagesPage />} />
                                <Route path="/notifications" element={<NotificationsPage />} />

                                <Route path="/rooms/:id" element={<RoomToMessagesRedirect />} />
                                <Route path="/rooms" element={<Navigate to="/messages" replace />} />

                                <Route path="/mypage" element={<MyPageSettingPage />} />
                                <Route path="/mypage/career" element={<CareerSettingPage />} />
                                <Route path="/mypage/notifications" element={<NotificationSettingPage />} />
                                <Route path="/mypage/push" element={<PushSettingPage />} />
                                <Route path="/mypage/devices" element={<DeviceManagePage />} />
                                <Route path="/mypage/account-deletion" element={<AccountDeletionPage />} />

                                {/* 프로필 페이지 */}
                                <Route path="/profile" element={<ProfilePage />} />
                                <Route path="/profile/work" element={<ProfilePage />} />
                                <Route path="/profile/likes" element={<ProfilePage />} />
                                <Route path="/profile/collections" element={<ProfilePage />} />
                                <Route path="/collections/:id" element={<CollectionDetailPage />} />
                                {/* 타인 프로필용 공개 컬렉션 상세 */}
                                <Route path="/users/:userId/collections/:id" element={<PublicCollectionDetailPage />} />
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
                                <Route path="/challenge/portfolio/:id/projects/:projectId" element={<PortfolioProjectDetailPage />} />
                                <Route path="/challenge/code/:id/submissions/:submissionId" element={<CodeSubmissionDetailPage />} />

                                {/* (예시) 코드 제출 수정 */}
                                <Route path="/challenge/code/:id/edit/:submissionId" element={<CodeEditPage />} />

                                {/* 공개 사용자 프로필 */}
                                <Route path="/users/:id" element={<UserPublicProfilePage />} />

                                {/* ✅ 어드민 보호 라우트: ROLE_ADMIN 아닐 시 전체 차단 및 리다이렉트 */}
                                <Route path="/admin/*" element={<RequireAdmin />}> 
                                    <Route path="challenges" element={<ChallengeManagePage />} />
                                    <Route path="challenges/new" element={<ChallengeFormPage />} />
                                    {/* 단일 수정 라우트: /admin/challenges/:id */}
                                    <Route path="challenges/:id" element={<ChallengeEditSinglePage />} />
                                    {/* 유형별 수정 경로(각 타입 전용 페이지가 필요하면 아래 두 줄을 별도 페이지로 분리 가능) */}
                                    <Route path="challenge/code/:id/edit" element={<ChallengeEditCodePage />} />
                                    <Route path="challenge/portfolio/:id/edit" element={<ChallengeEditPortfolioPage />} />
                                    {/* 보안 ▸ OTP 이력 */}
                                    <Route path="security/otp" element={<SecurityOtpHistoryPage />} />
                                    {/* 보안 ▸ 사용자 관리(관리자 전용: 특정 사용자 전체 무효화) */}
                                    <Route path="security/devices" element={<SecurityDeviceManagePage />} />
                                </Route>
                            </Route>

                            <Route path="join" element={<JoinPage />} />
                            <Route path="login" element={<LoginPage />} />
                            <Route path="/oauth2/success" element={<OAuthSuccessHandler />} />
                            <Route path="/oauth2/error" element={<OAuthErrorHandler />} />
                            <Route path="/oauth/profile-step" element={<ProfileStep />} />

                            <Route path="*" element={<NotFoundPage />} />
                        </Routes>
                    </BrowserRouter>
                </MessagesProvider>
            </AuthProvider>
        </GoogleOAuthProvider>
    );
}

export default App;
