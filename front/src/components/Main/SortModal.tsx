// SortModal.tsx
// 정렬 모달
import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedSort: string;
  setSelectedSort: (sort: string) => void;
  selectedUploadTime: string;
  setSelectedUploadTime: (time: string) => void;
}

const SortModal: React.FC<Props> = ({
  isOpen,
  onClose,
  selectedSort,
  setSelectedSort,
  selectedUploadTime,
  setSelectedUploadTime,
}) => {
  if (!isOpen) return null;

  const sortOptions = ['샌드위치 픽', '최신순', '추천순'];
  const timeOptions = ['전체기간', '최근 24시간', '최근 일주일', '최근 한달', '최근 세달'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-80 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">정렬</h2>
          <button onClick={onClose} className="text-xl font-semibold">&times;</button>
        </div>

        <div className="mb-4">
          <p className="font-semibold mb-2">정렬 방식</p>
          <div className="flex flex-wrap gap-2">
            {sortOptions.map((option) => (
              <button
                key={option}
                onClick={() => setSelectedSort(option)}
                className={`px-3 py-1 border rounded-full text-sm ${
                  selectedSort === option ? 'bg-green-600 text-white' : 'text-green-600 border-green-600'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <p className="font-semibold mb-2">업로드 시간</p>
          <div className="flex flex-wrap gap-2">
            {timeOptions.map((option) => (
              <button
                key={option}
                onClick={() => setSelectedUploadTime(option)}
                className={`px-3 py-1 border rounded-full text-sm ${
                  selectedUploadTime === option ? 'bg-green-600 text-white' : 'text-green-600 border-green-600'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default SortModal;
