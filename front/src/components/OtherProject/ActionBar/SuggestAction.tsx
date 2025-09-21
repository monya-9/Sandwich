import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { FaHandshake } from "react-icons/fa";
import { FaCommentDots, FaRegCommentDots } from "react-icons/fa6";
import { BiBriefcase } from "react-icons/bi";
import GeneralMessageAction from "./GeneralMessageAction";
import LoginPrompt from "../LoginPrompt";
import { useNavigate } from "react-router-dom";
import ProposalAction from "./ProposalAction";
import JobOfferAction from "./JobOfferAction";
import api from "../../../api/axiosInstance";

 type Props = {
  targetUserId?: number;
};

 type PublicProfile = {
  id: number;
  nickname: string | null;
  username?: string | null;
  email?: string | null;
  profileImage?: string | null;
};

export default function SuggestAction({ targetUserId }: Props = {}) {
  const [hover, setHover] = useState(false);
  const [tooltipHover, setTooltipHover] = useState(false); // 삼각형/팝업 위에 올려도 true
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [proposalOpen, setProposalOpen] = useState(false);
  const [jobOfferOpen, setJobOfferOpen] = useState(false);
  const [generalOpen, setGeneralOpen] = useState(false);

  const btnRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // 타겟 사용자 공개 프로필 가져오기(이메일/닉네임/프로필이미지)
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!targetUserId) return;
        const { data } = await api.get<PublicProfile>(`/users/${targetUserId}`);
        if (!alive) return;
        setProfile(data);
      } catch {}
    })();
    return () => { alive = false; };
  }, [targetUserId]);

  // 스타일 한 번만 추가
  useEffect(() => {
  const styleId = "suggest-style";
  let styleTag = document.getElementById(styleId);
  if (styleTag) styleTag.remove();
  styleTag = document.createElement("style");
  styleTag.id = styleId;
  styleTag.innerHTML = `
    .suggest-blur-bg {
      position: fixed; inset: 0;
      background: rgba(0, 0, 0, 0.65);  
      z-index: 9000;
       backdrop-filter: blur(0px);
      pointer-events: auto;
    }
  `;
  document.head.appendChild(styleTag);
}, []);


  // 모달 외부 클릭 → 모달 닫힘
  useEffect(() => {
    if (!isModalOpen || proposalOpen || jobOfferOpen || generalOpen) return;
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setIsModalOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isModalOpen, proposalOpen, jobOfferOpen, generalOpen]);

  // ESC 닫기
  useEffect(() => {
    if (!isModalOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isModalOpen]);

  // 모달 열릴 때 스크롤 차단
  useEffect(() => {
    if (!isModalOpen || proposalOpen || jobOfferOpen || generalOpen) return;
    const preventScroll = (e: Event) => e.preventDefault();
    const preventKeys = (e: KeyboardEvent) => {
      const keys = [
        "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ", "Spacebar"
      ];
      if (keys.includes(e.key)) e.preventDefault();
    };
    window.addEventListener("wheel", preventScroll, { passive: false });
    window.addEventListener("touchmove", preventScroll, { passive: false });
    window.addEventListener("keydown", preventKeys, { passive: false });
    return () => {
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("touchmove", preventScroll);
      window.removeEventListener("keydown", preventKeys);
    };
  }, [isModalOpen, proposalOpen, jobOfferOpen, generalOpen]);

  // 외부에서 "suggest:open" 이벤트로 모달 열기 지원
  useEffect(() => {
    const onOpen = () => {
      if (!ensureLogin()) return;
      setHover(false);
      setTooltipHover(false);
      setIsModalOpen(true);
    };
    window.addEventListener("suggest:open", onOpen as EventListener);
    return () => window.removeEventListener("suggest:open", onOpen as EventListener);
  }, []);

  // *** 툴팁 유지 ***
  const tooltipVisible = hover || tooltipHover;

  const ensureLogin = () => {
    const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
    if (!token) {
      setShowLoginPrompt(true);
      return false;
    }
    return true;
  };

  const targetInitial = ((profile?.email || "").trim()[0] || (profile?.nickname || " ")[0] || "N").toUpperCase();
  const targetName = (profile?.nickname || profile?.username || "사용자").trim();

  return (
    <div className="relative">
      {/* 로그인 프롬프트 */}
      {showLoginPrompt && (
        <LoginPrompt
          onLoginClick={() => { setShowLoginPrompt(false); navigate("/login"); }}
          onSignupClick={() => { setShowLoginPrompt(false); navigate("/join"); }}
          onClose={() => setShowLoginPrompt(false)}
        />
      )}

      {/* 액션 버튼 */}
      <button
        ref={btnRef}
        className="flex flex-col items-center gap-1 group"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => {
          if (!ensureLogin()) return;
          setIsModalOpen(true);
        }}
      >
        <div className="w-14 h-14 rounded-full bg-white shadow flex items-center justify-center mb-1">
          <FaCommentDots className="w-6 h-6" />
        </div>
        <span className="text-xs text-white font-semibold text-center">제안하기</span>
      </button>

      {/* 툴팁 */}
      {tooltipVisible && !isModalOpen && (
        <>
          <div
            ref={popupRef}
            className="absolute right-[calc(100%+14px)] top-1/2 -translate-y-1/2 rounded-[4px] bg-white shadow-lg border border-gray-200 flex flex-col items-stretch z-50 py-6 px-7 gap-4 w-max min-w-[350px]"
            onMouseEnter={() => setTooltipHover(true)}
            onMouseLeave={() => setTooltipHover(false)}
            onMouseDown={e => e.stopPropagation()}
          >
            <div className="absolute -right-2 top-5 w-4 h-4 bg-white rotate-45 rounded-[2px]" />
            <div className="grid grid-cols-[24px_1fr_auto] items-center w-full gap-x-3">
              <FaHandshake className="text-[20px]" />
              <span className="font-gmarket font-normal text-[16px] text-black leading-tight">프로젝트 의뢰 및 프리랜서</span>
              <span className="w-6 h-6 flex items-center justify-center rounded-full justify-self-end" style={{ backgroundColor: "#10b981" }}>
                <svg width="14" height="14" viewBox="0 0 12 12"><polyline points="3,6.5 5,8.5 9,3.5" fill="none" stroke="#fff" strokeWidth="2.4" /></svg>
              </span>
            </div>
            <div className="grid grid-cols-[24px_1fr_auto] items-center w-full gap-x-3">
              <BiBriefcase className="text-[20px]" />
              <span className="font-gmarket font-normal text-[16px] text-black leading-tight">구직</span>
              <span className="w-6 h-6 flex items-center justify-center rounded-full justify-self-end" style={{ backgroundColor: "#10b981" }}>
                <svg width="14" height="14" viewBox="0 0 12 12"><polyline points="3,6.5 5,8.5 9,3.5" fill="none" stroke="#fff" strokeWidth="2.4" /></svg>
              </span>
            </div>
          </div>
        </>
      )}

      {/* 메뉴 모달 */}
      {isModalOpen && !proposalOpen && !jobOfferOpen && !generalOpen && ReactDOM.createPortal(
        <>
          <div className="suggest-blur-bg" />
          <div ref={modalRef} className="fixed left-1/2 top-1/2 z-[10001] w-[480px] max-w-[92vw] h-[480px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center overflow-hidden bg-white rounded-[12px] shadow-2xl px-0 py-6" tabIndex={-1} role="dialog">
            <button className="absolute right-2 top-0.5 text-[50px] font-light text-gray-500 hover:text-black p-1.5 leading-none" onClick={() => setIsModalOpen(false)} aria-label="닫기">×</button>
            <div className="mt-8 mb-6">
              <div className="mx-auto w-[72px] h-[72px] rounded-full bg-gray-200 ring-1 ring-gray-300 overflow-hidden flex items-center justify-center">
                {profile?.profileImage ? (<img src={profile.profileImage} alt="avatar" className="w-full h-full object-cover" />) : (<span className="text-[22px] leading-none text-gray-700 bg-transparent">{targetInitial}</span>)}
              </div>
            </div>
            <div className="text-[20px] font-bold mb-1">{targetName}</div>
            <div className="min-h-[18px] max-h-[18px] text-[13px] text-gray-500 px-6 text-center mb-6"><span className="inline-block max-w-[420px] whitespace-nowrap overflow-hidden text-ellipsis align-top" title=""></span></div>

            <div className="w-full px-6 pt-3 pb-10">
              <div className="flex flex-col gap-3">
                <button className="flex items-center w-full shrink-0 h-[64px] border border-gray-200 rounded-[10px] px-6 bg-white hover:bg-gray-50" style={{ justifyContent: "space-between" }} onClick={() => setProposalOpen(true)}>
                  <span className="flex items-center gap-4"><span className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center">✓</span><span className="text-[16px]">프로젝트 의뢰 및 프리랜서 제안하기</span></span>
                  <span className="text-gray-400 text-[16px]">→</span>
                </button>

                <button className="flex items-center w-full shrink-0 h-[64px] border border-gray-200 rounded-[10px] px-6 bg-white hover:bg-gray-50" style={{ justifyContent: "space-between" }} onClick={() => setJobOfferOpen(true)}>
                  <span className="flex items-center gap-4"><span className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center"><BiBriefcase className="text-[14px]" /></span><span className="text-[16px]">채용 제안하기</span></span>
                  <span className="text-gray-400 text-[16px]">→</span>
                </button>

                <button className="flex items-center w-full shrink-0 h-[64px] border border-gray-200 rounded-[10px] px-6 bg-white hover:bg-gray-50" style={{ justifyContent: "space-between" }} onClick={() => setGeneralOpen(true)}>
                  <span className="flex items-center gap-4"><span className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center"><FaRegCommentDots className="text-[14px]" /></span><span className="text-[16px]">일반 메시지</span></span>
                  <span className="text-gray-400 text-[16px]">→</span>
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* 제어형 Proposal 모달 */}
      <ProposalAction open={proposalOpen} onClose={() => { setProposalOpen(false); setIsModalOpen(false); }} onBackToMenu={() => { setProposalOpen(false); setIsModalOpen(true); }} targetUserId={targetUserId} />

      {/* 제어형 JobOffer 모달 */}
      <JobOfferAction open={jobOfferOpen} onClose={() => { setJobOfferOpen(false); setIsModalOpen(false); }} onBackToMenu={() => { setJobOfferOpen(false); setIsModalOpen(true); }} targetUserId={targetUserId} />

      {/* 제어형 GeneralMessage 모달 */}
      <GeneralMessageAction open={generalOpen} onClose={() => { setGeneralOpen(false); setIsModalOpen(false); }} onBackToMenu={() => { setGeneralOpen(false); setIsModalOpen(true); }} targetUserId={targetUserId} />
    </div>
  );
}
