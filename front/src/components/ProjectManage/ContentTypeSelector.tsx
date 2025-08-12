import React from "react";
import { FaImage } from "react-icons/fa6";
import { RiText } from "react-icons/ri";
import { IoMdVideocam } from "react-icons/io";

interface ContentTypeSelectorProps {
  onImageClick: () => void;
  onTextClick: () => void;
  onVideoClick: () => void;
}

const ContentTypeSelector: React.FC<ContentTypeSelectorProps> = ({ 
  onImageClick, 
  onTextClick, 
  onVideoClick 
}) => {
  return (
    <>
      <div className="text-[#ADADAD] text-[24px] mb-[40px] text-center">
        컨텐츠를 선택하여 업로드를 시작하세요.
      </div>
      <div className="flex justify-center gap-[56px]">
        {/* 이미지 */}
        <div className="flex flex-col items-center">
          <div className="w-[140px] h-[140px] border border-[#ADADAD] rounded-full flex items-center justify-center mb-[16px] hover:border-black transition-colors duration-200 cursor-pointer" onClick={onImageClick}>
            <FaImage className="w-[48px] h-[48px] text-[#ADADAD]" />
          </div>
          <span className="text-[20px] text-black">이미지</span>
        </div>
        {/* 텍스트 */}
        <div className="flex flex-col items-center">
          <div className="w-[140px] h-[140px] border border-[#ADADAD] rounded-full flex items-center justify-center mb-[16px] hover:border-black transition-colors duration-200 cursor-pointer" onClick={onTextClick}>
            <RiText className="w-[48px] h-[48px] text-[#ADADAD]" />
          </div>
          <span className="text-[20px] text-black">텍스트</span>
        </div>
        {/* 동영상 */}
        <div className="flex flex-col items-center">
          <div className="w-[140px] h-[140px] border border-[#ADADAD] rounded-full flex items-center justify-center mb-[16px] hover:border-black transition-colors duration-200 cursor-pointer" onClick={onVideoClick}>
            <IoMdVideocam className="w-[48px] h-[48px] text-[#ADADAD]" />
          </div>
          <span className="text-[20px] text-black">동영상</span>
        </div>
      </div>
    </>
  );
};

export default ContentTypeSelector; 