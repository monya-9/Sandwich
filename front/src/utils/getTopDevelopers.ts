// 기준: 좋아요(likes) + 조회수(views) 합산 점수가 높은 순서로 개발자 추출
// utils/getTopDevelopers.ts

import { dummyProjects } from '../data/dummyProjects';
import { dummyUsers } from '../data/dummyUsers';

export const getTopDevelopers = (topN: number = 10) => {
  const scoreMap: Record<number, number> = {};

  dummyProjects.forEach((project) => {
    if (project.authorId) {
      const score = (project.likes || 0) + (project.views || 0);
      scoreMap[project.authorId] = (scoreMap[project.authorId] || 0) + score;
    }
  });

  const sortedAuthorIds = Object.entries(scoreMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([id]) => parseInt(id, 10));

  return dummyUsers.filter((user) => sortedAuthorIds.includes(user.id));
};
