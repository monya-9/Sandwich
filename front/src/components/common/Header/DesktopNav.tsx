import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../../../assets/logo.png';
import { AuthContext } from '../../../context/AuthContext';
import SearchBar from './SearchBar';
import ProfileCircle from './ProfileCircle';

interface Props {
    onLogout: () => void;
}

const DesktopNav = ({ onLogout }: Props) => {
    const location = useLocation();
    const { isLoggedIn } = useContext(AuthContext);

    const email = localStorage.getItem('userEmail');

    return (
        <div className="flex items-center justify-between w-full">
            {/* 왼쪽: 로고 + 네비 */}
            <div className="flex items-center gap-3">
                <Link to="/">
                    <img src={logo} alt="Sandwich" className="w-[120px] h-auto" />
                </Link>

                <nav className="flex gap-6 text-[18px] ml-6">
                    <Link
                        to="/"
                        className={`text-black ${location.pathname === '/' ? 'font-semibold' : 'font-medium'}`}
                    >
                        둘러보기
                    </Link>
                    <Link
                        to="/community"
                        className={`text-black ${location.pathname === '/community' ? 'font-semibold' : 'font-medium'}`}
                    >
                        커뮤니티
                    </Link>
                </nav>
            </div>

            {/* 오른쪽 */}
            <div className="flex items-center gap-4 ml-auto">
                <SearchBar />

                {isLoggedIn ? (
                    <div className="flex items-center gap-3">
                        <ProfileCircle email={email} size={32} />
                        <button onClick={onLogout} className="text-[14px] text-black">
                            로그아웃
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-3 text-[14px] text-black">
                        <Link to="/login">로그인</Link>
                        <Link to="/join">회원가입</Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DesktopNav;
