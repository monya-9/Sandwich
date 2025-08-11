import React from "react";
import { FaImage } from "react-icons/fa6";
import { RiText } from "react-icons/ri";
import { IoMdVideocam } from "react-icons/io";
import { HiMiniArrowsUpDown } from "react-icons/hi2";

interface ContentAddPanelProps {
  onImageAddClick: () => void;
  onTextAddClick: () => void;
  onVideoAddClick: () => void;
  onReorderClick?: () => void;
}

const ContentAddPanel: React.FC<ContentAddPanelProps> = ({ 
  onImageAddClick, 
  onTextAddClick, 
  onVideoAddClick,
  onReorderClick
}) => {
  return (
    <div className="border border-[#ADADAD] rounded-[10px] relative overflow-hidden mb-[10px]" style={{height: 260}}>
      {/* 세로 구분선 */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#ADADAD] z-10"></div>
      {/* 가로 구분선 */}
      <div className="absolute top-1/2 left-0 right-0 h-px bg-[#ADADAD] z-10"></div>
      {/* 4등분 버튼 */}
      <button className="absolute top-0 left-0 w-1/2 h-1/2 flex flex-col items-center justify-center gap-[6px] hover:bg-gray-50 transition-colors duration-200" onClick={onImageAddClick}>
        <FaImage className="w-[40px] h-[40px] text-black" />
        <span className="text-[18px] text-center">이미지 추가</span>
      </button>
      <button className="absolute top-0 right-0 w-1/2 h-1/2 flex flex-col items-center justify-center gap-[6px] hover:bg-gray-50 transition-colors duration-200" onClick={onTextAddClick}>
        <RiText className="w-[40px] h-[40px] text-black" />
        <span className="text-[18px] text-center">텍스트 추가</span>
      </button>
      <button className="absolute bottom-0 left-0 w-1/2 h-1/2 flex flex-col items-center justify-center gap-[6px] hover:bg-gray-50 transition-colors duration-200" onClick={onVideoAddClick}>
        <IoMdVideocam className="w-[40px] h-[40px] text-black" />
        <span className="text-[18px] text-center">동영상 추가</span>
      </button>
      <button className="absolute bottom-0 right-0 w-1/2 h-1/2 flex flex-col items-center justify-center gap-[6px] hover:bg-gray-50 transition-colors duration-200" onClick={onReorderClick}>
        <HiMiniArrowsUpDown className="w-[40px] h-[40px] text-black" />
        <span className="text-[18px] text-center leading-6">
          컨텐츠 재정렬<br />및 삭제
        </span>
      </button>
    </div>
  );
};

export default ContentAddPanel; 