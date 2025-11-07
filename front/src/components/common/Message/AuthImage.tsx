// src/components/common/Message/AuthImage.tsx
import React from "react";

type Props = { src: string; alt?: string; className?: string; fileName?: string };
const isAbs = (u: string) => /^https?:\/\//i.test(u);
const blobCache = new Map<string, string>();

const AuthImage: React.FC<Props> = ({ src, alt, className, fileName }) => {
    const absolute = isAbs(src);
    const cached = absolute ? src : blobCache.get(src) || null;

    const [blobUrl, setBlobUrl] = React.useState<string | null>(cached);
    const [loading, setLoading] = React.useState(!cached);
    const [err, setErr] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (absolute) {
            setErr(null);
            setLoading(false);
            setBlobUrl(src);
            return;
        }

        // 캐시 히트면 즉시 사용 (로딩 전환 ❌)
        const inCache = blobCache.get(src);
        if (inCache) {
            setErr(null);
            setLoading(false);
            setBlobUrl(inCache);
            return;
        }

        const ac = new AbortController();
        (async () => {
            try {
                setErr(null);
                setLoading(true);

                // ✅ httpOnly 쿠키 기반: credentials로 자동 전송
                const res = await fetch(src, { 
                    credentials: "include",
                    signal: ac.signal 
                });
                if (!res.ok) throw new Error(String(res.status));

                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                blobCache.set(src, url);
                setBlobUrl(url);
                setLoading(false);
            } catch (e: any) {
                if (e?.name === "AbortError") return;
                setErr(e?.message || "이미지 로딩 실패");
                setLoading(false);
            }
        })();

        return () => {
            // revoke 하지 않음 (사라짐 방지)
            ac.abort();
        };
    }, [src]); // ✅ src만 의존

    const openInNewTab = React.useCallback(async () => {
        try {
            if (blobUrl) {
                window.open(blobUrl, "_blank", "noopener,noreferrer");
                return;
            }
            // ✅ httpOnly 쿠키 기반: credentials로 자동 전송
            const res = await fetch(src, { credentials: "include" });
            if (!res.ok) throw new Error(String(res.status));
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank", "noopener,noreferrer");
        } catch {}
    }, [blobUrl, src]);

    if (loading && !blobUrl) return <span className="text-xs text-gray-400">불러오는 중…</span>;

    if (err || !blobUrl) {
        return (
            <button
                type="button"
                onClick={openInNewTab}
                className="text-sm underline text-blue-600 hover:opacity-80"
                title={err || undefined}
            >
                [첨부파일] {fileName || "파일"}
            </button>
        );
    }

    return (
        <button type="button" onClick={openInNewTab} className="block" style={{ lineHeight: 0 }}>
            <img
                src={blobUrl}
                alt={alt}
                className={className}
                loading="lazy"
                onError={() => setErr("이미지 로딩 실패")}
            />
        </button>
    );
};

export default AuthImage;
