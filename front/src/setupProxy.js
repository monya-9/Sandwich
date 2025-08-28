// front/src/setupProxy.js
const { createProxyMiddleware } = require("http-proxy-middleware");

const target = process.env.REACT_APP_API_BASE || "http://localhost:8080";

module.exports = function (app) {
    const proxy = createProxyMiddleware({
        target,
        changeOrigin: true,
        ws: true, // 웹소켓 있으면
    });

    app.use(["/api", "/oauth2", "/ws", "/topic", "/app"], proxy);
};
