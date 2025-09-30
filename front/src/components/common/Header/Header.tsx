import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext';
import DesktopNav from './DesktopNav';
import MobileNav from './MobileNav';
import SidebarMenu from './SidebarMenu';
import Toast from '../Toast';
import api from '../../../api/axiosInstance';

const Header = () => {
    const { logout } = useContext(AuthContext);
    const [menuOpen, setMenuOpen] = useState(false);
    const [successToast, setSuccessToast] = useState<{ visible: boolean; message: string }>({
        visible: false,
        message: ''
    });
    const navigate = useNavigate();

    // 화면 크기 커지면 메뉴 자동 닫기
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) setMenuOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    /** ✅ 최종 handleLogout */
    const handleLogout = async () => {
        try {
            // api 인스턴스 사용 (리프레시 토큰 적용)
            await api.post('/auth/logout');
            console.log('프론트: 로그아웃 요청 성공');
        } catch (err) {
            console.error('백엔드 로그아웃 실패:', err);
        }

        // 프론트 상태 초기화 (clearAllUserData가 모든 토큰을 삭제하므로 중복 삭제 제거)
        logout();
        setSuccessToast({
            visible: true,
            message: '로그아웃 되었습니다'
        });
        navigate('/');
    };

    return (
        <>
            <Toast
                visible={successToast.visible}
                message={successToast.message}
                type="success"
                size="medium"
                autoClose={3000}
                closable={true}
                onClose={() => setSuccessToast(prev => ({ ...prev, visible: false }))}
            />
            <header className="w-full border-b-[1.5px] border-[#068334] font-gmarket bg-white fixed top-0 left-0 z-50">
            <div className="w-full px-6 py-3 flex items-center justify-between">
                {/* PC 전용 네비 */}
                <div className="hidden md:flex w-full">
                    <DesktopNav onLogout={handleLogout} />
                </div>

                {/* 모바일 전용 네비 */}
                <div className="flex w-full md:hidden justify-between items-center">
                    <MobileNav onOpenMenu={() => setMenuOpen(true)} onLogout={handleLogout} />
                </div>
            </div>

            <SidebarMenu
                isOpen={menuOpen}
                onClose={() => setMenuOpen(false)}
                onLogout={handleLogout}
            />
        </header>
        </>
    );
};

export default Header;
