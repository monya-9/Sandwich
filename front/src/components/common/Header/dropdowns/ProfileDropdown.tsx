import React, { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ProfileCircle from '../ProfileCircle';
import DropdownWrapper from './DropdownWrapper';
import { MdComputer, MdLightMode, MdDarkMode } from 'react-icons/md';

interface Props {
    email: string;
    username: string;
    onLogout: () => void;
}

type ThemeMode = 'system' | 'light' | 'dark';

const ProfileDropdown = ({ email, username, onLogout }: Props) => {
    // 저장값이 없으면 system
    const initialMode: ThemeMode = useMemo(() => {
        const saved = (localStorage.getItem('theme') || '').toLowerCase();
        return saved === 'dark' || saved === 'light' ? (saved as ThemeMode) : 'system';
    }, []);

    const [mode, setMode] = useState<ThemeMode>(initialMode);

    const resolveAndApply = useCallback((m: ThemeMode) => {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = m === 'dark' ? true : m === 'light' ? false : prefersDark;
        document.documentElement.classList.toggle('dark', isDark);
        localStorage.setItem('theme', m);
        setMode(m);
    }, []);

    const btnCls = (m: ThemeMode) => [
        'h-7 w-7 flex items-center justify-center rounded-full transition-colors',
        mode === m
            ? 'bg-green-500 text-white'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white'
    ].join(' ');

    return (
        <DropdownWrapper width="w-[280px]">
            <div className="flex flex-col items-center justify-center mb-4">
                <ProfileCircle email={email} size={60} />
                <div className="font-semibold mt-2 mb-1 text-center">{username}</div>
                <div className="text-gray-500 dark:text-white/70 text-sm text-center">{email}</div>
            </div>

            <hr className="border-gray-200 dark:border-white/10 mb-4 -mx-6" />

            <ul className="space-y-2 text-sm mb-2 -mx-2">
                <li><Link to="/project/edit" className="hover:text-green-600">새로운 작업 업로드</Link></li>
                <li><Link to="/profile" className="hover:text-green-600">나의 포트폴리오</Link></li>
                <li><Link to="/mypage" className="hover:text-green-600">마이 페이지</Link></li>
            </ul>

            {/* 테마: 마이페이지 바로 아래 (선 위) */}
            <div className="flex items-center justify-between mb-4 -mx-2">
                <span className="text-sm text-gray-900 dark:text-white">테마</span>
                <div className="flex items-center gap-1 rounded-full border border-gray-300 dark:border-white/20 p-1">
                    {/* 시스템 (기본 색상은 라이트와 동일) */}
                    <button
                        type="button"
                        aria-label="System theme"
                        className={btnCls('system')}
                        onClick={() => resolveAndApply('system')}
                        title="System"
                    >
                        <MdComputer size={16} />
                    </button>
                    {/* 라이트 */}
                    <button
                        type="button"
                        aria-label="Light theme"
                        className={btnCls('light')}
                        onClick={() => resolveAndApply('light')}
                        title="Light"
                    >
                        <MdLightMode size={16} />
                    </button>
                    {/* 다크 */}
                    <button
                        type="button"
                        aria-label="Dark theme"
                        className={btnCls('dark')}
                        onClick={() => resolveAndApply('dark')}
                        title="Dark"
                    >
                        <MdDarkMode size={16} />
                    </button>
                </div>
            </div>

            <hr className="border-gray-200 dark:border-white/10 mb-4 -mx-6" />

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