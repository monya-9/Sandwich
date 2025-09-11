import React from 'react';

const SearchBar = () => {
    return (
        <>
            {/* PC 검색창 */}
            <div className="hidden md:flex w-[220px] h-[36px] items-center px-3 border border-black/10 rounded-full text-[14px] text-black/50">
                <input
                    type="text"
                    placeholder="검색어를 입력하세요"
                    className="w-full bg-transparent outline-none"
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
