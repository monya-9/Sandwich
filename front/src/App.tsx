import React from 'react';
import MainPage from './pages/MainPage';
import OtherProjectPage from "./pages/OtherProjectPage";
import ProjectForm from './components/ProjectManage/ProjectForm';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/other-project" element={<OtherProjectPage />} />
          <Route path="/project/new" element={<ProjectForm />} />
          {/* 필요한 경우 나중에 다른 페이지도 추가 가능 */}
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
