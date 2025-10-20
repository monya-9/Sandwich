// front/src/api/prometheus.ts
// Prometheus HTTP API 호출 유틸 (개발 환경에선 setupProxy 의 /prom 프록시를 통해 접근)

export type PromValue = [number | string, string];

export interface PromInstantVectorResult {
    metric: Record<string, string>;
    value: PromValue;
}

export interface PromRangeVectorResult {
    metric: Record<string, string>;
    values: PromValue[];
}

interface PromResponseBase<T> {
    status: "success" | "error";
    data?: T;
    errorType?: string;
    error?: string;
}

interface InstantData {
    resultType: "vector" | string;
    result: PromInstantVectorResult[];
}

interface RangeData {
    resultType: "matrix" | string;
    result: PromRangeVectorResult[];
}

const PROM_BASE = "/prom/api/v1"; // dev 프록시 기준 경로

export async function promQuery(query: string): Promise<PromInstantVectorResult[]> {
    const url = `${PROM_BASE}/query?query=${encodeURIComponent(query)}`;
    const res = await fetch(url, { credentials: "same-origin" });
    if (!res.ok) throw new Error(`Prometheus query failed: ${res.status}`);
    const body: PromResponseBase<InstantData> = await res.json();
    if (body.status !== "success" || !body.data) return [];
    return body.data.result || [];
}

export async function promRangeQuery(
    query: string,
    startEpochSec: number,
    endEpochSec: number,
    stepSec: number
): Promise<PromRangeVectorResult[]> {
    const params = new URLSearchParams({
        query,
        start: String(startEpochSec),
        end: String(endEpochSec),
        step: String(stepSec),
    });
    const url = `${PROM_BASE}/query_range?${params.toString()}`;
    const res = await fetch(url, { credentials: "same-origin" });
    if (!res.ok) throw new Error(`Prometheus range query failed: ${res.status}`);
    const body: PromResponseBase<RangeData> = await res.json();
    if (body.status !== "success" || !body.data) return [];
    return body.data.result || [];
}

export function nowSec(): number {
    return Math.floor(Date.now() / 1000);
}

export function hoursAgoSec(hours: number): number {
    return nowSec() - Math.floor(hours * 3600);
}


