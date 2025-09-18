import React, {
    useEffect,
    useRef,
    forwardRef,
    useImperativeHandle,
} from "react";

const SITE_KEY = process.env.REACT_APP_RECAPTCHA_V2_SITE_KEY;

function ensureSiteKey(): string {
    if (!SITE_KEY) throw new Error("REACT_APP_RECAPTCHA_V2_SITE_KEY is missing");
    return SITE_KEY;
}

export type RecaptchaV2Handle = {
    reset: () => void;
    getResponse: () => string | null;
};

type Props = {
    onVerify: (token: string) => void;
    onExpire?: () => void;
    onError?: (err?: unknown) => void;
    theme?: "light" | "dark";
    size?: "normal" | "compact";
    className?: string;
};

/** v2 위젯은 한 번만 렌더되어야 안전. 콜백은 ref로 최신화해서 재렌더로 인한 재초기화 방지 */
const RecaptchaV2 = forwardRef<RecaptchaV2Handle, Props>(function RecaptchaV2(
    { onVerify, onExpire, onError, theme = "light", size = "normal", className }: Props,
    ref
) {
    const rootRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<number | null>(null);
    const retryTimerRef = useRef<number | null>(null);

    const onVerifyRef = useRef(onVerify);
    const onExpireRef = useRef(onExpire);
    const onErrorRef = useRef(onError);
    useEffect(() => {
        onVerifyRef.current = onVerify;
        onExpireRef.current = onExpire;
        onErrorRef.current = onError;
    }, [onVerify, onExpire, onError]);

    useImperativeHandle(ref, () => ({
        reset() {
            try {
                const w = window as any;
                if (widgetIdRef.current !== null && w.grecaptcha?.reset) {
                    w.grecaptcha.reset(widgetIdRef.current);
                }
            } catch {}
        },
        getResponse() {
            try {
                const w = window as any;
                if (widgetIdRef.current !== null && w.grecaptcha?.getResponse) {
                    const r = w.grecaptcha.getResponse(widgetIdRef.current);
                    return r || null;
                }
            } catch {}
            return null;
        },
    }));

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
                s.src = "https://www.google.com/recaptcha/api.js?hl=ko";
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
                callback: (t: string) => onVerifyRef.current?.(t),
                "expired-callback": () => onExpireRef.current?.(),
                "error-callback": () => onErrorRef.current?.(new Error("recaptcha_error")),
                theme,
                size,
            });
        };

        (async () => {
            try {
                await loadV2Script();
                tryRender();
            } catch (e) {
                onErrorRef.current?.(e);
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
        // theme/size만 의존 → 콜백/클래스 변경으로 재초기화 안 함
    }, [theme, size]);

    return <div ref={rootRef} className={className} />;
});

export default RecaptchaV2;
