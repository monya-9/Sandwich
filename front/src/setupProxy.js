// src/setupProxy.js
const { createProxyMiddleware } = require("http-proxy-middleware");

const target = process.env.REACT_APP_API_BASE || "http://localhost:8080";

/**
 * 주의:
 * - 프런트(클라이언트)는 무조건 "/stomp" 로만 STOMP/SockJS 접속
 * - 프록시가 "/stomp" 를 백엔드 "/ws" 로만 리라이트 (dev HMR 의 /ws 와 충돌 방지)
 * - REST 프록시는 ws 업그레이드 끔(ws:false)
 */
module.exports = function (app) {
    // 개발서버 내부 소켓 경로는 건드리지 않기 (HMR)
    app.use((req, res, next) => {
        if (req.url.startsWith("/ws") || req.url.startsWith("/sockjs-node")) return next();
        return next();
    });

    // REST & OAuth
    app.use(
        ["/api", "/oauth2/authorization", "/login/oauth2"],
        createProxyMiddleware({
            target,
            changeOrigin: true,
            ws: false,          // ← REST 쪽은 WS 업그레이드 비활성화
            logLevel: "warn",
        })
    );

    // SockJS/STOMP 전용 프록시
    app.use(
        "/stomp",
        createProxyMiddleware({
            target,
            changeOrigin: true,
            ws: true,           // ← 소켓 업그레이드 허용
            pathRewrite: { "^/stomp": "/ws" }, // 백엔드 엔드포인트가 /ws 라는 가정
            logLevel: "warn",
            // 끊김 시 write-after-end 노이즈 줄이기 위한 타임아웃/에러 처리
            proxyTimeout: 30_000,
            timeout: 30_000,
            onError(err, req, res) {
                try {
                    res.writeHead(502, { "Content-Type": "text/plain" });
                    res.end("WebSocket proxy error");
                } catch {
                    // ignore
                }
            },
            // 필요 시 헤더/쿠키 조정 가능
            onProxyReqWs(proxyReq /* , req, socket */) {
                // 예: 뒤단에서 Origin 체크가 까다로우면 아래처럼 맞춰 줄 수 있음
                // proxyReq.setHeader("Origin", target);
            },
        })
    );
};
