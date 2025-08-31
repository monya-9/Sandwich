import React from "react";
import { getEmojiCategories, listEmojis } from "../../../../api/emojis";

type Props = {
    onPick: (emoji: string) => void;
    onClose?: () => void;
    className?: string;
};

const TAB_ALL = "__all__";
const PAGE_SIZE = 72;
const RECENT_PAGE_SIZE = 96;

const HIDE_CAT = /^(extras-|component|skin|skin-tone|modifier)/i;

const PANEL_W = "w-[320px]";
const PANEL_H = "h-[360px]";

const RECENT_KEY = "recentEmojis";
const parseJSON = (s: string | null) => {
    try {
        return s ? JSON.parse(s) : [];
    } catch {
        return [];
    }
};

type Tab = { id: string; name: string };

const FALLBACK = [
    "😀","😄","😁","😊","😉","😍","🥰","😘","😎","🤗",
    "👍","👏","🙏","👌","🙌","🔥","💯","✨","🎉","✅",
    "🍀","🍔","🍕","🍟","🌮","🍣","🍩","☕","🍺","⚽",
];

const EmojiPicker: React.FC<Props> = ({ onPick, onClose, className }) => {
    // 기본 탭: 이모지
    const [mode, setMode] = React.useState<"emoji" | "recent">("emoji");

    // 최근 이모지
    const [recentAll, setRecentAll] = React.useState<string[]>(
        () => parseJSON(localStorage.getItem(RECENT_KEY)) as string[]
    );
    const pushRecent = (e: string) => {
        setRecentAll((prev) => {
            const next = [e, ...prev.filter((x) => x !== e)];
            localStorage.setItem(RECENT_KEY, JSON.stringify(next));
            return next;
        });
    };

    // 이모지 탭 상태
    const [tabs, setTabs] = React.useState<Tab[]>([{ id: TAB_ALL, name: "전체" }]);
    const [active, setActive] = React.useState<string>(TAB_ALL);
    const [q, setQ] = React.useState("");
    const [page0, setPage0] = React.useState(0);
    const [items, setItems] = React.useState<{ id: string; char: string; category?: string }[]>([]);
    const [total, setTotal] = React.useState<number>(0);
    const [loading, setLoading] = React.useState(false);
    const [fallback, setFallback] = React.useState(false);
    const emojiSentinelRef = React.useRef<HTMLDivElement>(null);

    // 최근(세로 그리드 + 무한 스크롤)
    const [recentPage0, setRecentPage0] = React.useState(0);
    const [recentRender, setRecentRender] = React.useState<string[]>([]);
    const recentSentinelRef = React.useRef<HTMLDivElement>(null);

    // 카테고리 로드
    React.useEffect(() => {
        if (mode !== "emoji") return;
        (async () => {
            try {
                const cats = await getEmojiCategories();
                const filtered = (cats ?? []).filter((c) => !HIDE_CAT.test(String(c)));
                if (filtered.length) {
                    setTabs([{ id: TAB_ALL, name: "전체" }, ...filtered.map((c) => ({ id: c, name: c }))]);
                    setFallback(false);
                } else {
                    setFallback(true);
                }
            } catch {
                setFallback(true);
            }
        })();
    }, [mode]);

    // 이모지 페이지 로드
    const loadEmojiPage = React.useCallback(
        async (nextPage0: number, replace = false) => {
            if (mode !== "emoji") return;
            setLoading(true);
            try {
                if (fallback) {
                    const term = q.trim();
                    const filtered = term ? FALLBACK.filter((e) => e.includes(term)) : FALLBACK;
                    const start = nextPage0 * PAGE_SIZE;
                    const chunk = filtered
                        .slice(start, start + PAGE_SIZE)
                        .map((ch, i) => ({ id: `${nextPage0}-${i}-${ch}`, char: ch }));
                    setTotal(filtered.length);
                    setPage0(nextPage0);
                    setItems((prev) => (replace ? chunk : [...prev, ...chunk]));
                    return;
                }

                const res = await listEmojis({
                    category: active === TAB_ALL ? undefined : active,
                    q: q.trim() || undefined,
                    page: nextPage0,
                    size: PAGE_SIZE,
                });

                const list = (res.items ?? [])
                    .filter((x) => !HIDE_CAT.test(String(x.category ?? "")))
                    .map((x, i) => ({
                        id: `${res.page}-${i}-${x.char}`,
                        char: x.char ?? "",
                        category: x.category,
                    }))
                    .filter((x) => x.char);

                setTotal(res.total ?? 0);
                setPage0(res.page ?? nextPage0);
                setItems((prev) => (replace ? list : [...prev, ...list]));
            } catch {
                setFallback(true);
                setItems([]);
                setPage0(0);
                setTotal(0);
                setTimeout(() => loadEmojiPage(0, true), 0);
            } finally {
                setLoading(false);
            }
        },
        [mode, active, q, fallback]
    );

    // 초기 로드/필터 변경 시
    React.useEffect(() => {
        if (mode !== "emoji") return;
        loadEmojiPage(0, true);
    }, [mode, active, q, loadEmojiPage]);

    // 이모지 무한 스크롤
    React.useEffect(() => {
        if (mode !== "emoji") return;
        const el = emojiSentinelRef.current;
        if (!el) return;
        const io = new IntersectionObserver(
            (es) => {
                if (es[0].isIntersecting && !loading && items.length < total) {
                    loadEmojiPage(page0 + 1);
                }
            },
            { rootMargin: "200px" }
        );
        io.observe(el);
        return () => io.disconnect();
    }, [mode, items.length, total, loading, page0, loadEmojiPage]);

    // 최근 로드/무한 스크롤
    const loadRecentPage = React.useCallback(
        (nextPage0: number, replace = false) => {
            if (mode !== "recent") return;
            const start = nextPage0 * RECENT_PAGE_SIZE;
            const chunk = recentAll.slice(start, start + RECENT_PAGE_SIZE);
            setRecentPage0(nextPage0);
            setRecentRender((prev) => (replace ? chunk : [...prev, ...chunk]));
        },
        [mode, recentAll]
    );

    React.useEffect(() => {
        if (mode !== "recent") return;
        loadRecentPage(0, true);
    }, [mode, recentAll, loadRecentPage]);

    React.useEffect(() => {
        if (mode !== "recent") return;
        const el = recentSentinelRef.current;
        if (!el) return;
        const io = new IntersectionObserver(
            (entries) => {
                const [e] = entries;
                const hasMore =
                    (recentPage0 + 1) * RECENT_PAGE_SIZE < recentAll.length;
                if (e.isIntersecting && hasMore) {
                    loadRecentPage(recentPage0 + 1);
                }
            },
            { rootMargin: "200px" }
        );
        io.observe(el);
        return () => io.disconnect();
    }, [mode, recentPage0, recentAll.length, loadRecentPage]);

    const pick = (emoji: string) => {
        pushRecent(emoji);
        onPick(emoji);
    };

    return (
        <div
            className={`${PANEL_W} ${PANEL_H} bg-white border rounded-2xl shadow-xl p-3 overflow-hidden flex flex-col ${className ?? ""}`}
        >
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2 shrink-0">
                {mode === "emoji" ? (
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="이모지 검색 (한글/영문)"
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 mr-2"
                    />
                ) : (
                    <div className="text-sm font-medium text-gray-700 mr-2">최근 사용</div>
                )}
                <button
                    className="shrink-0 h-8 px-3 text-xs text-gray-500 hover:text-gray-700 rounded-lg whitespace-nowrap"
                    onClick={onClose}
                >
                    닫기
                </button>
            </div>

            {/* 상단 2탭 */}
            <div className="flex gap-1 mb-2 shrink-0">
                <button
                    onClick={() => setMode("emoji")}
                    className={`px-3 py-1.5 rounded-lg text-xs ${
                        mode === "emoji" ? "bg-gray-900 text-white" : "bg-gray-100 hover:bg-gray-200"
                    }`}
                >
                    이모지
                </button>
                <button
                    onClick={() => setMode("recent")}
                    className={`px-3 py-1.5 rounded-lg text-xs ${
                        mode === "recent" ? "bg-gray-900 text-white" : "bg-gray-100 hover:bg-gray-200"
                    }`}
                >
                    최근
                </button>
            </div>

            {/* 본문: flex-1 + min-h-0 로 남은 높이 꽉 채움 */}
            {mode === "emoji" ? (
                <div className="flex-1 min-h-0 flex flex-col">
                    {/* 카테고리 탭 */}
                    <div className="flex gap-1 overflow-x-auto no-scrollbar mb-2 shrink-0">
                        {tabs.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setActive(t.id)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs shrink-0 ${
                                    active === t.id ? "bg-gray-900 text-white" : "bg-gray-100 hover:bg-gray-200"
                                }`}
                            >
                                {t.name}
                            </button>
                        ))}
                    </div>

                    {/* 결과 그리드 */}
                    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1 no-scrollbar grid grid-cols-8 gap-1">
                        {items.map((it) => (
                            <button
                                key={it.id}
                                className="h-9 w-9 rounded-lg hover:bg-gray-50 text-xl"
                                onClick={() => pick(it.char)}
                                title={it.char}
                            >
                                {it.char}
                            </button>
                        ))}
                        <div ref={emojiSentinelRef} />
                    </div>

                    <div className="mt-2 text-center text-[11px] text-gray-400 h-4 shrink-0">
                        {loading ? "불러오는 중…" : ""}
                    </div>
                </div>
            ) : (
                <div className="flex-1 min-h-0 flex flex-col">
                    {recentAll.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-[12px] text-gray-400">
                            최근 사용 이모지가 없습니다.
                        </div>
                    ) : (
                        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1 no-scrollbar grid grid-cols-8 gap-1">
                            {recentRender.map((e, i) => (
                                <button
                                    key={`${i}-${e}`}
                                    className="h-9 w-9 rounded-lg hover:bg-gray-50 text-xl"
                                    onClick={() => pick(e)}
                                    title={e}
                                >
                                    {e}
                                </button>
                            ))}
                            <div ref={recentSentinelRef} />
                        </div>
                    )}
                    <div className="mt-2 text-center text-[11px] text-gray-400 h-4 shrink-0" />
                </div>
            )}
        </div>
    );
};

export default EmojiPicker;
