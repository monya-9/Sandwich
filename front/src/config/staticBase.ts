// src/config/staticBase.ts
// 정적 파일 접근을 위한 베이스 URL 결정

const getStaticBase = () => {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // 로컬 개발 환경: public 폴더의 파일들 사용
    return '';
  } else {
    // 배포 환경: CloudFront 사용
    return process.env.REACT_APP_STATIC_BASE_PROD || 'https://d31vlhzf7p5sqr.cloudfront.net';
  }
};

export const STATIC_BASE = getStaticBase();

// 정적 파일 URL 생성 헬퍼 함수
export const getStaticUrl = (path: string) => {
  // 이미 절대 URL인 경우 그대로 반환
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // 상대 경로인 경우 STATIC_BASE와 결합
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${STATIC_BASE}${cleanPath}`;
};