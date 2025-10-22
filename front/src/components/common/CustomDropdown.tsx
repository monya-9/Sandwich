import React, { useState, useEffect, useRef } from "react";
import { ChevronUp } from "lucide-react";

// 전역 드롭다운 상태 관리
let openDropdownRef: React.RefObject<HTMLDivElement> | null = null;

interface CustomDropdownProps {
    value: string;
    onChange: (value: string) => void;
    options: string[];
    placeholder: string;
    className?: string;
    disabled?: boolean;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ 
    value, 
    onChange, 
    options, 
    placeholder,
    className = "",
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                if (openDropdownRef === dropdownRef) {
                    openDropdownRef = null;
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelect = (option: string) => {
        onChange(option);
        setIsOpen(false);
        openDropdownRef = null;
    };

    const handleToggle = () => {
        if (disabled) return;
        
        if (isOpen) {
            setIsOpen(false);
            openDropdownRef = null;
        } else {
            // 다른 드롭다운 닫기
            if (openDropdownRef && openDropdownRef !== dropdownRef) {
                // 다른 드롭다운이 열려있으면 닫기
                const otherDropdown = openDropdownRef.current;
                if (otherDropdown) {
                    const button = otherDropdown.querySelector('button');
                    if (button) {
                        button.click();
                    }
                }
            }
            openDropdownRef = dropdownRef;
            setIsOpen(true);
        }
    };

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            <button
                type="button"
                onClick={handleToggle}
                disabled={disabled}
                className={`w-full flex items-center justify-between rounded-lg border px-3 py-2.5 text-[13.5px] text-left outline-none transition-all duration-200 ${
                    disabled 
                        ? "border-neutral-200 bg-neutral-100 text-neutral-400 cursor-not-allowed" 
                        : "border-neutral-300 bg-white text-neutral-900 cursor-pointer focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                }`}
            >
                <span className={value ? (disabled ? "text-neutral-400" : "text-neutral-900") : "text-neutral-500"}>
                    {value || placeholder}
                </span>
                <ChevronUp 
                    className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                    } ${disabled ? "opacity-50" : ""}`} 
                />
            </button>
            
            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden">
                    <div className="max-h-40 overflow-y-auto">
                        {options.map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => handleSelect(option)}
                                className={`w-full px-3 py-2 text-[13.5px] text-left hover:bg-neutral-50 transition-colors duration-150 ${
                                    value === option 
                                        ? "bg-emerald-50 text-emerald-600 font-medium" 
                                        : "text-neutral-900"
                                }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomDropdown;
