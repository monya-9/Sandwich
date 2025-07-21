//반응형 x 맘에 드는 헤더
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../../assets/logo.png';
import menuIcon from '../../assets/icons/menu.png';

const Header = () => {
  const location = useLocation();

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
              className={`text-black ${
                location.pathname === '/' ? 'font-semibold' : 'font-medium'
              }`}
            >
              둘러보기
            </Link>
            <Link
              to="/community"
              className={`text-black ${
                location.pathname === '/community' ? 'font-semibold' : 'font-medium'
              }`}
            >
              커뮤니티
            </Link>
          </nav>
        </div>

        {/* 오른쪽: 검색 + 로그인 */}
        <div className="ml-auto flex items-center gap-5 mt-[6px]">
          <div className="w-[240px] h-[36px] flex items-center px-3 border border-black/10 rounded-full text-[14px] text-black/50">
            <input
              type="text"
              placeholder="검색어를 입력하세요"
              className="w-full bg-transparent outline-none"
            />
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M9 17a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
          </div>

          <div className="flex gap-3 text-[14px] text-black">
            <a href="#">로그인</a>
            <a href="#">회원가입</a>
          </div>
        </div>

      </div>
    </header>
  );
};

export default Header;
