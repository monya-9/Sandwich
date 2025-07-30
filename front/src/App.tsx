import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import MainPage from './pages/MainPage';
import JoinPage from './pages/Auth/JoinPage';
import LoginPage from "./pages/Auth/LoginPage";
import OAuthSuccessHandler from "./components/Auth/OAuth/OAuthSuccessHandler";
import OAuthErrorHandler from "./components/Auth/OAuth/OAuthErrorHandler";
import { AuthProvider } from './context/AuthContext';
import OtherProjectPage from "./pages/OtherProjectPage";
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
                            <Route path="/oauth2/success" element={<OAuthSuccessHandler />} />
                            <Route path="/oauth2/error" element={<OAuthErrorHandler />} />
                            <Route path="/other-project" element={<OtherProjectPage />} />
                            <Route path="/project/new" element={<ProjectForm />} />
                        </Routes>
                    </div>
                </BrowserRouter>
            </AuthProvider>
        </GoogleOAuthProvider>
    );
}

export default App;
