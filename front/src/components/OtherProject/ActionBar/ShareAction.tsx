import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { FaShareAlt } from "react-icons/fa";
import { FaLinkedin, FaPinterest, FaXTwitter } from "react-icons/fa6";
import { RiKakaoTalkFill } from "react-icons/ri";
import { SiNaver } from "react-icons/si";
import Toast from "../../common/Toast";
import { getStaticUrl } from "../../../config/staticBase";

// Kakao SDK 타입 선언
declare global {
  interface Window {
    Kakao: any;
  }
}

type ShareActionProps = {
  shareUrl?: string;
  thumbnailUrl?: string;
  title?: string;
  isMobile?: boolean;
};

export default function ShareAction({ shareUrl, thumbnailUrl, title, isMobile = false }: ShareActionProps) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: ''
  });
  const [kakaoInitialized, setKakaoInitialized] = useState(false);

  const finalShareUrl = shareUrl || (typeof window !== "undefined" ? window.location.href : "");
  const finalTitle = title || "프로젝트 이름";
  const finalThumb = thumbnailUrl || getStaticUrl("assets/images/default-thumbnail.png");

  // Kakao SDK 초기화
  useEffect(() => {
    const initKakao = () => {
      const kakaoKey = process.env.REACT_APP_KAKAO_JAVASCRIPT_KEY;
      
      if (!kakaoKey) {
        console.warn("REACT_APP_KAKAO_JAVASCRIPT_KEY 환경변수가 설정되지 않았습니다.");
        return;
      }

      if (typeof window !== "undefined" && window.Kakao) {
        if (!window.Kakao.isInitialized()) {
          try {
            window.Kakao.init(kakaoKey);
            setKakaoInitialized(true);
          } catch (error) {
            console.error("Kakao SDK 초기화 실패:", error);
          }
        } else {
          setKakaoInitialized(true);
        }
      } else {
        console.warn("Kakao SDK가 로드되지 않았습니다. 재시도 중...");
        // SDK 로드 대기
        setTimeout(initKakao, 500);
      }
    };

    initKakao();
  }, []);

  const handleCopy = () => {
    if (!finalShareUrl) return;
    navigator.clipboard.writeText(finalShareUrl);
    setToast({
      visible: true,
      message: "URL이 복사되었습니다!"
    });
  };

  const handleLinkedInShare = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(finalShareUrl)}`;
    window.open(linkedInUrl, '_blank', 'width=600,height=600');
    setToast({
      visible: true,
      message: "LinkedIn 공유 창을 열었습니다!"
    });
  };

  const handlePinterestShare = () => {
    const pinterestUrl = `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(finalShareUrl)}&media=${encodeURIComponent(finalThumb)}&description=${encodeURIComponent(finalTitle)}`;
    window.open(pinterestUrl, '_blank', 'width=750,height=550');
    setToast({
      visible: true,
      message: "Pinterest 공유 창을 열었습니다!"
    });
  };

  const handleXShare = () => {
    const tweetText = `${finalTitle} - Sandwich에서 확인하세요!`;
    const xUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(finalShareUrl)}&text=${encodeURIComponent(tweetText)}`;
    window.open(xUrl, '_blank', 'width=600,height=600');
    setToast({
      visible: true,
      message: "X(Twitter) 공유 창을 열었습니다!"
    });
  };

  const handleNaverBlogShare = () => {
    const naverBlogUrl = `https://blog.naver.com/openapi/share?url=${encodeURIComponent(finalShareUrl)}&title=${encodeURIComponent(finalTitle)}`;
    window.open(naverBlogUrl, '_blank', 'width=600,height=600');
    setToast({
      visible: true,
      message: "네이버 블로그 공유 창을 열었습니다!"
    });
  };

  const handleKakaoShare = () => {
    console.log("카카오 공유 시도:", {
      kakaoInitialized,
      hasKakao: !!window.Kakao,
      finalTitle,
      finalShareUrl,
      finalThumb
    });

    if (!kakaoInitialized || !window.Kakao) {
      console.warn("Kakao SDK가 초기화되지 않았습니다.");
      navigator.clipboard.writeText(finalShareUrl);
      setToast({
        visible: true,
        message: "Kakao SDK 로딩 중입니다. URL이 복사되었습니다!"
      });
      return;
    }

    try {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: finalTitle,
          description: 'Sandwich에서 확인하세요!',
          imageUrl: finalThumb,
          link: {
            mobileWebUrl: finalShareUrl,
            webUrl: finalShareUrl,
          },
        },
        buttons: [
          {
            title: '웹으로 보기',
            link: {
              mobileWebUrl: finalShareUrl,
              webUrl: finalShareUrl,
            },
          },
        ],
      });
      console.log("카카오 공유 API 호출 성공!");
      setToast({
        visible: true,
        message: "카카오톡 공유 창을 열었습니다!"
      });
    } catch (error) {
      console.error('Kakao 공유 실패:', error);
      // 대체: URL 복사
      navigator.clipboard.writeText(finalShareUrl);
      setToast({
        visible: true,
        message: "공유에 실패했습니다. URL이 복사되었습니다!"
      });
    }
  };

  return (
    <>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type="success"
        size="medium"
        autoClose={2000}
        closable={true}
        onClose={() => setToast((prev: { visible: boolean; message: string }) => ({ ...prev, visible: false }))}
      />
      <div className="relative font-gmarket">
      {/* 공유 버튼 (사이드바, 크기 그대로) */}
      <button
        className={`flex items-center group ${isMobile ? 'flex-col gap-0.5' : 'flex-col gap-1'}`}
        onClick={() => setOpen(true)}
      >
        <div className={`rounded-full bg-white shadow ring-1 ring-black/10 dark:ring-white/20 flex items-center justify-center ${isMobile ? 'w-10 h-10' : 'w-14 h-14 mb-1'}`}>
          <FaShareAlt className={isMobile ? 'w-5 h-5' : 'w-7 h-7'} />
        </div>
        <span className={`font-semibold text-center ${isMobile ? 'text-xs text-gray-800' : 'text-sm text-white'}`} style={isMobile ? {} : { textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>공유하기</span>
      </button>

      {/* 모달 */}
      {open && ReactDOM.createPortal(
        <>
          {/* 배경 */}
          <div
           className="fixed inset-0 z-[100000]"
           style={{ background: "rgba(0, 0, 0, 0.65)" }}
           onClick={() => setOpen(false)}
          />
          {/* 데스크탑 기준 중앙 고정 & 적정 너비 */}
          <div className="fixed z-[100001] inset-0 flex items-center justify-center p-3 sm:p-4">
            <div
              className="
                bg-white dark:bg-[var(--surface)] w-full sm:w-[520px] max-w-[95vw]
                rounded-xl sm:rounded-2xl shadow-2xl px-4 py-6 sm:px-6 sm:py-7 md:px-9 md:py-8
                relative flex flex-col
              "
              style={{ fontFamily: "GmarketSans, sans-serif" }}
            >
              {/* 닫기 버튼 */}
              <button
                onClick={() => setOpen(false)}
                className="absolute right-4 top-4 sm:right-6 sm:top-6 md:right-8 md:top-8 text-gray-400 hover:text-black dark:hover:text-white text-2xl sm:text-3xl"
                aria-label="닫기"
              >✕</button>

              {/* 제목 - 왼쪽 정렬 */}
              <div className="w-full font-bold text-lg sm:text-xl md:text-[22px] mb-4 sm:mb-5 md:mb-6 text-left pl-0 sm:pl-1 leading-tight dark:text-white">프로젝트 공유하기</div>
              {/* divider */}
              <div className="w-full h-px bg-gray-200 dark:bg-[var(--border-color)] mb-4 sm:mb-5 md:mb-7" />

              {/* 썸네일+제목/설명 왼쪽 정렬, 높이/글자 맞춤 */}
              <div className="flex items-center w-full mb-4 sm:mb-5 md:mb-7 pl-0 sm:pl-1">
                <img
                  src={finalThumb}
                  alt="썸네일"
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gray-100 dark:bg-[var(--surface)] object-cover flex-shrink-0"
                />
                <div className="ml-3 sm:ml-4 flex flex-col justify-center min-w-0 flex-1">
                  <div className="font-bold text-sm sm:text-[15px] text-black dark:text-white leading-snug whitespace-pre-line line-clamp-2">
                    {finalTitle}
                  </div>
                </div>
              </div>
              {/* divider */}
              <div className="w-full h-px bg-gray-200 dark:bg-[var(--border-color)] mb-4 sm:mb-5 md:mb-6" />

              {/* SNS 공유 아이콘 */}
              <div className="flex justify-center gap-3 sm:gap-4 md:gap-5 mb-5 sm:mb-6 md:mb-8 flex-wrap">
                <button
                  onClick={handleLinkedInShare}
                  className="flex flex-col items-center gap-1 sm:gap-2 group"
                  aria-label="LinkedIn에 공유"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#0A66C2] flex items-center justify-center transition-transform hover:scale-110">
                    <FaLinkedin className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-medium">LinkedIn</span>
                </button>

                <button
                  onClick={handlePinterestShare}
                  className="flex flex-col items-center gap-1 sm:gap-2 group"
                  aria-label="Pinterest에 공유"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#E60023] flex items-center justify-center transition-transform hover:scale-110">
                    <FaPinterest className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-medium">Pinterest</span>
                </button>

                <button
                  onClick={handleXShare}
                  className="flex flex-col items-center gap-1 sm:gap-2 group"
                  aria-label="X에 공유"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black flex items-center justify-center transition-transform hover:scale-110">
                    <FaXTwitter className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-medium">X</span>
                </button>

                <button
                  onClick={handleNaverBlogShare}
                  className="flex flex-col items-center gap-1 sm:gap-2 group"
                  aria-label="네이버 블로그에 공유"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#03C75A] flex items-center justify-center transition-transform hover:scale-110">
                    <SiNaver className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-medium">네이버</span>
                </button>

                <button
                  onClick={handleKakaoShare}
                  className="flex flex-col items-center gap-1 sm:gap-2 group"
                  aria-label="카카오톡에 공유"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#FEE500] flex items-center justify-center transition-transform hover:scale-110">
                    <RiKakaoTalkFill className="w-7 h-7 sm:w-8 sm:h-8 text-[#3C1E1E]" />
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-medium">카카오톡</span>
                </button>
              </div>

              <div className="flex w-full mt-1">
                <input
                  type="text"
                  className="flex-1 border border-gray-200 dark:border-[var(--border-color)] rounded-l-lg px-3 py-2 sm:px-4 sm:py-3 md:px-5 md:py-4 bg-gray-50 dark:bg-[var(--surface)] font-medium text-gray-900 dark:text-white min-w-0 text-xs overflow-x-auto"
                  value={finalShareUrl}
                  readOnly
                  style={{
                    fontFamily: "GmarketSans, sans-serif",
                    fontSize: "11px",
                    letterSpacing: "-0.01em"
                  }}
                  onFocus={e => e.target.select()}
                />
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 sm:px-5 sm:py-3 md:px-7 md:py-4 bg-gray-100 dark:bg-[var(--surface)] border-l border-gray-200 dark:border-[var(--border-color)] rounded-r-lg text-xs sm:text-sm md:text-base font-bold hover:bg-gray-200 dark:hover:bg-[#1a1a1a] whitespace-nowrap dark:text-white"
                  style={{
                    fontFamily: "GmarketSans, sans-serif"
                  }}
                >URL 복사</button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
    </>
  );
}
