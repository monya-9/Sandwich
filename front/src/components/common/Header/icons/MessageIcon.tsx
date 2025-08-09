import React from 'react';
import { MdMail } from 'react-icons/md';

interface Props {
    hasNew: boolean;
}

const MessageIcon = ({ hasNew }: Props) => {
    return (
        <button className="relative group">
            <MdMail className="w-6 h-6 text-[#232323] group-hover:text-[#3B3B3B]" />
            {hasNew && (
                <span className="absolute -top-0 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
            )}
        </button>
    );
};

export default MessageIcon;
