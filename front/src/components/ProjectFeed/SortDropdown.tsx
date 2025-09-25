// 정렬 드롭다운 컴포넌트
import React from 'react';
import { Dropdown } from '../common/Dropdown';

interface SortDropdownProps {
  value: 'latest' | 'popular' | 'recommended';
  onChange: (value: 'latest' | 'popular' | 'recommended') => void;
}

export const SortDropdown: React.FC<SortDropdownProps> = ({
  value,
  onChange
}) => {
  const options = [
    { value: 'recommended', label: '정렬' },
    { value: 'latest', label: '최신순' },
    { value: 'popular', label: '추천순' }
  ];

  const handleChange = (newValue: string) => {
    onChange(newValue as 'latest' | 'popular' | 'recommended');
  };

  return (
    <Dropdown
      options={options}
      value={value}
      onChange={handleChange}
      className="min-w-[140px]"
    />
  );
};

export default SortDropdown;
