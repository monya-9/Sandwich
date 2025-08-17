import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import AppLayout from "./layouts/AppLayout";
import MainPage from './pages/MainPage';
import JoinPage from './pages/Auth/JoinPage';
import LoginPage from "./pages/Auth/LoginPage";
import OAuthSuccessHandler from "./components/Auth/OAuth/OAuthSuccessHandler";
import OAuthErrorHandler from "./components/Auth/OAuth/OAuthErrorHandler";
import { AuthProvider } from './context/AuthContext';
import ProfileStep from "./components/Auth/OAuth/ProfileStep";
import MessagesPage from './pages/Messages/MessagesPage';

function App() {
    return (
        <GoogleOAuthProvider clientId="1009231740163-6ccfojs5atbc5g7dqjsevl1m5uolrhhb.apps.googleusercontent.com">
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        {/* ✅ 공통 레이아웃(헤더 포함) */}
                        <Route element={<AppLayout />}>
                            <Route index element={<MainPage />} />
                            <Route path="/messages" element={<MessagesPage />} />
                            <Route path="/messages/:id" element={<MessagesPage />} />
                        </Route>

                        {/* ✅ 레이아웃 제외(헤더 없음) */}
                        <Route path="/join" element={<JoinPage />} />
                        <Route path="/login" element={<LoginPage />} />
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
