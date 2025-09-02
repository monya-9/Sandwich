// src/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

import { AuthProvider } from "./context/AuthContext";
import AppLayout from "./layouts/AppLayout";

// 페이지
import MainPage from "./pages/MainPage";
import JoinPage from "./pages/Auth/JoinPage";
import LoginPage from "./pages/Auth/LoginPage";
import OtherProjectPage from "./pages/OtherProjectPage";
import ProjectForm from "./components/ProjectManage/ProjectForm";
import ProjectMangeSampleForm from "./components/ProjectMangeSample/ProjectMangeSampleForm";

// OAuth 콜백/스텝(레이아웃 없이)
import OAuthSuccessHandler from "./components/Auth/OAuth/OAuthSuccessHandler";
import OAuthErrorHandler from "./components/Auth/OAuth/OAuthErrorHandler";
import ProfileStep from "./components/Auth/OAuth/ProfileStep";
import MessagesPage from "./pages/Messages/MessagesPage";
import MyPageSettingPage from "./components/MyPageSetting/MyPageSettingPage";
import CareerSettingPage from "./components/MyPageSetting/CareerSettingPage";
import NotificationSettingPage from "./components/MyPageSetting/NotificationSettingPage";
import PushSettingPage from "./components/MyPageSetting/PushSettingPage";

/** /rooms/:id -> /messages/:id 안전 리다이렉트(v6) */
function RoomToMessagesRedirect() {
    const { id } = useParams();
    const to = id ? `/messages/${id}` : "/messages";
    return <Navigate to={to} replace />;
}

function App() {
    return (
        <GoogleOAuthProvider clientId="1009231740163-6ccfojs5atbc5g7dqjsevl1m5uolrhhb.apps.googleusercontent.com">
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        {/* ✅ 공통 레이아웃 (Header + spacer + <Outlet/>) */}
                        <Route element={<AppLayout />}>
                            <Route index element={<MainPage />} />

                            <Route path="other-project" element={<OtherProjectPage />} />
                            <Route path="other-project/:ownerId/:projectId" element={<OtherProjectPage />} />
                            <Route path="project/new" element={<ProjectForm />} />

                            {/* 메시지 */}
                            <Route path="/messages" element={<MessagesPage />} />
                            <Route path="/messages/:id" element={<MessagesPage />} />

                            {/* ✅ 마이페이지 섹션 */}
                            <Route path="/mypage" element={<MyPageSettingPage />} />
                            <Route path="/mypage/career" element={<CareerSettingPage />} />
                            <Route path="/mypage/notifications" element={<NotificationSettingPage />} />
                            <Route path="/mypage/push" element={<PushSettingPage />} />

                            {/* ✅ 구경로 호환: /rooms/:id → /messages/:id */}
                            <Route path="/rooms/:id" element={<RoomToMessagesRedirect />} />
                        </Route>

                        {/* ✅ 레이아웃 없이 단독 라우트 */}
                        <Route path="join" element={<JoinPage />} />
                        <Route path="login" element={<LoginPage />} />
                        <Route path="/oauth2/success" element={<OAuthSuccessHandler />} />
                        <Route path="/oauth2/error" element={<OAuthErrorHandler />} />
                        <Route path="/oauth/profile-step" element={<ProfileStep />} />
                        <Route path="project/sample" element={<ProjectMangeSampleForm />} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </GoogleOAuthProvider>
    );
}

export default App;
