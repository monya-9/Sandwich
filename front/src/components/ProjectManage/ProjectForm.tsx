import React, { useRef, useState } from "react";
import Header from "../Main/Header";
import { HiMiniArrowsUpDown } from "react-icons/hi2";
import { FaTrash } from "react-icons/fa";
import ImageUploadSection from "./ImageUploadSection";
import SettingsPanel from "./SettingsPanel";
import ContentTypeSelector from "./ContentTypeSelector";
import ContentAddPanel from "./ContentAddPanel";
import TextUploadSection from "./TextUploadSection";
import VideoUploadSection from "./VideoUploadSection";
import ContentPreview from "./ContentPreview";

export default function ProjectForm() {
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showTextUpload, setShowTextUpload] = useState(false);
  const [showVideoUpload, setShowVideoUpload] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imgSize, setImgSize] = useState<{width:number, height:number}>({width:0, height:0});

  const handleImageButtonClick = () => {
    setShowImageUpload(true);
    setShowTextUpload(false);
    setShowVideoUpload(false);
    setIsHovered(false);
    setHoveredButton(null);
  };

  const handleTextButtonClick = () => {
    setShowTextUpload(true);
    setShowImageUpload(false);
    setShowVideoUpload(false);
    setIsHovered(false);
    setHoveredButton(null);
  };

  const handleVideoButtonClick = () => {
    setShowVideoUpload(true);
    setShowImageUpload(false);
    setShowTextUpload(false);
    setIsHovered(false);
    setHoveredButton(null);
  };

  const handleUploadBack = () => {
    setShowImageUpload(false);
    setShowTextUpload(false);
    setShowVideoUpload(false);
    setImagePreviews([]);
    setIsHovered(false);
    setHoveredButton(null);
  };

  return (
    <div className="min-h-screen bg-white font-gmarket relative">
      {/* 헤더 */}
      <Header />

      {/* 메인 컨텐츠 */}
      <main className="w-[1440px] mx-auto">
        <div className="flex justify-start gap-[28px] px-[30px] pt-[40px]">
          {/* 왼쪽 콘텐츠 */}
          <section className="w-[1000px] h-[829px] border border-[#ADADAD] rounded-[10px] flex flex-col items-center pt-[80px] relative">
            {/* absolute 네모박스(800x600)에만 hover, 이미지 업로드 시 크기 동적 조정 */}
            <div
              className={`absolute top-[0px] left-1/2 -translate-x-1/2 border rounded-lg transition-colors duration-200 flex flex-col items-center justify-center ${isHovered ? 'border-black' : 'border-transparent'}`}
              style={{
                zIndex: 10,
                background: 'white',
                width: showImageUpload && imagePreviews.length > 0 ? (imgSize.width || 400) : 800,
                height: showImageUpload && imagePreviews.length > 0 ? (imgSize.height || 400) : 600,
                transition: 'width 0.2s, height 0.2s'
              }}
              onMouseEnter={() => {
                if (showImageUpload || showTextUpload || showVideoUpload) setIsHovered(true);
              }}
              onMouseLeave={() => {
                setIsHovered(false);
                setHoveredButton(null);
              }}
            >
              <div className="w-full flex flex-col items-center">
                {showImageUpload ? (
                  <ImageUploadSection
                    showImageUpload={showImageUpload}
                    setShowImageUpload={setShowImageUpload}
                    imagePreviews={imagePreviews}
                    setImagePreviews={setImagePreviews}
                    fileInputRef={fileInputRef}
                    handleUploadBack={handleUploadBack}
                    setImgSize={setImgSize}
                    imgSize={imgSize}
                  />
                ) : showTextUpload ? (
                  <TextUploadSection onBack={handleUploadBack} />
                ) : showVideoUpload ? (
                  <VideoUploadSection onBack={handleUploadBack} />
                ) : (
                  <ContentTypeSelector 
                    onImageClick={handleImageButtonClick}
                    onTextClick={handleTextButtonClick}
                    onVideoClick={handleVideoButtonClick}
                  />
                )}
              </div>
              {/* 오버레이: 아이콘 hover시 검정 말풍선 툴팁 */}
              {((showImageUpload || showTextUpload || showVideoUpload) && isHovered) && (
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
                        onClick={handleUploadBack}
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
          </section>

          {/* 오른쪽 설정 영역 */}
          <aside className="w-[357px] flex flex-col gap-[16px] mt-[0px]">
            <ContentAddPanel 
              onImageAddClick={handleImageButtonClick}
              onTextAddClick={handleTextButtonClick}
              onVideoAddClick={handleVideoButtonClick}
            />
            <SettingsPanel />
            <div className="flex flex-col gap-[12px]">
              <button className="bg-[#E5E7EB] rounded-[30px] w-[357px] h-[82px] text-black text-[24px] hover:bg-gray-300 transition-colors duration-200">
                다음
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
