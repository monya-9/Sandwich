// src/api/weeklyChallenge.ts

export type WeeklyChallengeData = {
  week: string;
  title: string;
  summary: string;
  must?: string[];
  md?: string;
  updated_at?: number;
};

function parseWeekly(json: any): WeeklyChallengeData {
  if (json?.data) {
    const d = json.data;
    return {
      week: json.week || d.week,
      title: d.title || "",
      summary: d.summary || "",
      must: d.must || d.must_have || [],
      md: d.md || "",
      updated_at: d.updated_at,
    };
  }
  throw new Error("Invalid weekly challenge response shape");
}

export async function fetchWeeklyLatest(baseUrl?: string): Promise<WeeklyChallengeData> {
  // 모든 환경에서 프록시 사용 (CORS 방지)
  const res = await fetch(`/ext/reco/weekly`, { credentials: "omit" });
  if (!res.ok) throw new Error(`주간 챌린지 조회 실패: ${res.status}`);
  const json = await res.json();
  return parseWeekly(json);
}

export async function fetchWeeklyByKey(week: string, baseUrl?: string): Promise<WeeklyChallengeData> {
  // 모든 환경에서 프록시 사용 (CORS 방지)
  const url = `/ext/reco/topics/weekly?week=${encodeURIComponent(week)}`;
  const res = await fetch(url, { credentials: "omit" });
  if (!res.ok) throw new Error(`주간(특정) 조회 실패: ${res.status}`);
  const json = await res.json();
  return parseWeekly(json);
}

// 유틸: AI 응답 원형(JSON) 그대로 반환 (폼 역매핑용)
export async function fetchWeeklyRaw(week: string, baseUrl?: string): Promise<any> {
  // 모든 환경에서 프록시 사용 (CORS 방지)
  const url = `/ext/reco/topics/weekly?week=${encodeURIComponent(week)}`;
  const res = await fetch(url, { credentials: "omit" });
  if (!res.ok) throw new Error(`주간(특정) 조회 실패: ${res.status}`);
  return await res.json();
}


