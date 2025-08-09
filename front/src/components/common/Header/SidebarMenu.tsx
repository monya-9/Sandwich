import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext';
import ProfileCircle from './ProfileCircle';
import logo from '../../../assets/logo.png';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => void;
}

const SidebarMenu = ({ isOpen, onClose, onLogout }: Props) => {
    const { isLoggedIn, email } = useContext(AuthContext);

    return (
        <div
            className={`fixed inset-0 z-50 transition-all duration-300 ease-in-out
                ${isOpen ? 'bg-black/50 opacity-100 pointer-events-auto' : 'bg-black/0 opacity-0 pointer-events-none'}`}
            onClick={onClose}
        >
            <div
                className={`absolute left-0 top-0 h-full w-3/4 sm:w-1/2 bg-white shadow-lg p-6 flex flex-col transform transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {isLoggedIn ? (
                    // 🔹 로그인 상태
                    <div className="mb-6 flex flex-col items-start gap-3">
                        <ProfileCircle email={email} size={56} />
                        <div className="flex flex-col">
                            <span className="font-semibold text-lg">허은진</span>
                            <span className="text-gray-500 text-sm">{email}</span>
                        </div>
                    </div>
                ) : (
                    // 🔹 비로그인 상태
                    <div className="mb-6 flex flex-col items-start w-full px-1">
                        {/* 로고 (조금 더 작게 + 위 여백 넓힘) */}
                        <img src={logo} alt="Sandwich" className="w-[80px] mb-5 mt-4" />

                        {/* 안내 문구 */}
                        <p className="text-gray-600 text-sm mb-6 leading-5">
                            회원가입 또는 로그인을 통해<br />
                            샌드위치 프로젝트를 시작해보세요!
                        </p>

                        {/* 버튼 그룹 */}
                        <Link
                            to="/join"
                            onClick={onClose}
                            className="w-full py-2 bg-green-500 text-white rounded-full text-center font-medium text-sm mb-3"
                        >
                            회원가입
                        </Link>
                        <Link
                            to="/login"
                            onClick={onClose}
                            className="w-full py-2 border border-gray-300 rounded-full text-center font-medium text-sm"
                        >
                            로그인
                        </Link>
                    </div>

                )}

                {/* ✅ 메뉴 구분선 */}
                <hr className="my-4" />

                {/* ✅ 메뉴 목록 */}
                <nav className="flex flex-col gap-4">
                    <Link to="/" onClick={onClose} className="text-base font-medium">
                        둘러보기
                    </Link>
                    <Link to="/community" onClick={onClose} className="text-base font-medium">
                        커뮤니티
                    </Link>
                </nav>

                {/* ✅ 하단 로그아웃 버튼 */}
                {isLoggedIn && (
                    <div className="mt-auto">
                        <button
                            onClick={onLogout}
                            className="text-red-500 text-sm mt-6"
                        >
                            로그아웃
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SidebarMenu;
