// src/components/Header/dropdowns/DropdownWrapper.tsx
import React, { ReactNode } from 'react';

interface Props {
    children: ReactNode;
    width?: string;            // Tailwind width
    align?: 'right' | 'left';  // 정렬 방향
    offsetY?: string;          // Y 간격 (예: 'mt-3')
}

const DropdownWrapper = ({
                             children,
                             width = 'w-80',
                             align = 'right',
                             offsetY = 'mt-3',
                         }: Props) => {
    const alignClass = align === 'right' ? 'right-0' : 'left-0';

    return (
        <div
            className={`absolute top-full ${alignClass} ${offsetY} ${width}
                  bg-white shadow-xl rounded-xl p-6 z-50
                  pointer-events-auto`}
            role="menu"
        >
            {children}
        </div>
    );
};

export default DropdownWrapper;
