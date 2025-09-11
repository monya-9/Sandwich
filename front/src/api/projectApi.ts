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