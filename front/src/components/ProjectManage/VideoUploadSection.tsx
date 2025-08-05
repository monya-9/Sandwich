import React, { useState } from "react";
import { IoMdVideocam } from "react-icons/io";

interface VideoUploadSectionProps {
  onBack: () => void;
  onComplete?: (videoUrl: string) => void;
}

const VideoUploadSection: React.FC<VideoUploadSectionProps> = ({ onBack, onComplete }) => {
  const [videoUrl, setVideoUrl] = useState("https://");

  const handleSave = () => {
    // 동영상 URL 저장 로직
    console.log("동영상 URL 저장:", videoUrl);
    if (onComplete) onComplete(videoUrl);
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full max-w-[600px] px-8">
        {/* 비디오 카메라 아이콘 */}
        <div className="w-[96px] h-[96px] rounded-full bg-[#e6f9fa] flex items-center justify-center mb-8 mx-auto">
          <IoMdVideocam className="w-[48px] h-[48px] text-[#18b6b2]" />
        </div>
        
        {/* 안내 텍스트 */}
        <div className="text-center text-black text-[18px] font-medium mb-4">
          동영상 URL을 입력해주세요
        </div>
        <div className="text-center text-gray-400 text-[14px] mb-8">
          Youtube, Vimeo 지원<br/>
          <span className="text-gray-300">(원활한 재생을 위해 공식 URL을 사용해주세요.)</span>
        </div>
        
        {/* URL 입력 필드 */}
        <div className="mb-8">
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black text-[16px] focus:outline-none focus:border-blue-500"
            placeholder="https://www.youtube.com/watch?v=..."
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

export default VideoUploadSection; 