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

/**
 * 사용자별 추천 프로젝트 목록(ID+score)
 * 기본 base는 제공받은 도메인으로 설정. 필요시 override 가능.
 */
export async function fetchUserRecommendations(userId: number, baseUrl: string = "https://api.dnutzs.org"): Promise<RecoItem[]> {
	const url = `${baseUrl}/api/reco/user/${userId}`;
	const res = await fetch(url, { credentials: "omit" });
	if (!res.ok) {
		throw new Error(`추천 조회 실패: ${res.status}`);
	}
	const json = (await res.json()) as RecoResponse;
	return Array.isArray(json?.data) ? json.data : [];
} 