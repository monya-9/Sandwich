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
  const isLocalDev = typeof window !== 'undefined' && /localhost:\d+/.test(window.location.host);
  if (isLocalDev) {
    const res = await fetch(`/ext/reco/weekly`, { credentials: "omit" });
    if (!res.ok) throw new Error(`주간 챌린지 프록시 조회 실패: ${res.status}`);
    const json = await res.json();
    return parseWeekly(json);
  }
  const AI_BASE = (baseUrl ?? process.env.REACT_APP_AI_API_BASE)?.replace(/\/+$/, "");
  if (!AI_BASE) throw new Error("AI base URL is not configured (REACT_APP_AI_API_BASE)");
  const res = await fetch(`${AI_BASE}/api/reco/weekly`, { credentials: "omit" });
  if (!res.ok) throw new Error(`주간 챌린지 조회 실패: ${res.status}`);
  const json = await res.json();
  return parseWeekly(json);
}

export async function fetchWeeklyByKey(week: string, baseUrl?: string): Promise<WeeklyChallengeData> {
  const isLocalDev = typeof window !== 'undefined' && /localhost:\d+/.test(window.location.host);
  if (isLocalDev) {
    const url = `/ext/reco/topics/weekly?week=${encodeURIComponent(week)}`;
    const res = await fetch(url, { credentials: "omit" });
    if (!res.ok) throw new Error(`주간(특정) 프록시 조회 실패: ${res.status}`);
    const json = await res.json();
    return parseWeekly(json);
  }
  const AI_BASE = (baseUrl ?? process.env.REACT_APP_AI_API_BASE)?.replace(/\/+$/, "");
  if (!AI_BASE) throw new Error("AI base URL is not configured (REACT_APP_AI_API_BASE)");
  const url = `${AI_BASE}/api/reco/topics/weekly?week=${encodeURIComponent(week)}`;
  const res = await fetch(url, { credentials: "omit" });
  if (!res.ok) throw new Error(`주간(특정) 조회 실패: ${res.status}`);
  const json = await res.json();
  return parseWeekly(json);
}


