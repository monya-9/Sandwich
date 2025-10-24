import React from "react";
import { Link } from "react-router-dom";
import { getStaticUrl } from "../../../config/staticBase";
import SearchBar from "./SearchBar";
import MessageIcon from "../Header/icons/MessageIcon";
import NotificationIcon from "../Header/icons/NotificationIcon";

interface Props {
    onOpenMenu: () => void;
    onLogout: () => void;
}

const MobileNav: React.FC<Props> = ({ onOpenMenu }) => {
    const hasNewMessage = true;
    const hasNewNotification = true;

    return (
        <div className="flex items-center justify-between w-full md:hidden">
            {/* 왼쪽: 햄버거 메뉴 + 로고 */}
            <div className="flex items-center gap-4">
                <button onClick={onOpenMenu} className="block">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-8 h-8"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <Link to="/" className="flex-shrink-0">
                    <img src={getStaticUrl("assets/logo.png")} alt="Sandwich" className="w-[100px] h-auto" />
                </Link>
            </div>

            {/* 오른쪽: 검색, 메시지, 알림 아이콘 */}
            <div className="flex items-center gap-4 ml-auto">
                <SearchBar />
                <MessageIcon hasNew={hasNewMessage} />
                <NotificationIcon hasNew={hasNewNotification} />
            </div>
        </div>
    );
};

export default MobileNav;
