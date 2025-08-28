import React from 'react';
import logo from '../../../../assets/logo.png';

interface Props {
    text: string;
}

const EmptyState = ({ text }: Props) => {
    return (
        <div className="flex flex-col items-center justify-center py-6 text-gray-500 text-sm">
            <img src={logo} alt="Sandwich" className="w-[90px] mb-3" />
            {text}
        </div>
    );
};

export default EmptyState;
