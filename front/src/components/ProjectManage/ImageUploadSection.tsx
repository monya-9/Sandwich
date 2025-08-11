import React, { useRef } from "react";
import { FaImage } from "react-icons/fa6";

interface ImageUploadSectionProps {
  showImageUpload: boolean;
  setShowImageUpload: (show: boolean) => void;
  imagePreviews: string[];
  setImagePreviews: (previews: string[]) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleUploadBack: () => void;
  onComplete?: (images: string[]) => void;
  setImgSize: (size: {width: number, height: number}) => void;
  imgSize: {width: number, height: number};
  // lifted states
  removePadding: boolean;
  setRemovePadding: (updater: (prev: boolean) => boolean) => void;
  fileSelectMode: "add" | "replace";
  replaceIndex: number | null;
  setFileSelectMode: (mode: "add" | "replace") => void;
  setReplaceIndex: (index: number | null) => void;
}

const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  showImageUpload,
  setShowImageUpload,
  imagePreviews,
  setImagePreviews,
  fileInputRef,
  handleUploadBack,
  onComplete,
  setImgSize,
  imgSize,
  removePadding,
  setRemovePadding,
  fileSelectMode,
  replaceIndex,
  setFileSelectMode,
  setReplaceIndex,
}) => {
  // 파일 변경 핸들러 (ProjectForm에서 분리)
  const handleFileInputClick = () => {
    setFileSelectMode("add");
    setReplaceIndex(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // 교체 모드: 단일 파일만 받아 해당 인덱스의 이미지를 교체
    if (fileSelectMode === "replace" && replaceIndex !== null && files.length > 0) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (typeof ev.target?.result === "string") {
          const next = [...imagePreviews];
          next[replaceIndex] = ev.target.result;
          setImagePreviews(next);
          // 교체 후 모드 초기화
          setFileSelectMode("add");
          setReplaceIndex(null);
        }
      };
      reader.readAsDataURL(files[0]);
      return;
    }

    // 추가 모드: 다중 파일을 모두 미리보기로 생성
    const previews: string[] = [];
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (typeof ev.target?.result === "string") {
          previews.push(ev.target.result);
          if (previews.length === files.length) {
            setImagePreviews(previews);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // 드래그&드롭 핸들러 추가
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files) return;
    const previews: string[] = [];
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (typeof ev.target?.result === "string") {
          previews.push(ev.target.result);
          if (previews.length === files.length) {
            setImagePreviews(previews);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const previewRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col items-center">
      {showImageUpload && (
        <div
          className="flex flex-col items-center w-full"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {/* 안내 텍스트: 이미지 미리보기가 없을 때만 표시 */}
          {imagePreviews.length === 0 && (
            <>
              <div className="w-[96px] h-[96px] rounded-full bg-[#e6f9fa] flex items-center justify-center mb-8 cursor-pointer" onClick={handleFileInputClick}>
                <FaImage className="w-[48px] h-[48px] text-[#18b6b2]" />
              </div>
              <div className="text-center text-black text-[18px] font-medium mb-4 cursor-pointer" onClick={handleFileInputClick}>
                이미지(최대 10장)를 드래그 또는 업로드해 주세요.
              </div>
              <div className="text-center text-gray-400 text-[14px] mb-8">
                최대 10MB의 JPG, JPEG, PNG, WEBP 이미지 파일<br/>
                <span className="text-gray-300">(원활한 업로드 및 참여를 위해 WEBP를 권장합니다.)</span>
              </div>
            </>
          )}
          <input
            type="file"
            multiple
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          {/* 이미지 미리보기 */}
          {imagePreviews.length > 0 && (
            <div
              ref={previewRef}
              className="relative flex flex-col items-center justify-center text-center overflow-hidden mx-auto"
              style={{ width: `${imgSize.width}px`, maxWidth: '600px', height: `${imgSize.height}px`, maxHeight: '800px' }}
            >
              {imagePreviews.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`preview-${idx}`}
                  className={`w-full h-full block mx-auto ${removePadding ? 'object-cover' : 'object-contain'}`}
                  style={{ objectPosition:'top' }}
                  onLoad={e => {
                    const target = e.target as HTMLImageElement;
                    const naturalW = target.naturalWidth;
                    const naturalH = target.naturalHeight;
                    const maxW = 600;
                    const maxH = 800;
                    const scale = Math.min(maxW / naturalW, maxH / naturalH, 1);
                    const width = Math.floor(naturalW * scale);
                    const height = Math.floor(naturalH * scale);
                    setImgSize({ width, height });
                  }}
                />
              ))}
            </div>
          )}
          {imagePreviews.length > 0 && onComplete && (
            <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded" onClick={() => onComplete(imagePreviews)}>
              추가
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUploadSection; 