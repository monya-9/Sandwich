// src/api/userMini.ts
// 숫자 userId -> 사용자 표시 이름 조회 (여러 후보 경로를 시도)

import api from "./axiosInstance";

export type UserMini = {
  id?: number;
  username?: string;
  userName?: string;
  nickname?: string;
  displayName?: string;
  email?: string;
};

const CANDIDATE_USER_PATHS = (id: string) => [
  `users/${id}`,
  `profiles/${id}`,
  `members/${id}`,
  `user/${id}`,
  `profile/${id}`,
];

async function tryGet<T = any>(path: string): Promise<T | null> {
  try {
    const { data } = await api.get<T>(path);
    return data as any;
  } catch {
    return null;
  }
}

function firstNonEmpty(...vals: Array<unknown>): string | undefined {
  for (const v of vals) {
    if (v == null) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return undefined;
}

function toDisplayName(mini: UserMini | null | undefined): string | null {
  if (!mini) return null;
  const emailLocal =
    typeof mini.email === "string" && mini.email.includes("@")
      ? mini.email.split("@")[0]
      : mini.email;
  return (
    firstNonEmpty(mini.nickname, mini.displayName, mini.username, mini.userName, emailLocal) ||
    null
  );
}

/** 주어진 내부 userId(숫자)로 사용자 표시 이름을 조회한다. 실패 시 null */
export async function fetchUserNameById(userId: number | string): Promise<string | null> {
  const id = String(userId);
  for (const p of CANDIDATE_USER_PATHS(id)) {
    const got = await tryGet<UserMini>(p);
    const name = toDisplayName(got);
    if (name) return name;
  }
  return null;
}


