import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const SearchBar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const navigate = useNavigate();
    const dropdownRef = useRef<HTMLDivElement>(null);

    // 추천 검색어
    const recommendedSearches = ['java', 'python', 'spring', 'react', '머신러닝', 'spring-boot', '객체지향'];

    // 최근 검색어 로드
    useEffect(() => {
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            setRecentSearches(JSON.parse(saved));
        }
    }, []);

    // 최근 검색어 저장
    const saveRecentSearch = (term: string) => {
        if (!term.trim()) return;
        
        const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 10);
        setRecentSearches(updated);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
    };

    // 검색어 삭제
    const deleteRecentSearch = (term: string) => {
        const updated = recentSearches.filter(s => s !== term);
        setRecentSearches(updated);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
    };

    // 모든 최근 검색어 삭제
    const clearAllRecentSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem('recentSearches');
    };

    // 검색 실행
    const handleSearch = (term: string) => {
        if (!term.trim()) return;
        saveRecentSearch(term);
        setIsOpen(false);
        navigate(`/search?q=${encodeURIComponent(term)}`);
    };

    // 입력창 포커스
    const handleFocus = () => {
        setIsOpen(true);
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
            <div className="hidden md:flex w-[310px] h-[36px] items-center px-3 border border-black/30 rounded-full text-[14px] text-black/50 relative" ref={dropdownRef}>
                <input
                    type="text"
                    placeholder="검색어를 입력하세요"
                    className="w-full bg-transparent outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={handleFocus}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            handleSearch(searchTerm);
                        }
                    }}
                />
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

                {/* 드롭다운 */}
                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                        {/* 추천 검색어 */}
                        <div className="p-4 border-b border-gray-100">
                            <h3 className="text-sm font-medium text-gray-900 mb-3">추천 검색어</h3>
                            <div className="flex flex-wrap gap-2">
                                {recommendedSearches.map((term) => (
                                    <button
                                        key={term}
                                        onClick={() => handleSearch(term)}
                                        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors"
                                    >
                                        {term}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 최근 검색어 */}
                        {recentSearches.length > 0 && (
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-medium text-gray-900">최근 검색어</h3>
                                    <button
                                        onClick={clearAllRecentSearches}
                                        className="text-xs text-gray-500 hover:text-gray-700"
                                    >
                                        모두 삭제하기
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {recentSearches.map((term, index) => (
                                        <div key={index} className="flex items-center justify-between group">
                                            <button
                                                onClick={() => handleSearch(term)}
                                                className="flex items-center text-sm text-gray-700 hover:text-gray-900"
                                            >
                                                <svg
                                                    className="w-4 h-4 mr-2 text-gray-400"
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
                                                {term}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteRecentSearch(term);
                                                }}
                                                className="opacity-60 hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                                                title="삭제"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
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
