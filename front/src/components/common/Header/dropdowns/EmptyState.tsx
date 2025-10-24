import React from 'react';
import { getStaticUrl } from '../../../../config/staticBase';

interface Props {
    text: string;
}

const EmptyState = ({ text }: Props) => {
    return (
        <div className="flex flex-col items-center justify-center py-6 text-gray-500 text-sm">
            <img src={getStaticUrl("assets/logo.png")} alt="Sandwich" className="w-[90px] mb-3" />
            {text}
        </div>
    );
};

export default EmptyState;
