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
    // HMR WebSocket (ws://localhost:3000/ws)와 SockJS 관련 에러 모두 필터링
    const isWebSocketNoise = (msg?: unknown, src?: unknown) => {
        const text = String(msg ?? "");
        const source = String(src ?? "");
        // 대소문자 구분 없이 검사 (공백, 줄바꿈, 특수문자 정규화하여 패턴 매칭 강화)
        const combined = (text + " " + source).toLowerCase().replace(/[\s\n\r\t]/g, " ");
        
        // === 1순위: 파일명 기반 필터링 (가장 확실) ===
        // WebSocketClient.js 파일의 모든 에러는 무조건 필터링 (HMR 관련)
        if (/websocketclient|websocketclient\.js/i.test(combined)) {
            return true;
        }
        
        // websocket.js 파일의 모든 에러는 무조건 필터링 (SockJS WebSocket 라이브러리)
        if (/websocket\.js|websocketjs/i.test(combined)) {
            return true;
        }
        
        // socket.js의 initSocket 함수 관련은 무조건 필터링 (HMR WebSocket 초기화)
        if (/socket\.js.*initsocket|initsocket.*socket\.js/i.test(combined)) {
            return true;
        }
        
        // socket.js 파일이 있고 "이 오류 이해하기" 텍스트가 있으면 필터링 (크롬 에러 포맷)
        if (/socket\.js/i.test(combined) && /이오류이해하기|understandthiserror/i.test(combined)) {
            return true;
        }
        
        // === 2순위: 에러 메시지 패턴 ===
        // "Invalid frame header"는 HMR WebSocket 연결 실패 시 나타나는 전형적인 에러
        if (/invalidframeheader|invalid.*frame.*header/i.test(combined)) {
            return true;
        }
        
        // "WebSocket is closed before the connection is established" - SockJS 폴백 과정 에러
        if (/websocketisclosedbeforetheconnectionisestablished|websocket.*closed.*before.*connection/i.test(combined)) {
            return true;
        }
        
        // === 3순위: URL 패턴 ===
        // ws://localhost:3000/ws 는 webpack-dev-server의 HMR WebSocket
        if (/ws:\/\/localhost:3000\/ws|localhost:3000\/ws/i.test(combined)) {
            return true;
        }
        
        // ws://localhost:3000/stomp/* 는 SockJS 세션 경로 (정상적인 폴백 과정)
        if (/ws:\/\/localhost:3000\/stomp\/|localhost:3000\/stomp\//i.test(combined)) {
            return true;
        }
        
        // === 4순위: 에러 메시지 조합 ===
        // "WebSocket connection to ... failed" 패턴
        if (/websocket.*connection.*failed/i.test(combined)) {
            // localhost:3000 또는 ws:// 패턴과 함께 있으면 무조건 필터링
            if (/localhost:3000|ws:\/\//i.test(combined)) {
                return true;
            }
        }
        
        // "WebSocket connection to 'ws://localhost:3000/ws' failed" 전체 패턴
        if (/websocketconnectionto.*ws:\/\/localhost:3000\/ws.*failed/i.test(combined)) {
            return true;
        }
        
        // "WebSocket connection to 'ws://localhost:3000/stomp/...' failed" 패턴
        if (/websocketconnectionto.*ws:\/\/localhost:3000\/stomp.*failed/i.test(combined)) {
            return true;
        }
        
        // === 5순위: 기타 패턴 ===
        const wsNoisePatterns = [
            /websockettransport/i,
            /ws:\/\/localhost:3000\/stomp/i,
            /initsocket.*websocket|websocket.*initsocket/i,
            /sockjs.*websocket|websocket.*sockjs/i,
        ];
        
        return wsNoisePatterns.some(pattern => pattern.test(combined));
    };

    // 원본 console.error/warn 백업
    const originalConsoleError = console.error.bind(console);
    const originalConsoleWarn = console.warn.bind(console);

    // console.error/warn 오버라이드하여 WebSocket 노이즈 필터링
    // 모든 WebSocket 관련 에러를 완전히 차단
    // ** 중요: 브라우저가 에러를 콘솔에 출력하기 전에 먼저 차단해야 함 **
    
    // 인자들을 하나의 문자열로 변환하는 헬퍼 함수
    // 스택 트레이스와 에러 메시지를 모두 포함
    const argsToString = (args: any[]): string => {
        return args.map(a => {
            if (typeof a === 'string') return a;
            if (a instanceof Error) {
                // Error 객체는 message와 stack 모두 포함
                return (a.message || "") + " " + (a.stack || "");
            }
            // 일반 객체의 경우 stack이나 message 속성 확인
            if (a && typeof a === 'object') {
                const stack = (a as any).stack || "";
                const message = (a as any).message || "";
                const str = String(a);
                return [message, stack, str].filter(Boolean).join(" ");
            }
            return String(a ?? "");
        }).join(" ");
    };
    
    // console.error/warn을 오버라이드하여 WebSocket 에러를 먼저 차단
    console.error = (...args: any[]) => {
        // 모든 인자를 하나의 문자열로 합쳐서 체크
        const combined = argsToString(args);
        
        // WebSocket 노이즈는 완전히 무시 (출력하지 않음)
        if (isWebSocketNoise(combined, combined)) {
            return; // 조용히 무시
        }
        
        originalConsoleError(...args);
    };

    console.warn = (...args: any[]) => {
        const combined = argsToString(args);
        
        // WebSocket 노이즈는 완전히 무시 (출력하지 않음)
        if (isWebSocketNoise(combined, combined)) {
            return; // 조용히 무시
        }
        
        originalConsoleWarn(...args);
    };

    window.addEventListener("unhandledrejection", (ev) => {
        const reason: any = ev.reason;
        const msg = reason?.message ?? reason;
        const src = reason?.stack ?? "";
        
        // WebSocket 에러는 먼저 체크하여 완전히 무시
        if (isWebSocketNoise(msg, src)) {
            ev.preventDefault();
            return;
        }
        
        if (isRecaptchaNoise(msg, src) || isAuthTimeoutNoise(msg)) {
            ev.preventDefault();
            originalConsoleWarn("[silenced dev error]", msg);
        }
    });

    window.addEventListener("error", (ev) => {
        const msg = ev.message || String(ev);
        const src = (ev as any).filename ?? ev?.error?.stack ?? "";
        
        // WebSocket 에러는 먼저 체크하여 완전히 무시
        if (isWebSocketNoise(msg, src)) {
            ev.preventDefault();
            ev.stopPropagation();
            return;
        }
        
        if (isRecaptchaNoise(msg, src) || isAuthTimeoutNoise(msg)) {
            ev.preventDefault();
            originalConsoleWarn("[silenced dev error]", msg);
        }
    });
}

// 이 한 줄로 isolatedModules 오류 방지
export {};
