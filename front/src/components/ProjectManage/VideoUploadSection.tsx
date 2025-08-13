import React, { useMemo, useState, useEffect, forwardRef, useImperativeHandle, useRef } from "react";
import { IoMdVideocam } from "react-icons/io";
import { createPortal } from "react-dom";

export interface VideoUploadSectionHandle {
  openUrlModal: () => void;
}

interface VideoUploadSectionProps {
  onBack: () => void;
  onComplete?: (videoUrl: string) => void;
  setImgSize: (size: { width: number; height: number }) => void;
  imgSize: { width: number; height: number };
  onUploadedChange: (uploaded: boolean) => void;
  removePadding: boolean;
  setRemovePadding: (updater: (prev: boolean) => boolean) => void;
}

function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.split("/").filter(Boolean)[0] || null;
    }
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname.startsWith("/watch")) {
        return u.searchParams.get("v");
      }
      if (u.pathname.startsWith("/shorts/")) {
        return u.pathname.split("/")[2] || null;
      }
      if (u.pathname.startsWith("/embed/")) {
        return u.pathname.split("/")[2] || null;
      }
    }
  } catch (_) {}
  return null;
}

function getVimeoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("vimeo.com")) {
      const parts = u.pathname.split("/").filter(Boolean);
      const idx = parts[0] === "video" ? 1 : 0;
      return parts[idx] || null;
    }
  } catch (_) {}
  return null;
}

function getEmbedUrl(url: string): { provider: "youtube" | "vimeo" | null; embedUrl: string | null } {
  const yt = getYouTubeId(url);
  if (yt) return { provider: "youtube", embedUrl: `https://www.youtube.com/embed/${yt}` };
  const vm = getVimeoId(url);
  if (vm) return { provider: "vimeo", embedUrl: `https://player.vimeo.com/video/${vm}` };
  return { provider: null, embedUrl: null };
}

const VideoUploadSection = forwardRef<VideoUploadSectionHandle, VideoUploadSectionProps>(
  ({ onBack, onComplete, setImgSize, imgSize, onUploadedChange, removePadding, setRemovePadding }, ref) => {
    const [videoUrl, setVideoUrl] = useState("https://");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
    const [tempUrl, setTempUrl] = useState("");

    // 프리뷰 실제 크기 측정을 위한 ref
    const previewBoxRef = useRef<HTMLDivElement | null>(null);
    const modalTextareaRef = useRef<HTMLTextAreaElement | null>(null);

    useImperativeHandle(ref, () => ({
      openUrlModal: () => {
        setTempUrl(videoUrl);
        setIsUrlModalOpen(true);
      }
    }), [videoUrl]);

    const isDirectVideo = useMemo(() => /\.(mp4|webm|ogg)$/i.test(videoUrl), [videoUrl]);

    // 프리뷰가 생기거나 리사이즈될 때 실제 크기를 측정해 상위 컨테이너 크기와 동기화
    useEffect(() => {
      if (!previewUrl) return;
      const update = () => {
        const el = previewBoxRef.current;
        if (!el) return;
        const width = el.offsetWidth;
        const height = el.offsetHeight;
        setImgSize({ width, height });
        onUploadedChange(true);
      };
      update();
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }, [previewUrl, setImgSize, onUploadedChange]);

    // 모달 열릴 때 포커스 및 스크롤 락
    useEffect(() => {
      if (isUrlModalOpen) {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        // 다음 프레임에 포커스
        setTimeout(() => modalTextareaRef.current?.focus(), 0);
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsUrlModalOpen(false); };
        window.addEventListener("keydown", onKey);
        return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
      }
    }, [isUrlModalOpen]);

    const materializePreview = (url: string) => {
      const { embedUrl } = getEmbedUrl(url);
      const finalUrl = embedUrl || (/(mp4|webm|ogg)$/i.test(url) ? url : null);
      setPreviewUrl(finalUrl);
      if (finalUrl && onComplete) onComplete(finalUrl);
    };

    const confirmUrlChange = () => {
      setVideoUrl(tempUrl);
      setIsUrlModalOpen(false);
      materializePreview(tempUrl);
    };

    const modal = isUrlModalOpen ? (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center" aria-modal="true" role="dialog">
        <div className="absolute inset-0 bg-black/50" onClick={() => setIsUrlModalOpen(false)} />
        <div className="relative bg-white w-[640px] max-w-[90%] rounded-lg shadow-xl">
          <div className="px-6 py-4 border-b text-[16px] font-semibold">URL 변경</div>
          <div className="p-6">
            <textarea
              ref={modalTextareaRef}
              className="w-full h-28 border border-gray-300 rounded-md p-3 text-[14px] focus:outline-none focus:border-black"
              value={tempUrl}
              onChange={(e) => setTempUrl(e.target.value)}
            />
          </div>
          <div className="px-6 py-4 border-t flex justify-end gap-2">
            <button className="h-10 px-5 rounded-md border border-gray-300 hover:bg-gray-50" onClick={() => setIsUrlModalOpen(false)}>취소</button>
            <button className="h-10 px-5 rounded-md bg-black text-white" onClick={confirmUrlChange}>완료</button>
          </div>
        </div>
      </div>
    ) : null;

    return (
      <div className="flex flex-col items-center w-full">
        <div className="w-full max-w-[820px] px-0">
          {!previewUrl && (
            <>
              <div className="w-[96px] h-[96px] rounded-full bg-[#e6f9fa] flex items-center justify-center mb-6 mx-auto">
                <IoMdVideocam className="w-[48px] h-[48px] text-[#18b6b2]" />
              </div>
              <div className="text-center text-black text-[18px] font-medium mb-2">
                동영상 URL을 입력해주세요 <span className="text-gray-400 text-[16px]">(Youtube, Vimeo 지원)</span>
              </div>
              <div className="text-center text-gray-400 text-[14px] mb-8">Youtube, Vimeo 지원</div>

              {/* 초기 입력 + 저장 */}
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="flex-1 h-12 px-5 border border-gray-300 rounded-full text-black text-[16px] placeholder-gray-400 focus:outline-none focus:border-black"
                  placeholder="https://"
                />
                <button
                  onClick={() => materializePreview(videoUrl)}
                  className="h-12 px-6 bg-white border border-gray-300 rounded-full text-black hover:bg-gray-50 transition-colors text-[16px] font-medium"
                >
                  저장하기
                </button>
              </div>
            </>
          )}

          {previewUrl && (
            <div className="mt-0 w-full">
              <div ref={previewBoxRef} className="relative w-full" style={{ paddingTop: "56.25%" }}>
                {previewUrl.includes("youtube.com/embed") || previewUrl.includes("player.vimeo.com/video") ? (
                  <iframe
                    src={previewUrl}
                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    title="video preview"
                  />
                ) : (
                  <video src={previewUrl} controls className={`absolute top-0 left-0 w-full h-full rounded-lg ${removePadding ? 'object-cover' : 'object-contain'}`} />
                )}
              </div>
            </div>
          )}
        </div>
        {typeof document !== 'undefined' ? createPortal(modal, document.body) : modal}
      </div>
    );
  }
);

export default VideoUploadSection;