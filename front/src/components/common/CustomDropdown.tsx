import React, { useState } from "react";
import { ChevronUp } from "lucide-react";

interface CustomDropdownProps {
    value: string;
    onChange: (value: string) => void;
    options: string[];
    placeholder: string;
    className?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ 
    value, 
    onChange, 
    options, 
    placeholder,
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (option: string) => {
        onChange(option);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-[13.5px] text-left outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-200 cursor-pointer"
            >
                <span className={value ? "text-neutral-900" : "text-neutral-500"}>
                    {value || placeholder}
                </span>
                <ChevronUp 
                    className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                    }`} 
                />
            </button>
            
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
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
            )}
        </div>
    );
};

export default CustomDropdown;
