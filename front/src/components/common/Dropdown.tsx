// 공통 드롭다운 컴포넌트
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "선택하세요",
  className = "",
  size = 'md',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 현재 선택된 옵션의 라벨 찾기
  const selectedOption = options.find(option => option.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const sizeBtn = size === 'sm' ? 'px-3 py-2 text-[13px]' : 'px-4 py-3 text-[14px]';
  const sizeItem = size === 'sm' ? 'px-3 py-2 text-[13px]' : 'px-4 py-3 text-[14px]';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* 드롭다운 버튼 */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center justify-between w-full ${sizeBtn} bg-white dark:bg-black border border-gray-300 dark:border-white/20 rounded-lg transition-colors ${
          disabled 
            ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-neutral-800' 
            : 'hover:bg-gray-50 dark:hover:bg-white/10 focus:ring-2 focus:ring-green-500 focus:border-transparent'
        }`}
      >
        <span className="text-gray-700 dark:text-white">{displayText}</span>
        <ChevronDown 
          className={`w-4 h-4 text-gray-400 dark:text-white/70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-black border border-gray-200 dark:border-white/20 rounded-lg shadow-lg z-50 animate-in slide-in-from-top-2 duration-200">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleOptionClick(option.value)}
              className={`w-full ${sizeItem} text-left hover:bg-gray-50 dark:hover:bg-white/10 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                option.value === value ? 'bg-green-50 dark:bg-green-600/20 text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
