import React from 'react';

type Radius = 'md' | 'lg' | 'xl';

interface Props {
    /** 표시 여부 */
    show?: boolean;
    /** li 같은 부모의 position:relative 안에서 크기를 채우며 깔립니다 */
    className?: string;
    /** 둥근 정도 */
    radius?: Radius;
    /** 투명 컬러 클래스 (Tailwind) */
    colorClass?: string;
}

/**
 * 부모 요소를 살짝 덮는 반투명 하이라이트.
 * 사용처(li 등)는 position: relative 이어야 함.
 */
const UnreadBadge: React.FC<Props> = ({
                                          show = false,
                                          className = '',
                                          radius = 'xl',
                                          colorClass = 'bg-green-500/10', // 연한 초록
                                      }) => {
    if (!show) return null;

    const r =
        radius === 'md' ? 'rounded-md' :
            radius === 'lg' ? 'rounded-lg' : 'rounded-xl';

    return (
        <span
            aria-hidden
            className={`absolute inset-0 ${r} ${colorClass} pointer-events-none ${className}`}
        />
    );
};

export default UnreadBadge;
