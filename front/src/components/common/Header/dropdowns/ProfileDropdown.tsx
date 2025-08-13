import React from 'react';
import { Link } from 'react-router-dom';
import ProfileCircle from '../ProfileCircle';
import DropdownWrapper from './DropdownWrapper';

interface Props {
    email: string;
    username: string;
    onLogout: () => void;
}

const ProfileDropdown = ({ email, username, onLogout }: Props) => {
    return (
        <DropdownWrapper width="w-[280px]">
            <div className="flex flex-col items-center justify-center mb-4">
                <ProfileCircle email={email} size={60} />
                <div className="font-semibold mt-2 mb-1 text-center">{username}</div>
                <div className="text-gray-500 text-sm text-center">{email}</div>
            </div>

            <hr className="border-gray-200 mb-4 -mx-6" />

            <ul className="space-y-2 text-sm mb-4 -mx-2">
                <li><Link to="/upload" className="hover:text-green-600">새로운 작업 업로드</Link></li>
                <li><Link to="/portfolio" className="hover:text-green-600">나의 포트폴리오</Link></li>
                <li><Link to="/mypage" className="hover:text-green-600">마이 페이지</Link></li>
            </ul>

            <hr className="border-gray-200 mb-4 -mx-6" />

            <button
                onClick={onLogout}
                className="text-red-500 text-sm mt-2 hover:underline block w-full text-left -mx-2"
            >
                로그아웃
            </button>
        </DropdownWrapper>
    );
};

export default ProfileDropdown;