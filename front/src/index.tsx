// src/index.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

// ✅ dev에서만 reCAPTCHA 노이즈 오버레이 무음
if (process.env.NODE_ENV !== "production") {
    import("./dev/silenceRecaptchaDevOverlay");
}

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

reportWebVitals();
