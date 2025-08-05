// src/components/common/Header.tsx (예시 위치)

import React, { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import menuIcon from '../../assets/icons/menu.png';
import { AuthContext } from '../../context/AuthContext';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useContext(AuthContext);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error('백엔드 로그아웃 실패:', err);
    }

    logout(); // 프론트 상태 초기화 (토큰 제거 등)
    alert('로그아웃 되었습니다');
    navigate('/');
  };

  return (
      <header className="w-full border-b-[1.5px] border-[#068334] font-gmarket bg-white mt-[-10px]">
        <div className="w-full px-8 py-4 flex items-center justify-between">
          {/* 왼쪽: 로고 + 메뉴 */}
          <div className="flex items-center gap-6 mt-[10px]">
            <button className="md:hidden block">
              <img src={menuIcon} alt="menu" className="w-[28px] h-[28px]" />
            </button>

            <Link to="/">
              <img src={logo} alt="Sandwich" className="w-[130px] h-auto" />
            </Link>

            <nav className="hidden md:flex gap-4 text-[18px] items-center mt-[6px]">
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

          {/* 오른쪽: 검색 + 로그인/로그아웃 */}
          <div className="ml-auto flex items-center gap-5 mt-[6px]">
            <div className="w-[240px] h-[36px] flex items-center px-3 border border-black/10 rounded-full text-[14px] text-black/50">
              <input
                  type="text"
                  placeholder="검색어를 입력하세요"
                  className="w-full bg-transparent outline-none"
              />
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-4.35-4.35M9 17a8 8 0 100-16 8 8 0 000 16z"
                />
              </svg>
            </div>

            <div className="flex gap-3 text-[14px] text-black">
              {isLoggedIn ? (
                  <button onClick={handleLogout}>로그아웃</button>
              ) : (
                  <>
                    <Link to="/login">로그인</Link>
                    <Link to="/join">회원가입</Link>
                  </>
              )}
            </div>
          </div>
        </div>
      </header>
  );
};

export default Header;
