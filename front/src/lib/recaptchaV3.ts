// src/lib/recaptchaV3.ts
const SITE_KEY = process.env.REACT_APP_RECAPTCHA_V3_SITE_KEY;

function ensureSiteKey(): string {
    if (!SITE_KEY) throw new Error("REACT_APP_RECAPTCHA_V3_SITE_KEY is missing");
    return SITE_KEY;
}

function loadScript(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (typeof window === "undefined") return resolve();
        if ((window as any).grecaptcha) return resolve();

        const s = document.createElement("script");
        s.src = `https://www.google.com/recaptcha/api.js?render=${ensureSiteKey()}`;
        s.async = true;
        s.defer = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("Failed to load reCAPTCHA v3 script"));
        document.head.appendChild(s);
    });
}

/** action별 v3 토큰 발급 */
export async function getV3Token(action: string): Promise<string> {
    await loadScript();
    const grecaptcha = (window as any).grecaptcha;
    await grecaptcha.ready();
    return grecaptcha.execute(ensureSiteKey(), { action });
}
