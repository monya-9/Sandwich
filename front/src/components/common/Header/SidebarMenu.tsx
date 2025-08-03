import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext';
import logo from '../../../assets/logo.png';
import ProfileCircle from './ProfileCircle';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => void;
}

const SidebarMenu = ({ isOpen, onClose, onLogout }: Props) => {
    const location = useLocation();
    const { isLoggedIn } = useContext(AuthContext);
    const email = localStorage.getItem('userEmail');

    return (
        <div
            className={`fixed inset-0 z-50 transition-all duration-300 ease-in-out ${
                isOpen ? 'bg-black/50 opacity-100 pointer-events-auto' : 'bg-black/0 opacity-0 pointer-events-none'
            }`}
            onClick={onClose}
        >
            <div
                className={`absolute left-0 top-0 h-full w-3/4 bg-white shadow-lg p-6 flex flex-col transform transition-transform duration-300 ease-in-out ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                {isLoggedIn ? (
                    <>
                        {/* 로그인 상태 */}
                        <div className="flex items-center mb-6">
                            <ProfileCircle email={email} size={56} />
                            <div className="flex flex-col ml-4">
                                <span className="font-semibold">사용자</span>
                                <span className="text-sm text-gray-500">{email}</span>
                            </div>
                            <button className="ml-auto text-xl" onClick={onClose}>
                                ✕
                            </button>
                        </div>

                        {[
                            { name: '둘러보기', path: '/' },
                            { name: '커뮤니티', path: '/community' },
                        ].map((menu) => (
                            <Link
                                key={menu.name}
                                to={menu.path}
                                onClick={onClose}
                                className={`mb-4 text-[16px] text-left ${
                                    location.pathname === menu.path ? 'font-semibold text-[#068334]' : ''
                                }`}
                            >
                                {menu.name}
                            </Link>
                        ))}

                        <div className="mt-auto text-[16px] text-red-500">
                            <button onClick={onLogout}>로그아웃</button>
                        </div>
                    </>
                ) : (
                    <>
                        {/* 비로그인 상태 */}
                        <div className="flex items-center justify-between mb-6">
                            <img src={logo} alt="Sandwich" className="w-[120px] h-auto" />
                            <button className="text-xl" onClick={onClose}>
                                ✕
                            </button>
                        </div>

                        <Link
                            to="/join"
                            className="w-full bg-[#06c] text-white py-2 rounded-full mb-3 text-center font-semibold"
                            onClick={onClose}
                        >
                            회원가입
                        </Link>
                        <Link
                            to="/login"
                            className="w-full border border-gray-300 py-2 rounded-full text-center font-semibold"
                            onClick={onClose}
                        >
                            로그인
                        </Link>

                        <hr className="my-6" />

                        {[
                            { name: '둘러보기', path: '/' },
                            { name: '커뮤니티', path: '/community' },
                        ].map((menu) => (
                            <Link
                                key={menu.name}
                                to={menu.path}
                                onClick={onClose}
                                className={`mb-4 text-[16px] text-left ${
                                    location.pathname === menu.path ? 'font-semibold text-[#068334]' : ''
                                }`}
                            >
                                {menu.name}
                            </Link>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
};

export default SidebarMenu;