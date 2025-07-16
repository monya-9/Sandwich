// src/types/Project.ts
export type Category = 'Web' | 'App' | 'Game' | 'Blockchain' | 'UI/UX' | 'AI/ML';

export type Project = {
    id: number;
    title: string;
    authorId: number;
    likes: number;
    views: number;
    comments: number;
    categories: string[];
    uploadDate: string;
  };
  
