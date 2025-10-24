// src/config/apiBase.ts
// 환경 자동 감지하여 API 베이스 URL 결정

const getApiBase = () => {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // 로컬 개발 환경: 프록시 사용
    return process.env.REACT_APP_API_BASE_LOCAL || '/api';
  } else {
    // 배포 환경: 직접 API 호출
    return process.env.REACT_APP_API_BASE_PROD || 'https://sd-LB-1117689927.ap-northeast-2.elb.amazonaws.com/api';
  }
};

export const API_BASE = getApiBase();
