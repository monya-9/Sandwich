// Discovery API: HOT 개발자 조회
import api from './axiosInstance';

/**
 * HOT 개발자 프로젝트 정보
 */
export interface HotDeveloperProject {
  projectId: number;
  coverUrl: string | null;
}

/**
 * HOT 개발자 정보
 */
export interface HotDeveloper {
  userId: number;
  nickname: string | null;
  position: string | null;
  avatarUrl: string | null;
  trendScore: number;
  projects: HotDeveloperProject[];
}

/**
 * HOT 개발자 목록 조회
 * @param limit - 조회할 개발자 수 (기본값: 12)
 * @param offset - 시작 위치 (기본값: 0)
 */
export const fetchHotDevelopers = async (
  limit: number = 12,
  offset: number = 0
): Promise<HotDeveloper[]> => {
  const response = await api.get(`/discovery/hot-developers`, {
    params: { limit, offset },
  });
  return response.data;
};

/**
 * HOT 개발자 캐시 무효화 (관리자용)
 */
export const evictHotDevelopersCache = async (): Promise<void> => {
  await api.post('/internal/discovery/hot-developers/cache/evict');
};

