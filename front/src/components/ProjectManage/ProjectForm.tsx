import React, { useState, useRef, useEffect } from "react";
import SettingsPanel from "./SettingsPanel";
import ContentAddPanel from "./ContentAddPanel";
import ContentTypeSelector from "./ContentTypeSelector";
import ImageUploadSection from "./ImageUploadSection";
import TextUploadSection from "./TextUploadSection";
import VideoUploadSection, { VideoUploadSectionHandle } from "./VideoUploadSection";
import { HiMiniArrowsUpDown } from "react-icons/hi2";
import { FaTrash } from "react-icons/fa";
import { FiMaximize2, FiImage } from "react-icons/fi";
import { IoMdVideocam } from "react-icons/io";
import { RiText } from "react-icons/ri";

// 개별 블록: 기존 업로드 섹션과 동일한 UI/오버레이를 그대로 포함
function BlockItem({ type, onRemove, onOpenReorder, isFirst, isLast, hasGap }: { type: "image" | "text" | "video"; onRemove: () => void; onOpenReorder: () => void; isFirst: boolean; isLast: boolean; hasGap: boolean }) {
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  // 이미지 상태
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 공통 크기
  const [imgSize, setImgSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // 동영상 상태
  const [videoUploaded, setVideoUploaded] = useState(false);
  const videoSectionRef = useRef<VideoUploadSectionHandle>(null);

  // 오버레이 컨트롤
  const [removePadding, setRemovePadding] = useState<boolean>(false);
  const [fileSelectMode, setFileSelectMode] = useState<"add" | "replace">("add");
  const [replaceIndex, setReplaceIndex] = useState<number | null>(0);

  const handleUploadBack = () => {
    setImagePreviews([]);
    setIsHovered(false);
    setHoveredButton(null);
    setRemovePadding(false);
    setFileSelectMode("add");
    setReplaceIndex(0);
    setVideoUploaded(false);
    onRemove();
  };

  const showImageUpload = type === "image";
  const showTextUpload = type === "text";
  const showVideoUpload = type === "video";

  const dynamicWidth = (showImageUpload && imagePreviews.length > 0) || (showVideoUpload && videoUploaded)
    ? (imgSize.width || 400)
    : 800;
  const dynamicHeight = (showImageUpload && imagePreviews.length > 0)
    ? (imgSize.height || 400)
    : (showVideoUpload && videoUploaded)
      ? (imgSize.height || 400)
      : (showTextUpload ? "auto" : 600);

  const initialPad = ((showImageUpload && imagePreviews.length === 0) || (showVideoUpload && !videoUploaded)) ? 80 : 0;

  const roundedClass = hasGap
    ? "rounded-lg"
    : (isFirst && isLast)
      ? "rounded-lg"
      : isFirst
        ? "rounded-t-lg"
        : isLast
          ? "rounded-b-lg"
          : "rounded-none";

  return (
    <div className="w-full flex justify-center">
      <div
        className={`relative border ${roundedClass} transition-colors duration-200 flex flex-col items-center justify-start ${
          showTextUpload ? "" : ""
        } ${showTextUpload ? "border-transparent" : isHovered ? "border-black" : "border-transparent"} ${!hasGap && !isFirst && !isHovered ? "border-t-0" : ""}`}
        style={{ background: showTextUpload ? "transparent" : "white", width: dynamicWidth, height: dynamicHeight as number | string, transition: "width 0.2s, height 0.2s", paddingTop: initialPad }}
        onMouseEnter={() => {
          if (showImageUpload || showVideoUpload) setIsHovered(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          setHoveredButton(null);
        }}
      >
        <div className={`w-full flex flex-col ${showTextUpload ? "items-stretch h-full" : "items-center"}`}>
          {showImageUpload ? (
            <ImageUploadSection
              showImageUpload={showImageUpload}
              setShowImageUpload={() => {}}
              imagePreviews={imagePreviews}
              setImagePreviews={setImagePreviews}
              fileInputRef={fileInputRef}
              handleUploadBack={handleUploadBack}
              setImgSize={setImgSize}
              imgSize={imgSize}
              removePadding={removePadding}
              setRemovePadding={setRemovePadding}
              fileSelectMode={fileSelectMode}
              replaceIndex={replaceIndex}
              setFileSelectMode={setFileSelectMode}
              setReplaceIndex={setReplaceIndex}
            />
          ) : showTextUpload ? (
            <TextUploadSection onBack={handleUploadBack} />
          ) : showVideoUpload ? (
            <VideoUploadSection
              ref={videoSectionRef}
              onBack={handleUploadBack}
              setImgSize={setImgSize}
              imgSize={imgSize}
              onUploadedChange={setVideoUploaded}
              removePadding={removePadding}
              setRemovePadding={setRemovePadding}
            />
          ) : null}
        </div>

        {/* 공통 오버레이: 텍스트 제외, 이미지/동영상 업로드 전 */}
        {(((showVideoUpload && !videoUploaded) || (showImageUpload && imagePreviews.length === 0)) && isHovered) && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
            <div className="bg-white border border-gray-300 rounded shadow-lg flex gap-2 px-4 py-2 relative">
              {/* 재정렬 */}
              <div className="relative">
                <button
                  className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-sm"
                  onMouseEnter={() => setHoveredButton('reorder')}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={(e) => { e.stopPropagation(); onOpenReorder(); }}
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
              {/* 삭제 (블록 제거) */}
              <div className="relative">
                <button
                  className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-sm"
                  onMouseEnter={() => setHoveredButton('delete')}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={handleUploadBack}
                >
                  <FaTrash className="w-4 h-4" />
                </button>
                {hoveredButton === 'delete' && (
                  <div className="absolute left-1/2 -translate-x-1/2 -top-10 flex flex-col items-center z-30" onMouseEnter={() => setHoveredButton('delete')} onMouseLeave={() => setHoveredButton(null)}>
                    <div className="bg-black text-white text-xs px-3 py-1.5 rounded-md shadow-lg font-medium" style={{minWidth: 120, textAlign: 'center', letterSpacing: "-0.5px"}}>
                      콘텐츠 삭제
                    </div>
                    <div className="w-2.5 h-2.5 bg-black rotate-45 -mt-1"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 이미지 업로드 후 → 패딩/이미지변경/재정렬/삭제 */}
        {(showImageUpload && imagePreviews.length > 0 && isHovered) && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
            <div className="bg-white border border-gray-300 rounded shadow-lg flex gap-2 px-4 py-2 relative">
              {/* 패딩 토글 */}
              <div className="relative">
                <button
                  className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-sm"
                  onMouseEnter={() => setHoveredButton('padding')}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => setRemovePadding((v) => !v)}
                >
                  <FiMaximize2 className="w-4 h-4" />
                </button>
                {hoveredButton === 'padding' && (
                  <div className="absolute left-1/2 -translate-x-1/2 -top-10 flex flex-col items-center z-30 pointer-events-none">
                    <div className="bg-black text-white text-xs px-3 py-1.5 rounded-md shadow-lg font-medium" style={{minWidth: 120, textAlign: 'center', letterSpacing: "-0.5px"}}>
                      {removePadding ? '패딩 복원' : '패딩 제거'}
                    </div>
                    <div className="w-2.5 h-2.5 bg-black rotate-45 -mt-1"></div>
                  </div>
                )}
              </div>
              {/* 이미지 변경 */}
              <div className="relative">
                <button
                  className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-sm"
                  onMouseEnter={() => setHoveredButton('image')}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FiImage className="w-4 h-4" />
                </button>
                {hoveredButton === 'image' && (
                  <div className="absolute left-1/2 -translate-x-1/2 -top-10 flex flex-col items-center z-30 pointer-events-none">
                    <div className="bg-black text-white text-xs px-3 py-1.5 rounded-md shadow-lg font-medium" style={{minWidth: 120, textAlign: 'center', letterSpacing: "-0.5px"}}>
                      이미지 변경
                    </div>
                    <div className="w-2.5 h-2.5 bg-black rotate-45 -mt-1"></div>
                  </div>
                )}
              </div>
              {/* 재정렬 */}
              <div className="relative">
                <button
                  className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-sm"
                  onMouseEnter={() => setHoveredButton('reorder')}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={(e) => { e.stopPropagation(); onOpenReorder(); }}
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
                  onClick={handleUploadBack}
                >
                  <FaTrash className="w-4 h-4" />
                </button>
                {hoveredButton === 'delete' && (
                  <div className="absolute left-1/2 -translate-x-1/2 -top-10 flex flex-col items-center z-30" onMouseEnter={() => setHoveredButton('delete')} onMouseLeave={() => setHoveredButton(null)}>
                    <div className="bg-black text-white text-xs px-3 py-1.5 rounded-md shadow-lg font-medium" style={{minWidth: 120, textAlign: 'center', letterSpacing: "-0.5px"}}>
                      콘텐츠 삭제
                    </div>
                    <div className="w-2.5 h-2.5 bg-black rotate-45 -mt-1"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 동영상 업로드 후 → 패딩/URL변경/재정렬/삭제 */}
        {(showVideoUpload && videoUploaded && isHovered) && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
            <div className="bg-white border border-gray-300 rounded shadow-lg flex gap-2 px-4 py-2 relative">
              {/* 패딩 */}
              <div className="relative">
                <button
                  className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-sm"
                  onMouseEnter={() => setHoveredButton('padding')}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => setRemovePadding((v) => !v)}
                >
                  <FiMaximize2 className="w-4 h-4" />
                </button>
                {hoveredButton === 'padding' && (
                  <div className="absolute left-1/2 -translate-x-1/2 -top-10 flex flex-col items-center z-30 pointer-events-none">
                    <div className="bg-black text-white text-xs px-3 py-1.5 rounded-md shadow-lg font-medium" style={{minWidth: 120, textAlign: 'center', letterSpacing: "-0.5px"}}>
                      {removePadding ? '패딩 복원' : '패딩 제거'}
                    </div>
                    <div className="w-2.5 h-2.5 bg-black rotate-45 -mt-1"></div>
                  </div>
                )}
              </div>
              {/* URL 변경 */}
              <div className="relative">
                <button
                  className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-sm"
                  onMouseEnter={() => setHoveredButton('url')}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => { videoSectionRef.current?.openUrlModal(); }}
                >
                  <IoMdVideocam className="w-4 h-4" />
                </button>
                {hoveredButton === 'url' && (
                  <div className="absolute left-1/2 -translate-x-1/2 -top-10 flex flex-col items-center z-30 pointer-events-none">
                    <div className="bg-black text-white text-xs px-3 py-1.5 rounded-md shadow-lg font-medium" style={{minWidth: 120, textAlign: 'center', letterSpacing: "-0.5px"}}>
                      URL 변경
                    </div>
                    <div className="w-2.5 h-2.5 bg-black rotate-45 -mt-1"></div>
                  </div>
                )}
              </div>
              {/* 재정렬 */}
              <div className="relative">
                <button
                  className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-sm"
                  onMouseEnter={() => setHoveredButton('reorder')}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={(e) => { e.stopPropagation(); onOpenReorder(); }}
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
                  onClick={handleUploadBack}
                >
                  <FaTrash className="w-4 h-4" />
                </button>
                {hoveredButton === 'delete' && (
                  <div className="absolute left-1/2 -translate-x-1/2 -top-10 flex flex-col items-center z-30" onMouseEnter={() => setHoveredButton('delete')} onMouseLeave={() => setHoveredButton(null)}>
                    <div className="bg-black text-white text-xs px-3 py-1.5 rounded-md shadow-lg font-medium" style={{minWidth: 120, textAlign: 'center', letterSpacing: "-0.5px"}}>
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
    </div>
  );
}

export default function ProjectForm() {
  type ItemType = "image" | "text" | "video";
  const [items, setItems] = useState<Array<{ id: string; type: ItemType }>>([]);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [scrollToId, setScrollToId] = useState<string | null>(null);
  const [isReorderOpen, setIsReorderOpen] = useState(false);
  const [showEmptyToast, setShowEmptyToast] = useState(false);
  const toastTimerRef = useRef<number | null>(null);
  const [isSelectHovered, setIsSelectHovered] = useState(false);

  // 페이지 배경색 상태
  const [backgroundColor, setBackgroundColor] = useState<string>("#FFFFFF");
  const [contentGapPx, setContentGapPx] = useState<number>(10);

  useEffect(() => {
    if (!scrollToId) return;
    const id = scrollToId;
    requestAnimationFrame(() => {
      const el = itemRefs.current[id];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      setScrollToId(null);
    });
  }, [scrollToId]);

  const applyNewOrder = (orderedIds: string[]) => {
    setItems(prev => orderedIds.map(id => prev.find(p => p.id === id)!).filter(Boolean) as typeof prev);
    setIsReorderOpen(false);
  };

  const modal = isReorderOpen ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => setIsReorderOpen(false)} />
      <div className="relative bg-white w-[650px] max-w-[95%] rounded-xl shadow-xl max-h-[90vh] overflow-auto">
        <div className="px-6 py-4 border-b text-[18px] font-semibold">콘텐츠 재정렬</div>
        <ReorderList items={items} onCancel={() => setIsReorderOpen(false)} onConfirm={applyNewOrder} />
      </div>
    </div>
  ) : null;

  const addItem = (type: ItemType) => {
    const id = Math.random().toString(36).slice(2);
    setItems(prev => [...prev, { id, type }]);
    setScrollToId(id);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    setScrollToId(null);
  };

  const handleOpenReorder = () => {
    if (items.length === 0) {
      setShowEmptyToast(true);
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      // 2초 뒤 자동 닫힘
      toastTimerRef.current = window.setTimeout(() => setShowEmptyToast(false), 2000);
      return;
    }
    setIsReorderOpen(true);
  };

  return (
    <div className="min-h-screen font-gmarket relative">
      {showEmptyToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[10000]" onClick={() => setShowEmptyToast(false)}>
          <div className="bg-[#111] text-white rounded-[10px] px-4 py-2 shadow-lg flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-[#F04438] flex items-center justify-center text-[12px] font-bold">!</span>
            <span className="text-[14px]">아직 생성된 컨텐츠가 없습니다.</span>
          </div>
        </div>
      )}
      <main className="w-[1440px] mx-auto">
        <div className="flex justify-start gap-[28px] px-[30px] pt-[40px]">
          {/* 왼쪽 콘텐츠 */}
                                <section className="w-[1000px] min-h-[829px] border border-[#ADADAD] rounded-[10px] flex flex-col items-center relative pt-0 pb-10" style={{ backgroundColor }}>
            <div className="w-full flex flex-col items-center" style={{ gap: `${contentGapPx}px` }}>

              {items.length === 0 ? (
                <div className="mt-0 flex justify-center w-full" onMouseEnter={() => setIsSelectHovered(true)} onMouseLeave={() => setIsSelectHovered(false)}>
                  <div className="relative rounded-lg" style={{ width: 800, height: 600, background: 'white' }}>
                    {/* 호버 시 상단에 딱 붙는 검은 테두리 박스 */}
                    {isSelectHovered && (
                      <div className="pointer-events-none absolute left-0 right-0 top-0 border border-black rounded-lg" style={{ height: 600 }} />
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-start" style={{ paddingTop: 80 }}>
                      <ContentTypeSelector
                        onImageClick={() => addItem("image")}
                        onTextClick={() => addItem("text")}
                        onVideoClick={() => addItem("video")}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                items.map((item, idx) => (
                  <div key={item.id} ref={el => { itemRefs.current[item.id] = el; }}>
                    <BlockItem
                      type={item.type}
                      onRemove={() => removeItem(item.id)}
                      onOpenReorder={() => setIsReorderOpen(true)}
                      isFirst={idx === 0}
                      isLast={idx === items.length - 1}
                      hasGap={contentGapPx > 0}
                    />
                  </div>
                ))
              )}
            </div>
          </section>

          {/* 오른쪽 설정 영역 */}
          <aside className="w-[357px] flex flex-col gap-[16px] mt-[0px]">
            <ContentAddPanel
              onImageAddClick={() => addItem("image")}
              onTextAddClick={() => addItem("text")}
              onVideoAddClick={() => addItem("video")}
              onReorderClick={handleOpenReorder}
            />
            <SettingsPanel backgroundColor={backgroundColor} onBackgroundColorChange={setBackgroundColor} contentGapPx={contentGapPx} onContentGapChange={setContentGapPx} />
            <div className="flex flex-col gap-[12px]">
              <button className="bg-[#E5E7EB] rounded-[30px] w-[357px] h-[82px] text-black text-[24px] hover:bg-gray-300 transition-colors duration-200">
                다음
              </button>
            </div>
          </aside>
        </div>
      </main>
      {modal}
    </div>
  );
}

// 간단한 드래그 재정렬 리스트 (HTML5 Drag & Drop)
function ReorderList({ items, onCancel, onConfirm }: { items: Array<{id: string; type: "image"|"text"|"video"}>; onCancel: () => void; onConfirm: (ids: string[]) => void }) {
  const [order, setOrder] = useState(items.map(i => i.id));
  useEffect(() => { setOrder(items.map(i => i.id)); }, [items]);

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const onDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === targetId) return;

    const fromIdx = order.indexOf(draggedId);
    const toIdx = order.indexOf(targetId);
    const next = order.filter(i => i !== draggedId);
    let insertIndex = next.indexOf(targetId);
    if (fromIdx < toIdx) insertIndex += 1; // 아래로 이동 시 target 뒤에 삽입
    next.splice(insertIndex, 0, draggedId);
    setOrder(next);
  };

  const needsScroll = order.length >= 3; // 항목이 적을 땐 스크롤 없이 자동으로 모두 보이게

  return (
    <div className="p-6">
      <p className="text-sm text-gray-600 mb-3">마우스 드래그로 콘텐츠 순서를 변경할 수 있습니다.</p>
      <div className={needsScroll ? "flex flex-col gap-2 mb-5 max-h-[50vh] overflow-auto pr-1" : "flex flex-col gap-2 mb-5"}>
        {order.map(id => {
          const item = items.find(i => i.id === id)!;
          const label = item.type === 'image' ? '이미지' : item.type === 'video' ? '동영상' : '텍스트';
          const iconEl = item.type === 'image' ? (
            <FiImage className="text-[18px]" />
          ) : item.type === 'video' ? (
            <IoMdVideocam className="text-[18px]" />
          ) : (
            <RiText className="text-[18px]" />
          );
          return (
            <div key={id}
                 className="flex items-center gap-3 border rounded-lg px-3 py-3 bg-white cursor-move select-none"
                 draggable
                 onDragStart={(e) => onDragStart(e, id)}
                 onDragOver={onDragOver}
                 onDrop={(e) => onDrop(e, id)}>
              <span className="text-lg">≡</span>
              <span className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-100">{iconEl}</span>
              <span className="text-[15px]">{label}</span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-end gap-2 border-t pt-4">
        <button className="h-10 px-5 rounded-md border border-gray-300 hover:bg-gray-50" onClick={onCancel}>취소</button>
        <button className="h-10 px-5 rounded-md bg-black text-white" onClick={() => onConfirm(order)}>완료</button>
      </div>
    </div>
  );
}
