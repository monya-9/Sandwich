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
  deployEnabled?: boolean;
  qrCodeEnabled?: boolean;
  qrImageUrl?: string;
  frontendBuildCommand?: string;
  backendBuildCommand?: string;
  portNumber?: number;
  extraRepoUrl?: string;
  githubOwner?: string;
  githubRepo?: string;
  githubBaseBranch?: string;
};

export async function fetchProjectDetail(userId: number, projectId: number, baseUrl: string = ""): Promise<ProjectDetailResponse> {
  // ✅ public API: URL 패턴으로 이미 처리됨 (헤더 불필요)
  if (baseUrl) {
    const url = `${baseUrl}/api/projects/${userId}/${projectId}`.replace(/\/+/, "/");
    const res = await api.get(url);
    return res.data;
  }
  const res = await api.get(`/projects/${userId}/${projectId}`);
  return res.data;
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
  deployEnabled?: boolean;
  qrCodeEnabled?: boolean;
  frontendBuildCommand?: string;
  backendBuildCommand?: string;
  portNumber?: number;
  extraRepoUrl?: string;
  envValues?: string;
  githubOwner?: string;
  githubRepo?: string;
  githubBaseBranch?: string;
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


export async function createProject(payload: ProjectRequest, baseUrl: string = ""): Promise<ProjectCreateResponse> {
  if (baseUrl) {
    const url = `${baseUrl}/api/projects`.replace(/\/+/, "/");
    const res = await api.post(url, payload);
    return res.data as ProjectCreateResponse;
  }
  const r = await api.post(`/projects`, payload);
  return r.data as ProjectCreateResponse;
}

export async function updateProject(userId: number, projectId: number, payload: ProjectRequest, baseUrl: string = ""): Promise<void> {
  if (baseUrl) {
    const url = `${baseUrl}/api/projects/${userId}/${projectId}`.replace(/\/+/, "/");
    await api.put(url, payload);
    return;
  }
  await api.put(`/projects/${userId}/${projectId}`, payload);
}

export async function deleteProject(userId: number, projectId: number, baseUrl: string = ""): Promise<void> {
  if (baseUrl) {
    const url = `${baseUrl}/api/projects/${userId}/${projectId}`.replace(/\/+/, "/");
    await api.delete(url);
    return;
  }
  await api.delete(`/projects/${userId}/${projectId}`);
}

export type ProjectContentResponseItem = { id: number; type: "IMAGE" | "TEXT" | "VIDEO"; data: string; order: number };

export async function fetchProjectContents(userId: number, projectId: number, baseUrl: string = ""): Promise<ProjectContentResponseItem[]> {
  // ✅ public API: URL 패턴으로 이미 처리됨 (헤더 불필요)
  if (baseUrl) {
    const url = `${baseUrl}/api/projects/${userId}/${projectId}/contents`.replace(/\/+/, "/");
    const res = await api.get(url);
    return res.data;
  }
  
  const res = await api.get(`/projects/${userId}/${projectId}/contents`);
  return res.data;
}

export async function deleteAllProjectContents(userId: number, projectId: number, baseUrl: string = ""): Promise<void> {
  const items = await fetchProjectContents(userId, projectId, baseUrl).catch(() => [] as ProjectContentResponseItem[]);
  if (baseUrl) {
    await Promise.all(
      items.map(async (it) => {
        const url = `${baseUrl}/api/projects/${userId}/${projectId}/contents/${it.id}`.replace(/\/+/, "/");
        await api.delete(url).catch(() => {}); // 개별 실패는 무시
      })
    );
    return;
  }
  await Promise.all(items.map((it) => api.delete(`/projects/${userId}/${projectId}/contents/${it.id}`).catch(() => {})));
}

export type ImageUploadResponse = { url: string };

export async function uploadImage(file: File): Promise<ImageUploadResponse> {
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

export async function createGithubBranchAndPR(
  projectId: number,
  params: {
    owner: string;
    repo: string;
    baseBranch: string;
    token: string;
    frontendBuildCommand: string;
    backendBuildCommand: string;
  },
  baseUrl: string = ""
): Promise<string> {
  if (baseUrl) {
    const url = `${baseUrl}/api/github/${projectId}/branches-with-file-and-pr`.replace(/\/+/, "/");
    const res = await api.post(url, 
      new URLSearchParams({
        owner: params.owner,
        repo: params.repo,
        baseBranch: params.baseBranch,
        frontendBuildCommand: params.frontendBuildCommand,
        backendBuildCommand: params.backendBuildCommand,
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "X-GitHub-Token": params.token,
        }
      }
    );
    return res.data;
  }
  
  const res = await api.post(`/github/${projectId}/branches-with-file-and-pr`, 
    new URLSearchParams({
      owner: params.owner,
      repo: params.repo,
      baseBranch: params.baseBranch,
      frontendBuildCommand: params.frontendBuildCommand,
      backendBuildCommand: params.backendBuildCommand,
    }).toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "X-GitHub-Token": params.token,
      }
    }
  );
  return res.data;
}

