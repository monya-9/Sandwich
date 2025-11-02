// src/index.tsx
// ⚠️ 중요: 에러 필터링은 반드시 모든 다른 import보다 먼저 실행되어야 함
// 새로고침 직후 HMR WebSocket 에러가 즉시 발생하기 때문
import "./dev/silenceRecaptchaDevOverlay";

import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

reportWebVitals();
