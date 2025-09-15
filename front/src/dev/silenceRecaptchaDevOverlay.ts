// src/dev/silenceRecaptchaDevOverlay.ts
// reCAPTCHA 관련 dev 오버레이만 조용히 막기(프로덕션엔 로드 안 함)

if (process.env.NODE_ENV !== "production") {
    const isRecaptchaNoise = (msg?: unknown, src?: unknown) => {
        const text = String(msg ?? "");
        const source = String(src ?? "");
        // gstatic recaptcha 스크립트/메시지에 한정
        const fromRecaptcha = /recaptcha|grecaptcha|gstatic\.com\/recaptcha/i.test(
            text + source
        );
        // 주로 시끄러운 유형만 필터링
        const noisyOnly = /timeout|execute|verify|style/i.test(text);
        return fromRecaptcha && noisyOnly;
    };

    window.addEventListener("unhandledrejection", (ev) => {
        const reason: any = ev.reason;
        const msg = reason?.message ?? reason;
        const src = reason?.stack ?? "";
        if (isRecaptchaNoise(msg, src)) {
            ev.preventDefault();
            console.warn("[silenced reCAPTCHA unhandledrejection]", reason);
        }
    });

    window.addEventListener("error", (ev) => {
        const msg = ev.message;
        const src = (ev as any).filename ?? ev?.error?.stack ?? "";
        if (isRecaptchaNoise(msg, src)) {
            ev.preventDefault();
            console.warn("[silenced reCAPTCHA error]", msg);
        }
    });
}

// 이 한 줄이 있으면 isolatedModules 환경에서도 컴파일 OK
export {};
