// src/api/monthlyChallenge.ts
// 월간 챌린지 AI API 호출 유틸

export type MonthlyChallengeData = {
  id: number;
  title: string;
  description: string;
  theme: string;
  emoji: string;
  generatedAt: string;
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
      requirements: apiData.must_have || [],
      tips: [],
      mustHave: apiData.must_have || [],
      summary: apiData.summary || "",
    };
  }
  
  // 기본값 반환
  return {
    id: 1,
    title: "포트폴리오 챌린지: 🎨 레트로 감성의 개발자 블로그",
    description: "AI 모델이 자동 생성한 테마 기반의 월간 챌린지입니다.\n이번 테마는 \"레트로 감성의 개발자 블로그\". 80~90년대 무드를 현대적으로 재해석해 포트폴리오를 제작해 보세요.\n팀/개인 모두 가능하며, 결과는 사용자 투표 100%로 결정됩니다.",
    theme: "레트로 감성의 개발자 블로그",
    emoji: "🎨",
    generatedAt: new Date().toISOString(),
    requirements: [],
    tips: [],
    mustHave: [],
    summary: "",
  };
}

/**
 * 월간 챌린지 문제 조회
 * 기본 base는 제공받은 도메인으로 설정. 필요시 override 가능.
 */
export async function fetchMonthlyChallenge(baseUrl: string = "https://api.dnutzs.org"): Promise<MonthlyChallengeData> {
  const isLocalDev = typeof window !== 'undefined' && /localhost:\d+/.test(window.location.host);

  if (isLocalDev) {
    // 로컬 개발에서는 프록시만 사용 (외부 직접 호출 금지: CORS 방지)
    const res = await fetch(`/ext/reco/monthly`, { credentials: "omit" });
    if (!res.ok) {
      console.warn(`월간 챌린지 프록시 조회 실패: ${res.status}, 기본값 사용`);
      return parseMonthlyChallenge({});
    }
    const json = await res.json();
    return parseMonthlyChallenge(json);
  }

  // 운영/비-로컬 환경: 외부 공개 API 직접 호출
  const directUrl = `${baseUrl}/api/reco/monthly`;
  const res = await fetch(directUrl, { credentials: "omit" });
  if (!res.ok) {
    console.warn(`월간 챌린지 조회 실패: ${res.status}, 기본값 사용`);
    return parseMonthlyChallenge({});
  }
  const json = await res.json();
  return parseMonthlyChallenge(json);
}
