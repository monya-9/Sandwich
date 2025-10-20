// src/api/reco.ts
// 외부 AI 추천 API 호출 유틸

export type RecoItem = {
	project_id: number;
	score: number;
};

export type RecoResponse = {
	total?: number;
	data: RecoItem[];
};

function parseReco(json: any): RecoItem[] {
	if (Array.isArray(json)) return json as RecoItem[];
	if (Array.isArray(json?.data)) return json.data as RecoItem[];
	if (Array.isArray(json?.items)) return json.items as RecoItem[];
	return [];
}

/**
 * 사용자별 추천 프로젝트 목록(ID+score)
 * 기본 base는 제공받은 도메인으로 설정. 필요시 override 가능.
 */
export async function fetchUserRecommendations(userId: number, baseUrl?: string): Promise<RecoItem[]> {
    const isLocalDev = typeof window !== 'undefined' && /localhost:\d+/.test(window.location.host);

    if (isLocalDev) {
        // 로컬 개발에서는 프록시만 사용 (외부 직접 호출 금지: CORS 방지)
        const res = await fetch(`/ext/reco/user/${userId}`, { credentials: "omit" });
        if (!res.ok) throw new Error(`사용자 추천 프록시 조회 실패: ${res.status}`);
        const json = await res.json();
        return parseReco(json);
    }

    // 운영/비-로컬 환경: 외부 공개 API 직접 호출 (환경변수 사용; 기본값 없음)
    const AI_BASE = (baseUrl ?? process.env.REACT_APP_AI_API_BASE)?.replace(/\/+$/, "");
    if (!AI_BASE) throw new Error("AI base URL is not configured (REACT_APP_AI_API_BASE)");
    const directUrl = `${AI_BASE}/api/reco/user/${userId}`;
    const res = await fetch(directUrl, { credentials: "omit" });
    if (!res.ok) {
        throw new Error(`추천 조회 실패: ${res.status}`);
    }
    const json = await res.json();
    return parseReco(json);
}

/**
 * 주간 TOP 프로젝트 목록(ID+score)
 * 로그인 여부와 무관하게 공개 API 사용
 */
export async function fetchWeeklyTop(baseUrl?: string): Promise<RecoItem[]> {
	const isLocalDev = typeof window !== 'undefined' && /localhost:\d+/.test(window.location.host);

	if (isLocalDev) {
		// 로컬 개발에서는 프록시만 사용 (외부 직접 호출 금지: CORS 방지)
		const res = await fetch(`/ext/reco/top/week`, { credentials: "omit" });
		if (!res.ok) throw new Error(`주간 TOP 프록시 조회 실패: ${res.status}`);
		const json = await res.json();
		return parseReco(json);
	}

	// 운영/비-로컬 환경: 외부 공개 API 직접 호출 (환경변수 사용; 기본값 없음)
	const AI_BASE = (baseUrl ?? process.env.REACT_APP_AI_API_BASE)?.replace(/\/+$/, "");
	if (!AI_BASE) throw new Error("AI base URL is not configured (REACT_APP_AI_API_BASE)");
	const directUrl = `${AI_BASE}/api/reco/top/week`;
	const res = await fetch(directUrl, { credentials: "omit" });
	if (!res.ok) throw new Error(`주간 TOP 조회 실패: ${res.status}`);
	const json = await res.json();
	return parseReco(json);
} 