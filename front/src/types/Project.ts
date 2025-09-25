// src/types/Project.ts
export type Category = 'Web' | 'App' | 'Game' | 'Blockchain' | 'UI/UX' | 'AI/ML';

// 프로젝트 소유자 정보 타입
export interface ProjectOwner {
  id: number;
  nickname: string;
  email: string;
  avatarUrl: string | null;
  username: string;
}

export type Project = {
    id: number;
    title: string | null;
    description?: string | null;
    coverUrl?: string | null;
    isTeam?: boolean | null;
    username?: string;
    shareUrl?: string;
    qrImageUrl?: string | null;
    owner?: ProjectOwner;  // 추가: 프로젝트 소유자 정보
    // 더미데이터용 필드들
    authorId?: number;
    likes?: number;
    views?: number;
    comments?: number;
    categories?: string[];
    uploadDate?: string;
    cover?: string;
};
  
