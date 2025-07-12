// src/types/Project.ts
// 분리형
export type Category = 'Web' | 'App' | 'Game' | 'Blockchain' | 'UI/UX' | 'AI/ML';

export type Project = {
  id: number;
  title: string;
  author: string;
  likes: number;
  views: number;
  comments: number;
  categories: Category[];
  uploadDate: string;
};
