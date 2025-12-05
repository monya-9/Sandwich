// src/components/Main/SortModal.tsx
// 정렬 모달
import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedSort: string;
  setSelectedSort: (sort: string) => void;
  selectedUploadTime: string;
  setSelectedUploadTime: (time: string) => void;
  onApply: () => void;
}

const SortModal: React.FC<Props> = ({
  isOpen,
  onClose,
  selectedSort,
  setSelectedSort,
  selectedUploadTime,
  setSelectedUploadTime,
  onApply,
}) => {
  if (!isOpen) return null;

  const sortOptions = ['샌드위치 픽', '최신순', '추천순'];
  const timeOptions = ['전체기간', '최근 24시간', '최근 일주일', '최근 한달', '최근 세달'];

  const commonButtonStyle = 'px-3 md:px-5 py-1.5 md:py-2 text-xs md:text-sm rounded-[20px] border transition drop-shadow-md';

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 dark:bg-white/10 px-4">
      <div className="bg-white rounded-[20px] w-full max-w-[300px] md:max-w-[360px] md:w-[360px] p-3 md:p-5">

        {/* 상단 타이틀 + 닫기 버튼 */}
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm md:text-lg font-medium">정렬</h2>
          <button onClick={onClose} className="text-lg md:text-2xl font-semibold">&times;</button>
        </div>

        {/* 구분선 */}
        <hr className="w-full border-t border-gray-200 mx-0 mb-2 md:mb-4" />

        {/* 정렬 방식 */}
        <div className="mb-2 md:mb-4">
          <p className="font-medium mb-1.5 md:mb-2 text-xs md:text-base">정렬 방식</p>
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            {sortOptions.map((option) => (
              <button
                key={option}
                onClick={() => setSelectedSort(option)}
                className={`${commonButtonStyle} ${
                    selectedSort === option
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-black border-green-600 hover:bg-[#F2F2F2]'
                  }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        
        {/* 업로드 시간 - 최신순 또는 추천순일 때만 표시 */}
        {selectedSort !== '샌드위치 픽' && (
          <>
            <hr className="w-full border-t border-gray-200 mx-0 mb-2 md:mb-4" />
            <div className="mb-3 md:mb-6">
              <p className="font-medium mb-1.5 md:mb-2 text-xs md:text-base">업로드 시간</p>
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                {timeOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => setSelectedUploadTime(option)}
                    className={`${commonButtonStyle} ${
                        selectedUploadTime === option
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white text-black border-green-600 hover:bg-[#F2F2F2]'
                      }`}                  
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
    
        <hr className="w-full border-t border-gray-200 mx-0 mb-2 md:mb-4" />

        {/* 적용 버튼 */}
        <div className="flex justify-end gap-1.5 md:gap-2">
        <button
            onClick={onClose}
            className="text-black border border-green-600 px-2.5 md:px-4 py-1 md:py-2 rounded-[15px] text-xs md:text-sm font-medium hover:bg-[#ECECEC]"
        >
            취소
        </button>
        <button
            onClick={onApply}
            className="bg-green-600 text-white px-2.5 md:px-4 py-1 md:py-2 rounded-[15px] text-xs md:text-sm font-medium"
        >
            적용
        </button>
        </div>
      </div>
    </div>
  );
};

export default SortModal;
