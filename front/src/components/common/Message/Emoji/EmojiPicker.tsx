import React from "react";
import { getEmojiCategories, listEmojis } from "../../../../api/emojis";

type Props = {
    onPick: (emoji: string) => void;
    onClose?: () => void;
    className?: string;
};

const TAB_ALL = "__all__";
const PAGE_SIZE = 72;
const HIDE_CAT = /^(extras-|component|skin|skin-tone|modifier)/i;
const PANEL_W = "w-[320px]";
const PANEL_H = "h-[360px]";
const RECENT_KEY = "recentEmojis";
const FALLBACK = [
    "😀","😄","😁","😊","😉","😍","🥰","😘","😎","🤗",
    "👍","👏","🙏","👌","🙌","🔥","💯","✨","🎉","✅",
    "🍀","🍔","🍕","🍟","🌮","🍣","🍩","☕","🍺","⚽",
];
const GRID_MIN = 40;

const parseJSON = (s: string | null) => { try { return s ? JSON.parse(s) : []; } catch { return []; } };

type Tab = { id: string; name: string };
type Item = { id: string; char: string; ghost?: boolean; category?: string };

const EmojiPicker: React.FC<Props> = ({ onPick, onClose, className }) => {
    const rootRef = React.useRef<HTMLDivElement>(null);

    const [q, setQ] = React.useState("");
    const [tabs, setTabs] = React.useState<Tab[]>([{ id: TAB_ALL, name: "전체" }]);
    const [active, setActive] = React.useState<string>(TAB_ALL);
    const [page0, setPage0] = React.useState(0);
    const [total, setTotal] = React.useState(0);
    const [loading, setLoading] = React.useState(false);
    const [fallback, setFallback] = React.useState(false);

    const [items, setItems] = React.useState<Item[]>([]);
    const sentinelRef = React.useRef<HTMLDivElement>(null);

    // 최근
    const [recent, setRecent] = React.useState<string[]>(() => parseJSON(localStorage.getItem(RECENT_KEY)));
    const pushRecent = (e: string) => {
        setRecent((prev) => {
            const next = [e, ...prev.filter((x) => x !== e)].slice(0, 500);
            localStorage.setItem(RECENT_KEY, JSON.stringify(next));
            return next;
        });
    };

    // 바깥 클릭 + ESC 닫기
    React.useEffect(() => {
        const onPointerDown = (e: PointerEvent) => {
            const el = rootRef.current;
            if (!el) return;
            if (!el.contains(e.target as Node)) onClose?.();
        };
        const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") onClose?.(); };
        document.addEventListener("pointerdown", onPointerDown, true);
        window.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("pointerdown", onPointerDown, true);
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [onClose]);

    // 카테고리
    React.useEffect(() => {
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
    }, []);

    // 페이지 로드
    const loadPage = React.useCallback(
        async (nextPage0: number, replace = false) => {
            setLoading(true);
            try {
                if (fallback) {
                    const term = q.trim();
                    const filtered = term ? FALLBACK.filter((e) => e.includes(term)) : FALLBACK;
                    const start = nextPage0 * PAGE_SIZE;
                    const chunk: Item[] = filtered.slice(start, start + PAGE_SIZE).map((ch, i) => ({ id: `${nextPage0}-${i}-${ch}`, char: ch }));
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

                const list: Item[] = (res.items ?? [])
                    .filter((x) => !HIDE_CAT.test(String(x.category ?? "")))
                    .map((x, i) => ({ id: `${res.page}-${i}-${x.char}`, char: x.char ?? "", category: x.category }))
                    .filter((x) => x.char);

                setTotal(res.total ?? 0);
                setPage0(res.page ?? nextPage0);
                setItems((prev) => (replace ? list : [...prev, ...list]));
            } catch {
                setFallback(true);
                setItems([]); setPage0(0); setTotal(0);
                setTimeout(() => loadPage(0, true), 0);
            } finally {
                setLoading(false);
            }
        },
        [active, q, fallback]
    );

    React.useEffect(() => { loadPage(0, true); }, [active, q, loadPage]);

    // 무한 스크롤
    React.useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const io = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !loading && items.length < total) {
                loadPage(page0 + 1);
            }
        }, { rootMargin: "200px" });
        io.observe(el);
        return () => io.disconnect();
    }, [items.length, total, loading, page0, loadPage]);

    const pick = (emoji: string) => { pushRecent(emoji); onPick(emoji); };

    // 결과 적을 때 최소 채움
    const querying = q.trim().length > 0;
    const haveResult = items.length > 0;
    let display: Item[] = items;
    if (haveResult && items.length < GRID_MIN) {
        const pool = [...recent, ...FALLBACK];
        const exist = new Set(items.map((i) => i.char));
        const need = GRID_MIN - items.length;
        const extra: Item[] = [];
        for (const e of pool) {
            if (!exist.has(e)) {
                extra.push({ id: `ghost-${e}-${extra.length}`, char: e, ghost: true });
                if (extra.length >= need) break;
            }
        }
        display = [...items, ...extra];
    }

    const isEmpty = !loading && !haveResult;

    return (
        <div ref={rootRef} tabIndex={-1} className={`${PANEL_W} ${PANEL_H} bg-white border rounded-2xl shadow-xl p-3 overflow-hidden flex flex-col ${className ?? ""}`}>
            {/* 검색 + 닫기 */}
            <div className="flex items-center gap-2 mb-2 shrink-0">
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="이모지 검색 (한글/영문)"
                    className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30"
                />
                <button onClick={onClose} className="h-8 px-3 text-xs text-gray-500 hover:text-gray-700 rounded-lg">닫기</button>
            </div>

            {/* 최근 */}
            {recent.length > 0 && (
                <div className="mb-2 shrink-0">
                    <div className="text-[12px] text-gray-500 mb-1">최근 사용</div>
                    <div className="flex gap-1 overflow-x-auto no-scrollbar pr-1">
                        {recent.map((e, i) => (
                            <button key={`${i}-${e}`} className="h-8 w-8 rounded-lg hover:bg-gray-50 text-xl shrink-0" onClick={() => pick(e)} title={e}>
                                {e}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* 탭 */}
            <div className="flex gap-1 overflow-x-auto no-scrollbar mb-2 shrink-0">
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setActive(t.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs shrink-0 ${active === t.id ? "bg-gray-900 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
                    >
                        {t.name}
                    </button>
                ))}
            </div>

            {/* 결과 */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1 no-scrollbar">
                {isEmpty ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                        <div className="text-sm text-gray-500 mb-3">{querying ? <>‘{q}’ 검색 결과가 없어요.</> : <>표시할 이모지가 없어요.</>}</div>
                        <div className="grid grid-cols-8 gap-1 mb-3">
                            {([...recent, ...FALLBACK].slice(0, 16)).map((e, i) => (
                                <button key={`suggest-${i}-${e}`} className="h-9 w-9 rounded-lg hover:bg-gray-50 text-xl" onClick={() => pick(e)}>{e}</button>
                            ))}
                        </div>
                        {querying && <button onClick={() => setQ("")} className="px-3 py-1.5 text-xs rounded-lg border hover:bg-gray-50">검색 초기화</button>}
                    </div>
                ) : (
                    <div className="grid grid-cols-8 gap-1">
                        {display.map((it) => (
                            <button
                                key={it.id}
                                className={`h-9 w-9 rounded-lg hover:bg-gray-50 text-xl ${it.ghost ? "opacity-60 hover:opacity-100" : ""}`}
                                onClick={() => pick(it.char)}
                                title={it.char}
                            >
                                {it.char}
                            </button>
                        ))}
                        <div ref={sentinelRef} />
                    </div>
                )}
            </div>

            <div className="mt-2 text-center text-[11px] text-gray-400 h-4 shrink-0">
                {loading ? "불러오는 중…" : ""}
            </div>
        </div>
    );
};

export default EmojiPicker;
