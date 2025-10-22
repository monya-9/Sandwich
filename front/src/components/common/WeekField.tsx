import React from "react";
import { Calendar as CalendarIcon } from "lucide-react";

type Props = {
    label?: string;
    value: string; // YYYYWww
    onChange: (v: string) => void;
    placeholder?: string;
    className?: string;
};

function pad(n: number): string { return String(n).padStart(2, "0"); }

function startOfMonth(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), 1); }
function addMonths(d: Date, delta: number): Date { return new Date(d.getFullYear(), d.getMonth() + delta, 1); }

// Convert ISO week string (YYYYWww) to Monday date (UTC-based to be deterministic)
function isoWeekToMonday(weekStr: string): Date | null {
    const m = weekStr.match(/^(\d{4})W(\d{2})$/);
    if (!m) return null;
    const year = Number(m[1]);
    const week = Number(m[2]);
    const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
    const dow = simple.getUTCDay() || 7; // 1..7 (Mon..Sun)
    const monday = new Date(simple);
    if (dow <= 4) monday.setUTCDate(simple.getUTCDate() - dow + 1);
    else monday.setUTCDate(simple.getUTCDate() + (8 - dow));
    return new Date(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate());
}

// From any date, compute ISO year and week
function dateToIsoWeek(d: Date): { year: number; week: number } {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7; // 1..7
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return { year: date.getUTCFullYear(), week: weekNo };
}

const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];

export default function WeekField({ label, value, onChange, placeholder, className }: Props) {
    const [open, setOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const initDate = React.useMemo(() => isoWeekToMonday(value) || new Date(), [value]);
    const [month, setMonth] = React.useState<Date>(() => startOfMonth(initDate));
    const [selDay, setSelDay] = React.useState<Date>(initDate);

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
        for (let i = 0; i < firstDow; i++) {
            const d = new Date(start.getFullYear(), start.getMonth(), i - firstDow + 1);
            items.push({ date: d, inMonth: false });
        }
        const last = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
        for (let d = 1; d <= last; d++) items.push({ date: new Date(start.getFullYear(), start.getMonth(), d), inMonth: true });
        while (items.length % 7 !== 0) {
            const lastItem = items[items.length - 1].date;
            items.push({ date: new Date(lastItem.getFullYear(), lastItem.getMonth(), lastItem.getDate() + 1), inMonth: false });
        }
        return items;
    }, [month]);

    function handleToggle() {
        if (open) { setOpen(false); return; }
        const base = isoWeekToMonday(value) || new Date();
        setMonth(startOfMonth(base));
        setSelDay(base);
        setOpen(true);
    }

    const display = React.useMemo(() => {
        // value가 없으면 빈 문자열 반환 (placeholder 표시)
        if (!value && !open) return "";
        // 팝업이 열려 있는 동안에는 현재 선택 주(미저장) 미리보기 노출
        const useDate = open ? selDay : (value ? (isoWeekToMonday(value) || selDay) : selDay);
        const { year, week } = dateToIsoWeek(useDate);
        return `${year}년 ${week}주차`;
    }, [open, selDay, value]);

    return (
        <div ref={containerRef} className={["relative", className || ""].join(" ")}> 
            {label && <label className="block mb-1 text-[14px] font-bold text-neutral-900">{label}</label>}
            <button type="button" onClick={handleToggle} className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 pr-10 text-left outline-none focus:border-emerald-500 relative">
                {display || (placeholder || "주차 선택")}
                <CalendarIcon className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            </button>
            {open && (
                <div className="absolute left-0 z-50 top-full mt-2 w-[320px] rounded-xl border border-neutral-200 bg-white p-3 shadow-xl">
                    <div className="mb-2 flex items-center justify-between">
                        <button type="button" className="rounded-md border px-2 py-1 text-[12px]" onClick={() => setMonth(addMonths(month, -1))}>◀</button>
                        <div className="text-[13px] font-semibold">{month.getFullYear()}년 {pad(month.getMonth() + 1)}월</div>
                        <button type="button" className="rounded-md border px-2 py-1 text-[12px]" onClick={() => setMonth(addMonths(month, 1))}>▶</button>
                    </div>
                    <div className="mb-2 text-[12.5px] text-emerald-700">현재 선택: {display}</div>
                    <div className="grid grid-cols-7 gap-1 text-center text-[12px]">
                        {dayLabels.map((d) => (
                            <div key={d} className="py-1 font-medium text-neutral-600">{d}</div>
                        ))}
                        {days.map(({ date, inMonth }, idx) => {
                            const isSelected = selDay && selDay.toDateString() === date.toDateString();
                            const sw = dateToIsoWeek(selDay);
                            const dw = dateToIsoWeek(date);
                            const inSameWeek = sw.year === dw.year && sw.week === dw.week;
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => inMonth && setSelDay(date)}
                                    className={[
                                        "rounded-md py-1.5 text-[12.5px]",
                                        inMonth ? "hover:bg-neutral-100" : "text-neutral-300",
                                        inSameWeek ? "bg-emerald-50 text-emerald-700" : "",
                                        isSelected ? "!bg-emerald-600 !text-white hover:!bg-emerald-600" : "",
                                    ].join(" ")}
                                >
                                    {pad(date.getDate())}
                                </button>
                            );
                        })}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                        <div className="ml-auto flex gap-2">
                            <button
                                type="button"
                                className="rounded-full border px-3 py-1.5 text-[12.5px] hover:bg-neutral-50"
                                onClick={() => {
                                    const yw = dateToIsoWeek(selDay);
                                    onChange(`${yw.year}W${pad(yw.week)}`);
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


