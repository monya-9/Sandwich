import React, { useState } from "react";

interface TextUploadSectionProps {
  onBack: () => void;
  onComplete?: (text: string) => void;
}

const TextUploadSection: React.FC<TextUploadSectionProps> = ({ onBack, onComplete }) => {
  const [text, setText] = useState("");

  const handleSave = () => {
    if (onComplete) onComplete(text);
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full max-w-[600px] px-8">
        {/* 안내 텍스트 */}
        <div className="text-center text-black text-[18px] font-medium mb-8">
          텍스트를 입력해주세요
        </div>
        
        {/* 텍스트 입력 필드 */}
        <div className="mb-8">
          <textarea
            placeholder="여기에 텍스트를 입력하세요..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-[300px] p-6 border border-gray-300 rounded-lg text-black text-[16px] resize-none focus:outline-none focus:border-blue-500"
            style={{ fontFamily: 'inherit' }}
          />
        </div>
        
        {/* 저장 버튼 */}
        <div className="flex justify-center">
          <button 
            onClick={handleSave}
            className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-[16px] font-medium"
          >
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextUploadSection; 