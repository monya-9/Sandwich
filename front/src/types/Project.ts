// src/types/Project.ts
export type Category = 'Web' | 'App' | 'Game' | 'Blockchain' | 'UI/UX' | 'AI/ML';

export type Project = {
    id: number;
    title: string | null;
    description?: string | null;
    coverUrl?: string | null;
    isTeam?: boolean | null;
    username?: string;
    shareUrl?: string;
    qrImageUrl?: string | null;
    // 더미데이터용 필드들
    authorId?: number;
    likes?: number;
    views?: number;
    comments?: number;
    categories?: string[];
    uploadDate?: string;
    cover?: string;
};
  
