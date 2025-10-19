import api from "./axiosInstance";

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
  envValues?: string;
};

export type ProjectCreateResponse = {
  projectId: number;
  previewUrl: string;
};

// 환경변수 관련 타입들
export type EnvVarRequest = {
  keyName: string;
  value: string;
};

export type EnvVarResponse = {
  keyName: string;
  status: 'OK' | 'FAILED';
  message: string | null;
};

export type EnvBulkResponse = {
  summary: {
    total: number;
    created: number;
    githubUploaded: number;
    githubFailed?: number;
  };
  items: EnvVarResponse[];
};

function getToken() {
  return typeof window !== "undefined" ? (localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken")) : null;
}

export async function createProject(payload: ProjectRequest, baseUrl: string = ""): Promise<ProjectCreateResponse> {
  if (baseUrl) {
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
  const r = await api.post(`/projects`, payload);
  return r.data as ProjectCreateResponse;
}

export async function updateProject(userId: number, projectId: number, payload: ProjectRequest, baseUrl: string = ""): Promise<void> {
  if (baseUrl) {
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
    return;
  }
  await api.put(`/projects/${userId}/${projectId}`, payload);
}

export async function deleteProject(userId: number, projectId: number, baseUrl: string = ""): Promise<void> {
  if (baseUrl) {
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
    return;
  }
  await api.delete(`/projects/${userId}/${projectId}`);
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
  const res = await api.get(`/projects/${userId}/${projectId}/contents`);
  return res.data;
}

export async function deleteAllProjectContents(userId: number, projectId: number, baseUrl: string = ""): Promise<void> {
  const items = await fetchProjectContents(userId, projectId, baseUrl).catch(() => [] as ProjectContentResponseItem[]);
  if (baseUrl) {
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
    return;
  }
  await Promise.all(items.map((it) => api.delete(`/projects/${userId}/${projectId}/contents/${it.id}`).catch(() => {})));
}

export type ImageUploadResponse = { url: string };

export async function uploadImage(file: File, baseUrl: string = ""): Promise<ImageUploadResponse> {
  if (baseUrl) {
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
  const form = new FormData();
  form.append("file", file);
  const r = await api.post(`/upload/image`, form);
  return r.data as ImageUploadResponse;
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
  if (baseUrl) {
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
    return;
  }
  await api.post(`/projects/${userId}/${projectId}/contents`, items);
}

// 환경변수 bulk add API
export async function addEnvVarsBulk(
  projectId: number, 
  envVars: EnvVarRequest[], 
  githubToken?: string,
  owner?: string,
  repo?: string
): Promise<EnvBulkResponse> {
  const token = getToken();
  if (!token) throw new Error("인증 토큰이 없습니다.");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };

  if (githubToken) {
    headers["X-GitHub-Token"] = githubToken;
  }

  const queryParams = new URLSearchParams();
  if (owner) queryParams.append("owner", owner);
  if (repo) queryParams.append("repo", repo);

  const url = `/api/env/add/${projectId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(envVars),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `환경변수 등록 실패: ${res.status}`);
  }

  return res.json();
}

// 환경변수 개별 등록 API (백엔드 스펙에 맞게 추가)
export async function addEnvVar(
  projectId: number,
  envVar: EnvVarRequest,
  githubToken: string,
  owner: string,
  repo: string,
  branch: string
): Promise<EnvVarResponse> {
  const token = getToken();
  if (!token) throw new Error("인증 토큰이 없습니다.");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
    "X-GitHub-Token": githubToken,
  };

  const queryParams = new URLSearchParams();
  queryParams.append("owner", owner);
  queryParams.append("repo", repo);
  queryParams.append("branch", branch);

  const url = `/api/env/${projectId}/env?${queryParams.toString()}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(envVar),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `환경변수 등록 실패: ${res.status}`);
  }

  return res.json();
}

// 환경변수 GitHub 동기화 API (백엔드 스펙에 맞게 추가)
export async function syncEnvVarsToGitHub(
  projectId: number,
  githubToken: string,
  owner: string,
  repo: string
): Promise<any> {
  const token = getToken();
  if (!token) throw new Error("인증 토큰이 없습니다.");

  const headers: Record<string, string> = {
    "Authorization": `Bearer ${token}`,
    "X-GitHub-Token": githubToken,
  };

  const queryParams = new URLSearchParams();
  queryParams.append("owner", owner);
  queryParams.append("repo", repo);

  const url = `/api/env/sync/${projectId}?${queryParams.toString()}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `GitHub 동기화 실패: ${res.status}`);
  }

  return res.json();
}

// 환경변수 조회 API (백엔드 스펙에 맞게 추가)
export async function getEnvVars(projectId: number): Promise<any[]> {
  const token = getToken();
  if (!token) throw new Error("인증 토큰이 없습니다.");

  const res = await fetch(`/api/env/${projectId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `환경변수 조회 실패: ${res.status}`);
  }

  return res.json();
}