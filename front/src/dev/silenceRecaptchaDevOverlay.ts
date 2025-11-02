// 개발모드 전용: /join, /login 에서 dev 에러 오버레이를 숨기고,
// reCAPTCHA 관련 noisy 에러(Timeout/execute/verify/style)는 전역에서 무음 처리한다.

if (process.env.NODE_ENV !== "production") {
    /* ===== 경로 제한: 여기 나열된 경로에선 오버레이 DOM 자체를 숨긴다 ===== */
    const AUTH_PATHS = [/^\/join\b/, /^\/login\b/];
    const onAuthPath = () => AUTH_PATHS.some((rx) => rx.test(window.location.pathname));

    // 오버레이 DOM 숨김 (웹팩/CRA/바이트 등 다 커버)
    const hideOverlayDom = () => {
        const selectors = [
            "#webpack-dev-server-client-overlay", // webpack dev overlay
            "vite-error-overlay",                 // vite overlay
            "iframe#react-error-overlay",         // react-error-overlay (버전에 따라 다름)
            "iframe#react-dev-overlay",
        ];
        for (const sel of selectors) {
            document.querySelectorAll(sel).forEach((el) => {
                const anyEl = el as HTMLElement;
                try {
                    anyEl.style.setProperty("display", "none", "important");
                    anyEl.setAttribute("aria-hidden", "true");
                    // iframe 내부도 시도
                    if (anyEl.tagName === "IFRAME") {
                        const ifr = anyEl as HTMLIFrameElement;
                        (ifr.contentDocument?.documentElement as HTMLElement | null)?.style?.setProperty(
                            "display",
                            "none",
                            "important"
                        );
                    }
                } catch {}
            });
        }
    };

    // DOM에 오버레이가 추가되면 즉시 숨기기
    const mo = new MutationObserver(() => {
        if (onAuthPath()) hideOverlayDom();
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });

    // 처음 진입 시 한 번 숨김 시도
    if (onAuthPath()) hideOverlayDom();

    // 라우팅으로 path가 바뀔 수 있으니 주기적으로도 가볍게 시도(부하 매우 작음)
    const interval = window.setInterval(() => {
        if (onAuthPath()) hideOverlayDom();
    }, 500);
    window.addEventListener("beforeunload", () => clearInterval(interval));

    /* ===== reCAPTCHA 노이즈(Timeout/execute/verify/style)만 조용히 무시 ===== */
    const isRecaptchaNoise = (msg?: unknown, src?: unknown) => {
        const text = String(msg ?? "");
        const source = String(src ?? "");
        const fromRecaptcha = /recaptcha|grecaptcha|gstatic\.com\/recaptcha/i.test(text + source);
        const noisyOnly = /timeout|execute|verify|style/i.test(text); // 시끄러운 패턴만
        return fromRecaptcha && noisyOnly;
    };

    // /join·/login 에서 발생하는 "Uncaught (in promise) Timeout" 같은 일반 타임아웃도 조용히
    const isAuthTimeoutNoise = (msg?: unknown) => {
        return onAuthPath() && /timeout/i.test(String(msg ?? ""));
    };

    // SockJS WebSocket 연결 과정의 노이즈 에러 무시
    const isWebSocketNoise = (msg?: unknown, src?: unknown) => {
        const text = String(msg ?? "");
        const source = String(src ?? "");
        const combined = text + source;
        // SockJS가 폴백 전송 방식을 시도할 때 발생하는 정상적인 에러들
        const wsNoisePatterns = [
            /Invalid frame header/i,
            /WebSocket is closed before the connection is established/i,
            /WebSocket connection to 'ws:\/\/localhost:3000/i,
            /WebSocket connection to.*localhost:3000.*stomp/i,  // SockJS 세션 경로 (/stomp/342/.../websocket)
            /WebSocketClient\.js/i,
            /websocket\.js/i,
            /socket\.js/i,  // SockJS 내부 소켓 파일
            /WebSocket connection.*failed/i,
            /ws:\/\/localhost:3000\/ws/i,  // 직접 ws://localhost:3000/ws 시도
            /WebSocketTransport/i,  // SockJS WebSocketTransport 관련
        ];
        return wsNoisePatterns.some(pattern => pattern.test(combined));
    };

    // 원본 console.error/warn 백업
    const originalConsoleError = console.error.bind(console);
    const originalConsoleWarn = console.warn.bind(console);

    // console.error/warn 오버라이드하여 WebSocket 노이즈 필터링
    console.error = (...args: any[]) => {
        const msg = args.map(a => String(a)).join(" ");
        const src = args.map(a => a?.stack || String(a)).join(" ");
        if (!isWebSocketNoise(msg, src)) {
            originalConsoleError(...args);
        }
        // WebSocket 노이즈는 완전히 무시
    };

    console.warn = (...args: any[]) => {
        const msg = args.map(a => String(a)).join(" ");
        const src = args.map(a => a?.stack || String(a)).join(" ");
        if (!isWebSocketNoise(msg, src)) {
            originalConsoleWarn(...args);
        }
        // WebSocket 노이즈는 완전히 무시
    };

    window.addEventListener("unhandledrejection", (ev) => {
        const reason: any = ev.reason;
        const msg = reason?.message ?? reason;
        const src = reason?.stack ?? "";
        if (isRecaptchaNoise(msg, src) || isAuthTimeoutNoise(msg) || isWebSocketNoise(msg, src)) {
            ev.preventDefault();
            // 개발 중 콘솔 로그만 남김(오버레이는 차단)
            // WebSocket 에러는 완전히 무시 (로그도 출력하지 않음)
            if (!isWebSocketNoise(msg, src)) {
                originalConsoleWarn("[silenced dev error]", msg);
            }
        }
    });

    window.addEventListener("error", (ev) => {
        const msg = ev.message;
        const src = (ev as any).filename ?? ev?.error?.stack ?? "";
        if (isRecaptchaNoise(msg, src) || isAuthTimeoutNoise(msg) || isWebSocketNoise(msg, src)) {
            ev.preventDefault();
            // WebSocket 에러는 완전히 무시 (로그도 출력하지 않음)
            if (!isWebSocketNoise(msg, src)) {
                originalConsoleWarn("[silenced dev error]", msg);
            }
        }
    });
}

// 이 한 줄로 isolatedModules 오류 방지
export {};
