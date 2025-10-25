// src/utils/getProjectCover.ts
import type { Project } from "../types/Project";
import { getStaticUrl } from "../config/staticBase";

/** 실제 public/images/projects 파일들에 맞추세요 (예: 01~17은 jpg, 18은 png) */
export const LOCAL_IMAGES = [
    ...Array.from({ length: 17 }, (_, i) => `${String(i + 1).padStart(2, "0")}.jpg`),
    "18.png",
] as const;

function normalizeIndex(n: number) {
    const len = LOCAL_IMAGES.length;
    return ((n % len) + len) % len; // 음수 방지
}

/** 리스트 내 '위치'(0-based index)로 커버 선택 → 한 리스트 안에서 중복 방지 */
export function coverByIndex(position: number, basePath = "/images/projects") {
    const file = LOCAL_IMAGES[normalizeIndex(position)];
    return getStaticUrl(`${basePath}/${file}`);
}

/** id 기반(이전 방식). 여러 리스트/페이지에서도 안정적인 매핑 */
export function coverById(p: Pick<Project, "id">, basePath = "/images/projects") {
    const idx0 = normalizeIndex((p.id ?? 1) - 1);
    const file = LOCAL_IMAGES[idx0];
    return getStaticUrl(`${basePath}/${file}`);
}

/** cover 우선 → position 있으면 index 기반 → 없으면 id 기반 */
export function resolveCover(
    p: Pick<Project, "id" | "cover">,
    opts?: { position?: number; basePath?: string }
) {
    if (p.cover) return p.cover;
    const base = opts?.basePath ?? "/images/projects";
    if (typeof opts?.position === "number") return coverByIndex(opts.position, base);
    return coverById(p, base);
}

/** 확장자 jpg ↔ png 스왑 */
export function swapJpgPng(url: string) {
    if (url.endsWith(".jpg")) return url.slice(0, -4) + ".png";
    if (url.endsWith(".png")) return url.slice(0, -4) + ".jpg";
    return url;
}
