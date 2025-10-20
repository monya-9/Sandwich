// front/src/pages/admin/SecurityOtpHistoryPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { promRangeQuery, hoursAgoSec, nowSec, PromRangeVectorResult } from "../../api/prometheus";

interface Series {
    name: string;
    color: string;
    query: string;
}

const SERIES: Series[] = [
    { name: "발급", color: "#4f46e5", query: "sum(rate(otp_issued_total[5m]))" },
    { name: "성공", color: "#16a34a", query: "sum(rate(otp_verify_ok_total[5m]))" },
    { name: "실패", color: "#ef4444", query: "sum(rate(otp_verify_invalid_total[5m]))" },
    { name: "만료", color: "#f59e0b", query: "sum(rate(otp_verify_expired_total[5m]))" },
    { name: "잠금", color: "#000000", query: "sum(rate(otp_verify_locked_total[5m]))" },
];

function LineSpark({ points, color }: { points: Array<[number, number]>; color: string }) {
    // 간단한 SVG 스파크라인 렌더러 (외부 차트 라이브러리 무의존)
    const width = 360;
    const height = 80;
    const padding = 6;

    const path = useMemo(() => {
        if (!points.length) return "";
        const xs = points.map((p) => p[0]);
        const ys = points.map((p) => p[1]);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        const dx = maxX - minX || 1;
        const dy = maxY - minY || 1;
        const sx = (x: number) => padding + ((x - minX) / dx) * (width - padding * 2);
        const sy = (y: number) => height - padding - ((y - minY) / dy) * (height - padding * 2);

        return points
            .map((p, i) => `${i ? "L" : "M"}${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`)
            .join(" ");
    }, [points]);

    return (
        <svg width={width} height={height} className="block">
            <path d={path} stroke={color} strokeWidth={2} fill="none" />
        </svg>
    );
}

export default function SecurityOtpHistoryPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rangeData, setRangeData] = useState<Record<string, Array<[number, number]>>>({});
    const [hours, setHours] = useState(24);
    // 감사 로그 섹션 제거

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const end = nowSec();
                const start = hoursAgoSec(hours);
                const step = Math.max(30, Math.floor((end - start) / 120)); // 120포인트 내외

                const results = await Promise.all(
                    SERIES.map((s) => promRangeQuery(s.query, start, end, step))
                );

                if (!alive) return;
                const mapped: Record<string, Array<[number, number]>> = {};
                SERIES.forEach((s, i) => {
                    const vectors: PromRangeVectorResult[] = results[i];
                    const values = (vectors[0]?.values || []).map(([ts, v]) => [
                        typeof ts === "string" ? parseFloat(ts) : ts,
                        parseFloat(v),
                    ] as [number, number]);
                    mapped[s.name] = values;
                });
                setRangeData(mapped);

                // 감사 로그 API 연동 제거
            } catch (e: any) {
                setError(e?.message || "조회에 실패했습니다.");
            } finally {
                setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [hours]);

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-semibold mb-2 text-center">보안 ▸ OTP 이력</h1>
            <p className="text-gray-600 mb-6 text-center">Prometheus/Grafana 수집 지표 기반 실시간 모니터링</p>

            <div className="flex items-center gap-2 mb-4 justify-center">
                <label className="text-sm text-gray-600">조회 범위</label>
                <select
                    value={hours}
                    onChange={(e) => setHours(parseInt(e.target.value, 10))}
                    className="border rounded px-2 py-1 text-sm"
                >
                    <option value={1}>지난 1시간</option>
                    <option value={6}>지난 6시간</option>
                    <option value={12}>지난 12시간</option>
                    <option value={24}>지난 24시간</option>
                    <option value={48}>지난 48시간</option>
                    <option value={72}>지난 72시간</option>
                </select>
                {loading && <span className="text-sm text-gray-500">불러오는 중…</span>}
                {error && <span className="text-sm text-red-500">{error}</span>}
            </div>

            <div className="grid md:grid-cols-2 gap-6 justify-center">
                {SERIES.map((s) => (
                    <div key={s.name} className="border rounded-md p-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-medium" style={{ color: s.color }}>{s.name}</span>
                            <span className="text-xs text-gray-500">rate/5m</span>
                        </div>
                        <LineSpark points={rangeData[s.name] || []} color={s.color} />
                    </div>
                ))}
            </div>

            <div className="mt-8 max-w-2xl mx-auto text-center">
                <h2 className="text-lg font-semibold mb-2 text-center">설명</h2>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 text-center">
                    <li>OTP 발급/검증 이벤트를 Micrometer 카운터로 노출합니다.</li>
                    <li>Prometheus가 /actuator/prometheus 를 스크랩하고 Grafana로 시각화합니다.</li>
                    <li>관리자 페이지에서는 지난 기간 동안의 발급/성공/실패/만료/잠금을 확인합니다.</li>
                </ul>
            </div>
            
        </div>
    );
}


