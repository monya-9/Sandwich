export function toRelativeTime(iso: string): string {
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diff = Math.max(0, now - then);

    const sec = Math.floor(diff / 1000);
    if (sec < 60) return `${sec}초 전`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}분 전`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}시간 전`;
    const day = Math.floor(hr / 24);
    return `${day}일 전`;
}

// 🔁 하위 호환용 별칭
export const timeAgo = toRelativeTime;
