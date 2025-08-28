// src/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

import { AuthProvider } from "./context/AuthContext";
import AppLayout from "./layouts/AppLayout";

// 페이지
import MainPage from "./pages/MainPage";
import JoinPage from "./pages/Auth/JoinPage";
import LoginPage from "./pages/Auth/LoginPage";
import OtherProjectPage from "./pages/OtherProjectPage";
import ProjectForm from "./components/ProjectManage/ProjectForm";

// OAuth 콜백/스텝(레이아웃 없이)
import OAuthSuccessHandler from "./components/Auth/OAuth/OAuthSuccessHandler";
import OAuthErrorHandler from "./components/Auth/OAuth/OAuthErrorHandler";
import ProfileStep from "./components/Auth/OAuth/ProfileStep";
import MessagesPage from "./pages/Messages/MessagesPage";

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
                            <Route path="/messages" element={<MessagesPage />} />
                            <Route path="/messages/:id" element={<MessagesPage />} />
                        </Route>

                        {/* ✅ 레이아웃 없이 단독 라우트 */}
                        <Route path="join" element={<JoinPage />} />
                        <Route path="login" element={<LoginPage />} />
                        <Route path="/oauth2/success" element={<OAuthSuccessHandler />} />
                        <Route path="/oauth2/error" element={<OAuthErrorHandler />} />
                        <Route path="/oauth/profile-step" element={<ProfileStep />} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </GoogleOAuthProvider>
    );
}

export default App;
