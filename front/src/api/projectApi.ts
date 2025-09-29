export type ProjectDetailResponse = {
  projectId: number;
  title: string;
  description?: string;
  image?: string;
  tools?: string;
  repositoryUrl?: string;
  demoUrl?: string;
  startYear?: number;
  endYear?: number;
  isTeam?: boolean;
  teamSize?: number;
  coverUrl?: string;
  shareUrl?: string;
  qrCodeEnabled?: boolean;
  qrImageUrl?: string;
  frontendBuildCommand?: string;
  backendBuildCommand?: string;
  portNumber?: number;
  extraRepoUrl?: string;
};

export async function fetchProjectDetail(userId: number, projectId: number, baseUrl: string = ""): Promise<ProjectDetailResponse> {
  const url = `${baseUrl}/api/projects/${userId}/${projectId}`.replace(/\/+/, "/");
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`프로젝트 상세 조회 실패: ${res.status}`);
  }
  return res.json();
}

export type ProjectRequest = {
  title?: string;
  description?: string;
  image?: string;
  tools?: string;
  repositoryUrl?: string;
  demoUrl?: string;
  startYear?: number;
  endYear?: number;
  isTeam?: boolean;
  teamSize?: number;
  coverUrl?: string;
  shareUrl?: string;
  qrCodeEnabled?: boolean;
  frontendBuildCommand?: string;
  backendBuildCommand?: string;
  portNumber?: number;
  extraRepoUrl?: string;
};

export type ProjectCreateResponse = {
  projectId: number;
  previewUrl: string;
};

function getToken() {
  return typeof window !== "undefined" ? (localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken")) : null;
}

export async function createProject(payload: ProjectRequest, baseUrl: string = ""): Promise<ProjectCreateResponse> {
  const url = `${baseUrl}/api/projects`.replace(/\/+/, "/");
  const token = getToken();
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`프로젝트 생성 실패: ${res.status}${text ? ` - ${text}` : ""}`);
  }
  return res.json();
}

export async function updateProject(userId: number, projectId: number, payload: ProjectRequest, baseUrl: string = ""): Promise<void> {
  const url = `${baseUrl}/api/projects/${userId}/${projectId}`.replace(/\/+/, "/");
  const token = getToken();
  const res = await fetch(url, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`프로젝트 수정 실패: ${res.status}${text ? ` - ${text}` : ""}`);
  }
}

export async function deleteProject(userId: number, projectId: number, baseUrl: string = ""): Promise<void> {
  const url = `${baseUrl}/api/projects/${userId}/${projectId}`.replace(/\/+/, "/");
  const token = getToken();
  const res = await fetch(url, {
    method: "DELETE",
    credentials: "include",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`프로젝트 삭제 실패: ${res.status}${text ? ` - ${text}` : ""}`);
  }
}

export type ProjectContentResponseItem = { id: number; type: "IMAGE" | "TEXT" | "VIDEO"; data: string; order: number };

export async function fetchProjectContents(userId: number, projectId: number, baseUrl: string = ""): Promise<ProjectContentResponseItem[]> {
  // baseUrl이 있으면 직접 fetch 사용 (외부 API 호출)
  if (baseUrl) {
    const url = `${baseUrl}/api/projects/${userId}/${projectId}/contents`.replace(/\/+/, "/");
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error(`콘텐츠 조회 실패: ${res.status}`);
    return res.json();
  }
  
  // baseUrl이 없으면 api 인스턴스 사용 (리프레시 토큰 적용)
  const api = (await import("./axiosInstance")).default;
  const res = await api.get(`/projects/${userId}/${projectId}/contents`);
  return res.data;
}

export async function deleteAllProjectContents(userId: number, projectId: number, baseUrl: string = ""): Promise<void> {
  const items = await fetchProjectContents(userId, projectId, baseUrl).catch(() => [] as ProjectContentResponseItem[]);
  const token = getToken();
  await Promise.all(
    items.map(async (it) => {
      const url = `${baseUrl}/api/projects/${userId}/${projectId}/contents/${it.id}`.replace(/\/+/, "/");
      const res = await fetch(url, {
        method: "DELETE",
        credentials: "include",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) {
        // 개별 실패는 무시
      }
    })
  );
}

export type ImageUploadResponse = { url: string };

export async function uploadImage(file: File, baseUrl: string = ""): Promise<ImageUploadResponse> {
  const url = `${baseUrl}/api/upload/image`.replace(/\/+/, "/");
  const token = getToken();
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`이미지 업로드 실패: ${res.status}${text ? ` - ${text}` : ""}`);
  }
  return res.json();
} 

export type ProjectContentItem = {
  type: 'IMAGE' | 'TEXT' | 'VIDEO';
  data: string;
  order: number;
};

export async function createGithubBranchAndPR(projectId: number, params: { owner: string; repo: string; baseBranch: string; token: string }, baseUrl: string = ""): Promise<string> {
  const url = `${baseUrl}/api/github/${projectId}/branches-with-file-and-pr`.replace(/\/+/, "/");
  const token = getToken();
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "X-GitHub-Token": params.token,
    },
    body: new URLSearchParams({ owner: params.owner, repo: params.repo, baseBranch: params.baseBranch }).toString(),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GitHub 브랜치/PR 생성 실패: ${res.status}${text ? ` - ${text}` : ""}`);
  }
  return res.text();
}

export type ProjectContentUpsertItem = { type: "IMAGE" | "TEXT" | "VIDEO"; data: string; order: number }; // data may contain JSON with {src,pad,full} for IMAGE/VIDEO

export async function saveProjectContents(userId: number, projectId: number, items: ProjectContentUpsertItem[], baseUrl: string = ""): Promise<void> {
  const url = `${baseUrl}/api/projects/${userId}/${projectId}/contents`.replace(/\/+/, "/");
  const token = getToken();
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(items),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`콘텐츠 저장 실패: ${res.status}${text ? ` - ${text}` : ""}`);
  }
}