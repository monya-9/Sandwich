import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

import MainPage from './pages/MainPage';
import JoinPage from './pages/Auth/JoinPage';
import LoginPage from './pages/Auth/LoginPage';

import OAuthSuccessHandler from './components/Auth/OAuth/OAuthSuccessHandler';
import OAuthErrorHandler from './components/Auth/OAuth/OAuthErrorHandler';
import ProfileStep from './components/Auth/OAuth/ProfileStep';

import { AuthProvider } from './context/AuthContext';

// 기존 페이지들 유지
import OtherProjectPage from './pages/OtherProjectPage';
import ProjectForm from './components/ProjectManage/ProjectForm';

function App() {
    return (
        <GoogleOAuthProvider clientId="1009231740163-6ccfojs5atbc5g7dqjsevl1m5uolrhhb.apps.googleusercontent.com">
            <AuthProvider>
                <BrowserRouter>
                    <div className="App">
                        <Routes>
                            <Route path="/" element={<MainPage />} />
                            <Route path="/join" element={<JoinPage />} />
                            <Route path="/login" element={<LoginPage />} />

                            {/* OAuth 결과 핸들러 */}
                            <Route path="/oauth2/success" element={<OAuthSuccessHandler />} />
                            <Route path="/oauth2/error" element={<OAuthErrorHandler />} />

                            {/* 추가정보 입력 스텝 */}
                            <Route path="/oauth/profile-step" element={<ProfileStep />} />

                            {/* 기존 라우트 유지 */}
                            <Route path="/other-project" element={<OtherProjectPage />} />
                            <Route path="/other-project/:ownerId/:projectId" element={<OtherProjectPage />} />
                            <Route path="/project/new" element={<ProjectForm />} />
                        </Routes>
                    </div>
                </BrowserRouter>
            </AuthProvider>
        </GoogleOAuthProvider>
    );
}

export default App;
