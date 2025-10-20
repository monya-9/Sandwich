import api from "./axiosInstance";

export type CollectionFolder = {
  id: number;
  title: string;
  description?: string | null;
  private: boolean;
  itemCount?: number;
};

export async function createCollectionFolder(payload: { title: string; description?: string; private: boolean }): Promise<{ id: number }> {
  const body: any = { ...payload, isPrivate: payload.private };
  const { data } = await api.post<{ id: number }>(`/collections/folders`, body);
  return data;
}

export async function listMyCollectionFolders(): Promise<CollectionFolder[]> {
  const { data } = await api.get<CollectionFolder[]>(`/collections/folders/me`);
  return data || [];
}

export async function getCollectionFolder(id: number): Promise<CollectionFolder> {
  const { data } = await api.get<CollectionFolder>(`/collections/folders/${id}`);
  return data as any;
}

export async function updateCollectionFolder(id: number, payload: { title: string; description?: string; private: boolean }): Promise<void> {
  const body: any = { ...payload, isPrivate: payload.private };
  await api.put(`/collections/folders/${id}`, body);
}

export async function deleteCollectionFolder(id: number): Promise<void> {
  await api.delete(`/collections/folders/${id}`);
}

// 프로젝트를 하나 이상의 폴더에 저장
export async function addProjectToCollections(projectId: number, folderIds: number[]): Promise<void> {
  await api.post(`/collections`, { projectId, folderIds });
}

// 특정 폴더에서 프로젝트 제거
export async function removeProjectFromCollection(projectId: number, folderId: number): Promise<void> {
  await api.delete(`/collections`, { data: { projectId, folderId } });
} 