// src/api/monthlyChallenge.ts
// 월간 챌린지 AI API 호출 유틸

export type MonthlyChallengeData = {
  id: number;
  title: string;
  description: string;
  theme: string;
  emoji: string;
  generatedAt: string;
  ym?: string; // YYYY-MM
  requirements?: string[];
  tips?: string[];
  mustHave?: string[];
  summary?: string;
};

export type MonthlyChallengeResponse = {
  data: MonthlyChallengeData;
  success: boolean;
  message?: string;
};

function parseMonthlyChallenge(json: any): MonthlyChallengeData {
  if (json?.data) {
    // API 응답에서 실제 필드 매핑
    const apiData = json.data;
    return {
      id: apiData.id || 1,
      title: apiData.title || "포트폴리오 챌린지",
      description: apiData.summary || apiData.description || "",
      theme: apiData.title || "", // title을 theme으로 사용
      emoji: "🎨", // 기본 이모지
      generatedAt: apiData.updated_at ? new Date(apiData.updated_at * 1000).toISOString() : new Date().toISOString(),
      ym: json.ym || apiData.ym,
      requirements: apiData.must_have || [],
      tips: [],
      mustHave: apiData.must_have || [],
      summary: apiData.summary || "",
    };
  }
  
  // 유효한 응답이 아니면 파싱 실패 처리 (더미 금지)
  throw new Error("Invalid monthly challenge response shape");
}

/**
 * 월간 챌린지 문제 조회
 * 기본 base는 제공받은 도메인으로 설정. 필요시 override 가능.
 */
export async function fetchMonthlyChallenge(baseUrl?: string): Promise<MonthlyChallengeData> {
  const isLocalDev = typeof window !== 'undefined' && /localhost:\d+/.test(window.location.host);

  if (isLocalDev) {
    // 로컬 개발에서는 프록시만 사용 (외부 직접 호출 금지: CORS 방지)
    const res = await fetch(`/ext/reco/monthly`, { credentials: "omit" });
    if (!res.ok) throw new Error(`월간 챌린지 프록시 조회 실패: ${res.status}`);
    const json = await res.json();
    return parseMonthlyChallenge(json);
  }

  // 운영/비-로컬 환경: 외부 공개 API 직접 호출 (환경변수 사용; 기본값 없음)
  const AI_BASE = (baseUrl ?? process.env.REACT_APP_AI_API_BASE)?.replace(/\/+$/, "");
  if (!AI_BASE) throw new Error("AI base URL is not configured (REACT_APP_AI_API_BASE)");
  const directUrl = `${AI_BASE}/api/reco/monthly`;
  const res = await fetch(directUrl, { credentials: "omit" });
  if (!res.ok) throw new Error(`월간 챌린지 조회 실패: ${res.status}`);
  const json = await res.json();
  return parseMonthlyChallenge(json);
}

/** 특정 월(MM) 조회: /api/reco/topics/monthly?ym=YYYY-MM */
export async function fetchMonthlyByYm(ym: string, baseUrl?: string): Promise<MonthlyChallengeData> {
  const isLocalDev = typeof window !== 'undefined' && /localhost:\d+/.test(window.location.host);
  if (isLocalDev) {
    const res = await fetch(`/ext/reco/topics/monthly?ym=${encodeURIComponent(ym)}`, { credentials: "omit" });
    if (!res.ok) throw new Error(`월간(특정) 프록시 조회 실패: ${res.status}`);
    const json = await res.json();
    return parseMonthlyChallenge(json);
  }
  const AI_BASE = (baseUrl ?? process.env.REACT_APP_AI_API_BASE)?.replace(/\/+$/, "");
  if (!AI_BASE) throw new Error("AI base URL is not configured (REACT_APP_AI_API_BASE)");
  const url = `${AI_BASE}/api/reco/topics/monthly?ym=${encodeURIComponent(ym)}`;
  const res = await fetch(url, { credentials: "omit" });
  if (!res.ok) throw new Error(`월간(특정) 조회 실패: ${res.status}`);
  const json = await res.json();
  return parseMonthlyChallenge(json);
}