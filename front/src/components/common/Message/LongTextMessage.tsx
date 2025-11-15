import React, { useState, useRef, useEffect } from 'react';

interface LongTextMessageProps {
  children: React.ReactNode;
  maxLines?: number;
  className?: string;
}

const LongTextMessage: React.FC<LongTextMessageProps> = ({ 
  children, 
  maxLines = 6, 
  className = "" 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [isLongText, setIsLongText] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  // children이 문자열인지 확인
  const isString = typeof children === 'string';
  const text = isString ? children as string : '';

  // 실제 DOM 높이를 기준으로 긴 텍스트인지 확인
  useEffect(() => {
    if (isString && textRef.current) {
      const element = textRef.current;
      const lineHeight = parseFloat(getComputedStyle(element).lineHeight);
      const height = element.scrollHeight;
      const actualLines = Math.round(height / lineHeight);
      setIsLongText(actualLines > maxLines);
    } else {
      setIsLongText(false);
    }
  }, [text, maxLines, isString]);
  
  // 문자열이 아닌 경우 그대로 렌더링 (첨부파일, 카드 등)
  if (!isString) {
    return <div className={className}>{children}</div>;
  }

  const handleShowMore = () => {
    setIsExpanded(true);
  };

  const handleShowLess = () => {
    setIsExpanded(false);
  };

  const handleShowModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <>
      <div className={className}>
        <div 
          ref={textRef}
          className="whitespace-pre-wrap break-words"
          style={{
            maxHeight: isExpanded ? 'none' : `${maxLines * 1.5}em`,
            overflow: isExpanded ? 'visible' : 'hidden',
            transition: 'max-height 0.3s ease-in-out'
          }}
        >
          {text}
        </div>
        
        {isLongText && (
          <div className="mt-2 flex gap-2">
            {!isExpanded ? (
              <button
                onClick={handleShowMore}
                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
              >
                전체보기
              </button>
            ) : (
              <>
                <button
                  onClick={handleShowLess}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-sm font-medium"
                >
                  접기
                </button>
                <button
                  onClick={handleShowModal}
                  className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                >
                  모달로 보기
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* 전체보기 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* 모달 헤더 */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">메시지 전체보기</h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            {/* 모달 내용 */}
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="whitespace-pre-wrap break-words text-gray-900 dark:text-white">
                {text}
              </div>
            </div>
            
            {/* 모달 푸터 */}
            <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LongTextMessage;
