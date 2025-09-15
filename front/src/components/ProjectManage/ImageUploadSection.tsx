import React, { useRef, useState } from "react";
import { FaImage } from "react-icons/fa6";
import { createPortal } from "react-dom";

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
  // NEW: 원본 가로폭 전달 콜백 (패딩 제거 가능 여부 판단용)
  onDetectNaturalWidth?: (width: number) => void;
  // NEW: 원본 크기 모드
  useOriginalSize?: boolean;
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
  onDetectNaturalWidth,
  useOriginalSize = false,
}) => {
  // 파일 변경 핸들러 (ProjectForm에서 분리)
  const handleFileInputClick = () => {
    setFileSelectMode("add");
    setReplaceIndex(null);
    fileInputRef.current?.click();
  };

  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp"];
  const isValidImage = (file: File) => {
    const name = file.name.toLowerCase();
    const ext = name.split(".").pop() || "";
    if (!ALLOWED_EXT.includes(ext)) return false;
    if (file.size > MAX_SIZE) return false;
    return true;
  };

  const anyOversized = (files: FileList | File[]) => Array.from(files).some(f => f.size > MAX_SIZE);

  // 상단 고정 토스트
  const [showOversizeToast, setShowOversizeToast] = useState(false);
  const notifyOversize = () => {
    setShowOversizeToast(true);
    window.setTimeout(() => setShowOversizeToast(false), 2000);
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (typeof ev.target?.result === "string") resolve(ev.target.result);
        else reject(new Error("failed to read file"));
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // 10MB 초과 파일이 하나라도 있으면 전면 차단
    if (anyOversized(files)) {
      notifyOversize();
      return;
    }

    // 교체 모드: 단일 파일만 받아 해당 인덱스의 이미지를 교체
    if (fileSelectMode === "replace" && replaceIndex !== null && files.length > 0) {
      const file = files[0];
      if (!isValidImage(file)) {
        notifyOversize();
        return;
      }
      const dataUrl = await readFileAsDataUrl(file);
      const next = [...imagePreviews];
      next[replaceIndex] = dataUrl;
      setImagePreviews(next);
      // 교체 후 모드 초기화
      setFileSelectMode("add");
      setReplaceIndex(null);
      return;
    }

    // 추가 모드: 다중 파일을 모두 미리보기로 생성 (검증 통과 파일만)
    const previews: string[] = [];
    const fileArr = Array.from(files);
    for (const file of fileArr) {
      if (!isValidImage(file)) {
        notifyOversize();
        return; // 전면 차단
      }
      const dataUrl = await readFileAsDataUrl(file);
      previews.push(dataUrl);
    }
    if (previews.length > 0) setImagePreviews(previews);
  };

  // 드래그&드롭 핸들러 추가 (검증 포함)
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files) return;

    if (anyOversized(files)) {
      notifyOversize();
      return;
    }

    const previews: string[] = [];
    for (const file of Array.from(files)) {
      if (!isValidImage(file)) {
        notifyOversize();
        return; // 전면 차단
      }
      const dataUrl = await readFileAsDataUrl(file);
      previews.push(dataUrl);
    }
    if (previews.length > 0) setImagePreviews(previews);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const previewRef = useRef<HTMLDivElement>(null);

  const oversizeToastEl = showOversizeToast ? (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[10000]" onClick={() => setShowOversizeToast(false)}>
      <div className="bg-[#111] text-white rounded-[10px] px-4 py-2 shadow-lg flex items-center gap-3">
        <span className="w-6 h-6 rounded-full bg-[#F04438] flex items-center justify-center text-[10px] font-bold">!</span>
        <span className="text-[14px]">10MB가 넘는 이미지가 있습니다</span>
      </div>
    </div>
  ) : null;

  // 컨테이너/이미지 스타일 결정: removePadding이 최우선
  const getContainerStyle = () => {
    if (removePadding) {
      return { width: '100%', height: 'auto' } as React.CSSProperties;
    }
    if (useOriginalSize) {
      return undefined; // 원본 크기
    }
    return { width: `${imgSize.width}px`, maxWidth: '100%', height: `${imgSize.height}px`, maxHeight: '800px' } as React.CSSProperties;
  };

  const getImageClass = () => {
    if (removePadding) return 'block mx-auto w-full h-auto';
    if (useOriginalSize) return 'block mx-auto max-w-full h-auto';
    return `w-full h-full block mx-auto ${removePadding ? 'object-contain' : 'object-contain'}`;
  };

  const getWrapperClass = () => {
    return removePadding ? 'relative flex flex-col items-center justify-center text-center overflow-hidden mx-auto w-full' : 'relative flex flex-col items-center justify-center text-center overflow-hidden mx-auto w-full';
  };

  const getWrapperStyle = () => {
    return removePadding ? getContainerStyle() : { ...(getContainerStyle() || {}), padding: 40, boxSizing: 'border-box' } as React.CSSProperties;
  };

  return (
    <div className="flex flex-col items-center">
      {typeof document !== 'undefined' ? createPortal(oversizeToastEl, document.body) : oversizeToastEl}
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
            accept="image/jpeg,image/jpg,image/png,image/webp"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          {/* 이미지 미리보기 */}
          {imagePreviews.length > 0 && (
            <div
              ref={previewRef}
              className={getWrapperClass()}
              style={getWrapperStyle()}
            >
              {imagePreviews.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`preview-${idx}`}
                  className={getImageClass()}
                  onLoad={e => {
                    const target = e.target as HTMLImageElement;
                    const naturalW = target.naturalWidth;
                    const naturalH = target.naturalHeight;
                    // 원본 가로폭 전달 (패딩 제거 가능 여부 판단용)
                    onDetectNaturalWidth?.(naturalW);
                    if (removePadding || useOriginalSize) {
                      // removePadding: 폭 100% 처리, useOriginalSize: 컨테이너 강제 지정 불필요
                      return;
                    }
                    // 화면 미리보기용으로는 최대 폭/높이를 기준으로 스케일링
                    const maxW = 1000; // 에디터 폭 대응
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