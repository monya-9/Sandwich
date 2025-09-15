import React, { useEffect, useRef } from "react";

const SITE_KEY = process.env.REACT_APP_RECAPTCHA_V2_SITE_KEY;

function ensureSiteKey(): string {
    if (!SITE_KEY) throw new Error("REACT_APP_RECAPTCHA_V2_SITE_KEY is missing");
    return SITE_KEY;
}

type Props = {
    onVerify: (token: string) => void;
    onExpire?: () => void;
    onError?: (err?: unknown) => void; // ⬅️ 추가
    theme?: "light" | "dark";
    size?: "normal" | "compact";
    className?: string;
};

export default function RecaptchaV2({
                                        onVerify,
                                        onExpire,
                                        onError,
                                        theme = "light",
                                        size = "normal",
                                        className,
                                    }: Props) {
    const rootRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<number | null>(null);
    const retryTimerRef = useRef<number | null>(null);

    // v2 스크립트 로드(이미 로드되어 있으면 재사용)
    useEffect(() => {
        if (typeof window === "undefined") return;

        const loadV2Script = () =>
            new Promise<void>((res, rej) => {
                const w = window as any;

                if (w.grecaptcha && typeof w.grecaptcha.render === "function") return res();

                const exist = document.getElementById("__grecaptcha_v2_script__") as HTMLScriptElement | null;
                if (exist) {
                    exist.addEventListener("load", () => res());
                    exist.addEventListener("error", () => rej(new Error("Failed to load reCAPTCHA v2 script")));
                    return;
                }

                const s = document.createElement("script");
                s.id = "__grecaptcha_v2_script__";
                s.src = "https://www.google.com/recaptcha/api.js";
                s.async = true;
                s.defer = true;
                s.onload = () => res();
                s.onerror = () => rej(new Error("Failed to load reCAPTCHA v2 script"));
                document.head.appendChild(s);
            });

        const tryRender = () => {
            const w = window as any;
            if (!rootRef.current) return;
            if (widgetIdRef.current !== null) return;

            if (!w.grecaptcha || typeof w.grecaptcha.render !== "function") {
                retryTimerRef.current = window.setTimeout(tryRender, 50);
                return;
            }

            widgetIdRef.current = w.grecaptcha.render(rootRef.current, {
                sitekey: ensureSiteKey(),
                callback: (t: string) => onVerify(t),
                "expired-callback": () => onExpire?.(),
                "error-callback": () => onError?.(new Error("recaptcha_error")), // ⬅️ 추가
                theme,
                size,
            });
        };

        (async () => {
            try {
                await loadV2Script();
                tryRender();
            } catch (e) {
                onError?.(e);
            }
        })();

        return () => {
            if (retryTimerRef.current) {
                clearTimeout(retryTimerRef.current);
                retryTimerRef.current = null;
            }
            try {
                const w = window as any;
                if (widgetIdRef.current !== null && w.grecaptcha?.reset) {
                    w.grecaptcha.reset(widgetIdRef.current);
                }
            } catch {}
            widgetIdRef.current = null;
            if (rootRef.current) rootRef.current.innerHTML = "";
        };
    }, [onVerify, onExpire, onError, theme, size]);

    return <div ref={rootRef} className={className} />;
}
