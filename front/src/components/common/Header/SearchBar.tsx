import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecentSearches } from '../../../hooks/useRecentSearches';
import { AuthContext } from '../../../context/AuthContext';

const SearchBar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    // ✅ 로그인 상태 확인
    const { isLoggedIn } = useContext(AuthContext);

    // 최근 검색어 훅 사용
    const {
        recentSearches,
        saveSearch,
        deleteSearch,
        clearAllSearches,
        refreshSearches
    } = useRecentSearches();

    // 추천 검색어
    const recommendedSearches = ['java', 'python', 'spring', 'react', '머신러닝', 'spring-boot', '객체지향'];

    // 드롭다운 열릴 때 최근 검색어 새로고침
    const handleDropdownOpen = () => {
        setIsOpen(true);
        // ✅ 로그인한 사용자만 최근 검색어 새로고침
        if (isLoggedIn) {
            refreshSearches();
        }
    };

    // 최근 검색어 저장 (새로운 훅 사용)
    const handleSaveRecentSearch = async (term: string) => {
        // ✅ 로그인한 사용자만 최근 검색어 저장
        if (isLoggedIn) {
            await saveSearch(term, 'PORTFOLIO');
        }
    };

    // 검색어 삭제 (새로운 훅 사용)
    const handleDeleteRecentSearch = async (id: number) => {
        // ✅ 로그인한 사용자만 최근 검색어 삭제
        if (isLoggedIn) {
            await deleteSearch(id);
        }
    };

    // 모든 검색어 삭제 (새로운 훅 사용)
    const handleClearAllRecentSearches = async () => {
        // ✅ 로그인한 사용자만 최근 검색어 전체 삭제
        if (isLoggedIn) {
            await clearAllSearches('PORTFOLIO');
        }
    };

    // 검색 실행
    const handleSearch = (term: string) => {
        setIsOpen(false);
        
        if (term.trim()) {
            // 검색어가 있으면 검색어 저장하고 검색 페이지로 이동
            handleSaveRecentSearch(term);
            navigate(`/search?q=${encodeURIComponent(term)}`);
        } else {
            // 검색어가 없으면 그냥 검색 페이지로 이동
            navigate('/search');
        }
    };

    // 입력창 포커스 (드롭다운 열기 + 최근 검색어 새로고침)
    const handleFocus = () => {
        handleDropdownOpen();
    };

    // 외부 클릭 감지
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <>
            {/* PC 검색창 */}
            <div className="hidden md:flex w-[310px] h-[36px] items-center px-3 border border-black/30 dark:border-white/20 bg-white dark:bg-black rounded-full text-[14px] text-black/70 dark:text-white relative" ref={dropdownRef}>
                <input
                    type="text"
                    placeholder="검색어를 입력하세요"
                    className="w-full bg-transparent outline-none placeholder:text-black/50 dark:placeholder:text-white/70 text-black dark:text-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={handleFocus}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            handleSearch(searchTerm);
                        }
                    }}
                />
                <button
                    onClick={() => handleSearch(searchTerm)}
                    className="flex-shrink-0 p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
                    type="button"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-[18px] h-[18px]"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 21l-4.35-4.35M9 17a8 8 0 100-16 8 8 0 000 16z"
                        />
                    </svg>
                </button>

                {/* 드롭다운 */}
                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-black border border-gray-200 dark:border-white/20 rounded-lg shadow-lg z-50">
                        {/* 추천 검색어 */}
                        <div className="p-4 border-b border-gray-100 dark:border-white/10">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">추천 검색어</h3>
                            <div className="flex flex-wrap gap-2">
                                {recommendedSearches.map((term) => (
                                    <button
                                        key={term}
                                        onClick={() => handleSearch(term)}
                                        className="px-3 py-1 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white text-sm rounded-full hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                                    >
                                        {term}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 최근 검색어 - 로그인한 사용자만 표시 */}
                        {isLoggedIn && recentSearches.length > 0 && (
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">최근 검색어</h3>
                                    <button
                                        onClick={handleClearAllRecentSearches}
                                        className="text-xs text-gray-500 hover:text-gray-700 dark:text-white/70 dark:hover:text-white"
                                    >
                                        모두 삭제하기
                                    </button>
                                </div>
                                <div className="max-h-[120px] overflow-y-auto space-y-2">
                                    {recentSearches.slice(0, 3).map((searchItem) => (
                                        <div key={searchItem.id} className="flex items-center justify-between group">
                                            <button
                                                onClick={() => handleSearch(searchItem.keyword)}
                                                className="flex items-center text-sm text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-white"
                                            >
                                                <svg
                                                    className="w-4 h-4 mr-2 text-gray-400 dark:text-white/60"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                                {searchItem.keyword}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteRecentSearch(searchItem.id);
                                                }}
                                                className="opacity-60 hover:opacity-100 text-gray-400 dark:text-white/60 hover:text-red-500 transition-all"
                                                title="삭제"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                    {/* 나머지 검색어들 (스크롤 가능) */}
                                    {recentSearches.length > 3 && (
                                        <div className="space-y-2">
                                            {recentSearches.slice(3).map((searchItem) => (
                                                <div key={searchItem.id} className="flex items-center justify-between group">
                                                    <button
                                                        onClick={() => handleSearch(searchItem.keyword)}
                                                        className="flex items-center text-sm text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-white"
                                                    >
                                                        <svg
                                                            className="w-4 h-4 mr-2 text-gray-400 dark:text-white/60"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                            />
                                                        </svg>
                                                        {searchItem.keyword}
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteRecentSearch(searchItem.id);
                                                        }}
                                                        className="opacity-60 hover:opacity-100 text-gray-400 dark:text-white/60 hover:text-red-500 transition-all"
                                                        title="삭제"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 모바일 검색 아이콘 */}
            <button className="md:hidden block">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-4.35-4.35M9 17a8 8 0 100-16 8 8 0 000 16z"
                    />
                </svg>
            </button>
        </>
    );
};

export default SearchBar;
