import React from "react";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";

type Props = {
    label?: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    className?: string;
};

function pad(n: number): string { return String(n).padStart(2, "0"); }

function parseLocal(v: string): Date | null {
    if (!v) return null;
    // Expected 'YYYY-MM-DDTHH:mm' or 'YYYY-MM-DDTHH:mm:ss'
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (!m) return null;
    const [_, y, mo, d, h, mi, s] = m;
    const date = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), s ? Number(s) : 0);
    return isNaN(date.getTime()) ? null : date;
}

function formatLocal(date: Date): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function formatHuman(date: Date): string {
    return `${date.getFullYear()}년 ${pad(date.getMonth() + 1)}월 ${pad(date.getDate())}일 ${pad(date.getHours())}시 ${pad(date.getMinutes())}분`;
}

function startOfMonth(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), 1); }
function addMonths(d: Date, delta: number): Date { return new Date(d.getFullYear(), d.getMonth() + delta, 1); }

const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];

export default function DateTimeField({ label, value, onChange, placeholder, className }: Props) {
    const [open, setOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const vDate = React.useMemo(() => parseLocal(value) || new Date(), [value]);
    const [month, setMonth] = React.useState<Date>(() => startOfMonth(vDate));
    const [h, setH] = React.useState<number>(vDate.getHours());
    const [m, setM] = React.useState<number>(vDate.getMinutes());
    const [selDay, setSelDay] = React.useState<Date>(vDate);

    React.useEffect(() => {
        function onDoc(e: MouseEvent) {
            if (!containerRef.current) return;
            if (!containerRef.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    const days = React.useMemo(() => {
        const start = startOfMonth(month);
        const firstDow = start.getDay();
        const items: Array<{ date: Date; inMonth: boolean }> = [];
        // previous blanks
        for (let i = 0; i < firstDow; i++) {
            const d = new Date(start.getFullYear(), start.getMonth(), i - firstDow + 1);
            items.push({ date: d, inMonth: false });
        }
        // current month days
        const last = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
        for (let d = 1; d <= last; d++) items.push({ date: new Date(start.getFullYear(), start.getMonth(), d), inMonth: true });
        // next blanks to fill 6 rows
        while (items.length % 7 !== 0) {
            const lastItem = items[items.length - 1].date;
            items.push({ date: new Date(lastItem.getFullYear(), lastItem.getMonth(), lastItem.getDate() + 1), inMonth: false });
        }
        return items;
    }, [month]);

    function setDatePart(d: Date) {
        setSelDay(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0));
    }

    function setTimePart(newH: number, newM: number) {
        setH(newH); setM(newM);
    }

    const display = value ? formatHuman(parseLocal(value) || new Date()) : "";

    const [openH, setOpenH] = React.useState(false);
    const [openM, setOpenM] = React.useState(false);
    const hours = React.useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
    const minutes = React.useMemo(() => Array.from({ length: 60 }, (_, i) => i).filter((i) => i % 5 === 0), []);

    function handleToggle() {
        if (open) { setOpen(false); return; }
        const base = parseLocal(value) || new Date();
        setMonth(startOfMonth(base));
        setH(base.getHours());
        setM(base.getMinutes());
        setSelDay(base);
        setOpenH(false); setOpenM(false);
        setOpen(true);
    }

    return (
        <div ref={containerRef} className={["relative", className || ""].join(" ")}> 
            {label && <label className="block mb-1 text-[14px] font-bold text-neutral-900">{label}</label>}
            <button type="button" onClick={handleToggle} className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 pr-10 text-left outline-none focus:border-emerald-500 relative">
                {display || (placeholder || "연도-월-일 시:분")}
                <CalendarIcon className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            </button>
            {open && (
                <div className="absolute left-0 z-50 bottom-full mb-2 w-[320px] rounded-xl border border-neutral-200 bg-white p-3 shadow-xl">
                    <div className="mb-2 flex items-center justify-between">
                        <button type="button" className="rounded-md border px-2 py-1 text-[12px]" onClick={() => setMonth(addMonths(month, -1))}>◀</button>
                        <div className="text-[13px] font-semibold">{month.getFullYear()}년 {pad(month.getMonth() + 1)}월</div>
                        <button type="button" className="rounded-md border px-2 py-1 text-[12px]" onClick={() => setMonth(addMonths(month, 1))}>▶</button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-[12px]">
                        {dayLabels.map((d) => (
                            <div key={d} className="py-1 font-medium text-neutral-600">{d}</div>
                        ))}
                        {days.map(({ date, inMonth }, idx) => {
                            const isSelected = selDay && selDay.toDateString() === date.toDateString();
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => inMonth && setDatePart(date)}
                                    className={[
                                        "rounded-md py-1.5 text-[12.5px]",
                                        inMonth ? "hover:bg-neutral-100" : "text-neutral-300",
                                        isSelected ? "bg-emerald-600 text-white hover:bg-emerald-600" : "",
                                    ].join(" ")}
                                >
                                    {pad(date.getDate())}
                                </button>
                            );
                        })}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                        {/* Hour dropdown (compact 4~5 items visible) */}
                        <div className="relative">
                            <button type="button" onClick={() => { setOpenH((o) => !o); setOpenM(false); }} className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[12.5px]">
                                {pad(h)}시 <ChevronDown className="h-3 w-3" />
                            </button>
                            {openH && (
                                <div className="absolute left-0 top-full z-10 mt-1 max-h-40 w-[80px] overflow-auto rounded-md border bg-white shadow">
                                    {hours.map((x) => (
                                        <button key={x} type="button" onClick={() => { setTimePart(x, m); setOpenH(false); }} className={["block w-full px-2 py-1 text-left text-[12.5px] hover:bg-neutral-100", x === h ? "bg-emerald-50 text-emerald-700" : ""].join(" ")}>{pad(x)}시</button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Minute dropdown (compact) */}
                        <div className="relative">
                            <button type="button" onClick={() => { setOpenM((o) => !o); setOpenH(false); }} className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[12.5px]">
                                {pad(m)}분 <ChevronDown className="h-3 w-3" />
                            </button>
                            {openM && (
                                <div className="absolute left-0 top-full z-10 mt-1 max-h-40 w-[80px] overflow-auto rounded-md border bg-white shadow">
                                    {minutes.map((x) => (
                                        <button key={x} type="button" onClick={() => { setTimePart(h, x); setOpenM(false); }} className={["block w-full px-2 py-1 text-left text-[12.5px] hover:bg-neutral-100", x === m ? "bg-emerald-50 text-emerald-700" : ""].join(" ")}>{pad(x)}분</button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="ml-auto flex gap-2">
                            <button
                                type="button"
                                className="rounded-full border px-3 py-1.5 text-[12.5px] hover:bg-neutral-50"
                                onClick={() => {
                                    const selected = new Date(selDay.getFullYear(), selDay.getMonth(), selDay.getDate(), h, m, 0);
                                    onChange(formatLocal(selected));
                                    setOpen(false);
                                }}
                            >
                                저장
                            </button>
                            <button type="button" className="rounded-full border px-3 py-1.5 text-[12.5px] hover:bg-neutral-50" onClick={() => setOpen(false)}>닫기</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


