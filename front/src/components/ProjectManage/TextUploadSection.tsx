import React from "react";
import { HiMiniArrowsUpDown } from "react-icons/hi2";
import { FaTrash } from "react-icons/fa";

interface TextUploadSectionProps {
  onBack: () => void;
  onComplete?: (text: string) => void;
}

const TextUploadSection: React.FC<TextUploadSectionProps> = ({ onBack, onComplete }) => {
  const [text, setText] = React.useState("");
  const [showOverlay, setShowOverlay] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [overlayStyle, setOverlayStyle] = React.useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [hoveredButton, setHoveredButton] = React.useState<string | null>(null);

  // 오버레이 여유(px)
  const OVERLAY_HORIZONTAL_PAD = 195; // 좌우 총 여유: 입력보다 200px 넓게 (좌/우 각 100px)
  const OVERLAY_VERTICAL_PAD = 7;    // 상하 총 여유: 필요시 조절 (예: 12)

  // 입력 상자 높이(px)
  const INPUT_HEIGHT = 60; // 원하시는 높이로 즉시 수정 가능

  const updateOverlaySize = React.useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    setOverlayStyle({ width: el.offsetWidth, height: el.offsetHeight });
  }, []);

  React.useEffect(() => {
    updateOverlaySize();
    const onResize = () => updateOverlaySize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [updateOverlaySize]);

  return (
    <div className="w-full">
      <div className="w-full px-0">
        <div
          className="relative w-full mt-0 inline-block"
          onMouseEnter={() => { updateOverlaySize(); setShowOverlay(true); }}
          onMouseLeave={() => { setShowOverlay(false); setHoveredButton(null); }}
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="여기에 텍스트 입력..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="block w-full pl-0 pr-4 border border-transparent rounded-[10px] text-black text-[16px] bg-transparent focus:outline-none focus:border-transparent"
            style={{ fontFamily: 'inherit', height: INPUT_HEIGHT }}
          />
          {showOverlay && (
            <>
              <div
                className="absolute top-0 left-0 rounded-[10px] border border-black pointer-events-none z-10"
                style={{
                  width: overlayStyle.width + OVERLAY_HORIZONTAL_PAD,
                  height: overlayStyle.height + OVERLAY_VERTICAL_PAD,
                  left: -(OVERLAY_HORIZONTAL_PAD / 2),
                  top: -(OVERLAY_VERTICAL_PAD / 2)
                }}
              />
              {/* 상단 아이콘 툴바 */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
                <div className="bg-white border border-gray-300 rounded shadow-lg flex gap-2 px-4 py-2 relative">
                  {/* 재정렬 */}
                  <div className="relative">
                    <button
                      className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-sm"
                      onMouseEnter={() => setHoveredButton('reorder')}
                      onMouseLeave={() => setHoveredButton(null)}
                      type="button"
                    >
                      <HiMiniArrowsUpDown className="w-4 h-4" />
                    </button>
                    {hoveredButton === 'reorder' && (
                      <div className="absolute left-1/2 -translate-x-1/2 -top-10 flex flex-col items-center z-30 pointer-events-none">
                        <div className="bg-black text-white text-xs px-3 py-1.5 rounded-md shadow-lg font-medium" style={{minWidth: 120, textAlign: 'center', letterSpacing: "-0.5px"}}>
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
                      onClick={onBack}
                      type="button"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                    {hoveredButton === 'delete' && (
                      <div className="absolute left-1/2 -translate-x-1/2 -top-10 flex flex-col items-center z-30 pointer-events-none">
                        <div className="bg-black text-white text-xs px-3 py-1.5 rounded-md shadow-lg font-medium" style={{minWidth: 120, textAlign: 'center', letterSpacing: "-0.5px"}}>
                          콘텐츠 삭제
                        </div>
                        <div className="w-2.5 h-2.5 bg-black rotate-45 -mt-1"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextUploadSection; 