export type ProjectContentUpsertItem = { type: "IMAGE" | "TEXT" | "VIDEO"; data: string; order: number }; // data may contain JSON with {src,pad,full} for IMAGE/VIDEO

export async function saveProjectContents(userId: number, projectId: number, items: ProjectContentUpsertItem[], baseUrl: string = ""): Promise<void> {
  if (baseUrl) {
    const url = `${baseUrl}/api/projects/${userId}/${projectId}/contents`.replace(/\/+/, "/");
    await api.post(url, items);
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
  const headers: Record<string, string> = {};

  if (githubToken) {
    headers["X-GitHub-Token"] = githubToken;
  }

  const queryParams = new URLSearchParams();
  if (owner) queryParams.append("owner", owner);
  if (repo) queryParams.append("repo", repo);

  const url = `/env/add/${projectId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const res = await api.post(url, envVars, { headers });
  return res.data;
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
  const headers: Record<string, string> = {
    "X-GitHub-Token": githubToken,
  };

  const queryParams = new URLSearchParams();
  queryParams.append("owner", owner);
  queryParams.append("repo", repo);
  queryParams.append("branch", branch);

  const url = `/env/${projectId}/env?${queryParams.toString()}`;

  const res = await api.post(url, envVar, { headers });
  return res.data;
}

// 환경변수 GitHub 동기화 API (백엔드 스펙에 맞게 추가)
export async function syncEnvVarsToGitHub(
  projectId: number,
  githubToken: string,
  owner: string,
  repo: string
): Promise<any> {
  const headers: Record<string, string> = {
    "X-GitHub-Token": githubToken,
  };

  const queryParams = new URLSearchParams();
  queryParams.append("owner", owner);
  queryParams.append("repo", repo);

  const url = `/env/sync/${projectId}?${queryParams.toString()}`;

  const res = await api.post(url, {}, { headers });
  return res.data;
}

// 배포 파일 업로드 (S3 - sandwich-user-projects)
export async function uploadDeployFile(userId: number | string, projectId: number, file: File): Promise<string> {
  const url = `/deploy/files/${userId}/${projectId}`;
  const form = new FormData();
  form.append("file", file);
  
  const res = await api.post(url, form);
  return res.data; // 서버가 fileUrl 문자열을 반환
}

// 배포 파일 삭제 (fileUrl로 삭제)
export async function deleteDeployFile(fileUrl: string): Promise<void> {
  const url = `/deploy/files?${new URLSearchParams({ fileUrl }).toString()}`;
  
  await api.delete(url);
}

// 환경변수 조회 API (백엔드 스펙에 맞게 추가)
export async function getEnvVars(projectId: number): Promise<any[]> {
  const res = await api.get(`/env/${projectId}`);
  return res.data;
}
