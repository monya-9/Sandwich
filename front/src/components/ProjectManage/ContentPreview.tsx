import React, { useState } from "react";
import { HiMiniArrowsUpDown } from "react-icons/hi2";
import { FaTrash } from "react-icons/fa";

export default function ContentPreview({ content, onDelete }: { content: { id: string; type: string; value: any }, onDelete: () => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  return (
    <div
      className="relative w-full flex flex-col items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setHoveredButton(null); }}
    >
      {/* 미리보기 */}
      {content.type === "image" && (
        <img src={content.value[0]} alt="preview" className="w-40 h-40 object-cover rounded" />
      )}
      {content.type === "text" && (
        <div className="p-4 border rounded w-full text-center">{content.value}</div>
      )}
      {content.type === "video" && (
        <video src={content.value} controls className="w-60 h-40 rounded" />
      )}

      {/* 오버레이 */}
      {isHovered && (
        <div className="absolute top-[-30px] left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
          <div className="bg-white border border-gray-300 rounded shadow-lg flex gap-2 px-4 py-2 relative">
            {/* 재정렬 */}
            <div className="relative">
              <button
                className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-sm"
                onMouseEnter={() => setHoveredButton('reorder')}
                onMouseLeave={() => setHoveredButton(null)}
              >
                <HiMiniArrowsUpDown className="w-4 h-4" />
              </button>
              {hoveredButton === 'reorder' && (
                <div className="absolute left-1/2 -translate-x-1/2 -top-10 flex flex-col items-center z-30 pointer-events-none">
                  <div className="bg-black text-white text-xs px-3 py-1.5 rounded-md shadow-lg font-medium"
                       style={{minWidth: 120, textAlign: 'center', letterSpacing: "-0.5px"}}>
                    콘텐츠 재정렬
                  </div>
                  <div className="w-2.5 h-2.5 bg-black rotate-45 -mt-1"></div>
                </div>
              )}
            </div>
            {/* 삭제 */}
            <div className="relative">
              <button
                className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-sm"
                onMouseEnter={() => setHoveredButton('delete')}
                onMouseLeave={() => setHoveredButton(null)}
                onClick={onDelete}
              >
                <FaTrash className="w-4 h-4" />
              </button>
              {hoveredButton === 'delete' && (
                <div className="absolute left-1/2 -translate-x-1/2 -top-10 flex flex-col items-center z-30 pointer-events-none">
                  <div className="bg-black text-white text-xs px-3 py-1.5 rounded-md shadow-lg font-medium"
                       style={{minWidth: 120, textAlign: 'center', letterSpacing: "-0.5px"}}>
                    콘텐츠 삭제
                  </div>
                  <div className="w-2.5 h-2.5 bg-black rotate-45 -mt-1"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 