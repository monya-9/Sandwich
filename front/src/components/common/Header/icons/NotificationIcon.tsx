import React from 'react';
import { MdNotifications } from 'react-icons/md';

interface Props {
    hasNew: boolean;
}

const NotificationIcon = ({ hasNew }: Props) => {
    return (
        <button className="relative group">
            <MdNotifications className="w-6 h-6 text-[#232323] group-hover:text-[#3B3B3B]" />
            {hasNew && (
                <span className="absolute -top-0 -right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
            )}
        </button>
    );
};

export default NotificationIcon;
