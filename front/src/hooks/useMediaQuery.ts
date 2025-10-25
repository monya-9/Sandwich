import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // 초기값 설정
    setMatches(media.matches);

    // 변경 감지
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // 이벤트 리스너 등록
    media.addEventListener('change', listener);

    return () => {
      media.removeEventListener('change', listener);
    };
  }, [query]);

  return matches;
}

