import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext';
import SearchBar from './SearchBar';
import logo from '../../../assets/logo.png';
import ProfileCircle from './ProfileCircle';

interface Props {
    onOpenMenu: () => void;
    onLogout: () => void;
}

const MobileNav = ({ onOpenMenu, onLogout }: Props) => {
    const { isLoggedIn } = useContext(AuthContext);
    const email = localStorage.getItem('userEmail');

    return (
        <div className="flex items-center justify-between w-full md:hidden">
            {/* 왼쪽 햄버거 */}
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

            {/* 가운데 로고 */}
            <Link to="/" className="flex-shrink-0 mx-4">
                <img src={logo} alt="Sandwich" className="w-[100px] h-auto" />
            </Link>

            {/* 오른쪽: 검색 + 로그인 */}
            <div className="flex items-center gap-4 ml-auto">
                <SearchBar />
                {isLoggedIn ? (
                    <ProfileCircle email={email} size={32} />
                ) : (
                    <Link to="/login" className="text-[14px] text-black">
                        로그인
                    </Link>
                )}
            </div>
        </div>
    );
};

export default MobileNav;
