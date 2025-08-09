// src/components/common/DropdownWrapper.tsx
import React, { ReactNode } from 'react';

interface Props {
    children: ReactNode;
    width?: string;
}

const DropdownWrapper = ({ children, width = 'w-80' }: Props) => {
    return (
        <div
            className={`absolute top-full right-0 mt-3 ${width} bg-white shadow-xl rounded-xl p-6 z-50`}
        >
            {children}
        </div>
    );
};

export default DropdownWrapper;