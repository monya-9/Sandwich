// 검색 타입 드롭다운 컴포넌트 (포트폴리오/계정)
import React from 'react';
import { Dropdown } from '../common/Dropdown';

interface SearchTypeDropdownProps {
  value: 'PORTFOLIO' | 'ACCOUNT';
  onChange: (value: 'PORTFOLIO' | 'ACCOUNT') => void;
}

export const SearchTypeDropdown: React.FC<SearchTypeDropdownProps> = ({
  value,
  onChange
}) => {
  const options = [
    { value: 'PORTFOLIO', label: '포트폴리오' },
    { value: 'ACCOUNT', label: '계정' }
  ];

  const handleChange = (newValue: string) => {
    onChange(newValue as 'PORTFOLIO' | 'ACCOUNT');
  };

  return (
    <Dropdown
      options={options}
      value={value}
      onChange={handleChange}
      className="min-w-[90px] md:min-w-[120px] md:h-[48px]"
      size="sm"
    />
  );
};

export default SearchTypeDropdown;
