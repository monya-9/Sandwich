// src/setupProxy.js
const { createProxyMiddleware } = require("http-proxy-middleware");
const target = process.env.REACT_APP_API_BASE || "http://localhost:8080";

module.exports = function (app) {
    const proxy = createProxyMiddleware({
        target,
        changeOrigin: true,
    });
    
    app.use(["/api", "/oauth2/authorization", "/login/oauth2"], proxy);
};