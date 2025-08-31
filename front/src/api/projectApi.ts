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

export async function createProject(payload: ProjectRequest, baseUrl: string = ""): Promise<ProjectCreateResponse> {
  const url = `${baseUrl}/api/projects`.replace(/\/+/, "/");
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
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

export type ImageUploadResponse = { url: string };

export async function uploadImage(file: File, baseUrl: string = ""): Promise<ImageUploadResponse> {
  const url = `${baseUrl}/api/upload/image`.replace(/\/+/, "/");
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
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