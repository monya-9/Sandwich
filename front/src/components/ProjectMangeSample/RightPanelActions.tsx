import React from "react";
import { FaImage } from "react-icons/fa";
import { IoMdVideocam } from "react-icons/io";
import { HiMiniArrowsUpDown } from "react-icons/hi2";

interface RightPanelActionsProps {
  onImageAdd: () => void;
  onVideoAdd: () => void;
  onReorder: () => void;
}

const Tile: React.FC<{ onClick: () => void; icon: React.ReactNode; label: React.ReactNode }> = ({ onClick, icon, label }) => (
  <div className="border border-[#ADADAD] rounded-[10px] relative overflow-hidden" style={{ height: 130 }}>
    <button
      className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-[6px] hover:bg-gray-50 transition-colors duration-200"
      onClick={onClick}
      type="button"
    >
      {icon}
      <span className="text-[18px] text-center leading-6">{label}</span>
    </button>
  </div>
);

const RightPanelActions: React.FC<RightPanelActionsProps> = ({ onImageAdd, onVideoAdd, onReorder }) => {
  return (
    <div className="flex flex-col gap-[10px]">
      <Tile onClick={onImageAdd} icon={<FaImage className="w-[40px] h-[40px] text-black" />} label={<>이미지 추가</>} />
      <Tile onClick={onVideoAdd} icon={<IoMdVideocam className="w-[40px] h-[40px] text-black" />} label={<>동영상 추가</>} />
      <Tile onClick={onReorder} icon={<HiMiniArrowsUpDown className="w-[40px] h-[40px] text-black" />} label={<><span>콘텐츠 재정렬</span></>} />
    </div>
  );
};

export default RightPanelActions; 