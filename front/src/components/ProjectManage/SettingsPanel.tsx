import React from "react";

const SettingsPanel: React.FC = () => {
  return (
    <div className="border border-[#ADADAD] rounded-[10px] p-[24px]">
      <label className="block text-[#ADADAD] text-[20px] mb-1">배경색상 설정</label>
      <div className="flex items-center gap-2 mb-[24px]">
        <input
          type="text"
          className="w-[95px] border border-[#ADADAD] rounded px-2 py-1 text-black"
          defaultValue="#FFFFFF"
        />
        <div className="w-6 h-6 border border-[#ADADAD] rounded cursor-pointer" style={{ backgroundColor: '#FFFFFF' }}></div>
      </div>
      <label className="block text-[#ADADAD] text-[20px] mb-1">콘텐츠 간격 설정</label>
      <div className="flex items-center gap-3">
        <input type="range" min={0} max={30} defaultValue={10} className="w-[215px] accent-black" />
        <span className="text-[15px]">10px</span>
      </div>
    </div>
  );
};

export default SettingsPanel; 