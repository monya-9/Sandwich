import React from "react";
import ReactDOM from "react-dom";
import { postMessage } from "../../../api/messages";
import Toast from "../../common/Toast";
import api from "../../../api/axiosInstance";

type Props = {
  open: boolean;
  onClose: () => void;
  onBackToMenu?: () => void;
  targetUserId?: number;
  initialProfile?: { id: number; nickname?: string | null; username?: string | null; email?: string | null; profileImage?: string | null } | null;
};

/** 일반 메시지: Proposal/JobOffer 스타일 공통 프레임을 사용하는 모달 */
export default function GeneralMessageAction({ open, onClose, onBackToMenu, targetUserId, initialProfile }: Props) {
  type PublicProfile = { id: number; nickname?: string | null; username?: string | null; email?: string | null; profileImage?: string | null };
  const [profile, setProfile] = React.useState<PublicProfile | null>(initialProfile ?? null);
  React.useEffect(() => {
    let alive = true;
    if (!open || !targetUserId) { setProfile(initialProfile ?? null); return; }
    setProfile((prev) => prev || (initialProfile ?? null));
    (async () => {
      try { const { data } = await api.get<PublicProfile>(`/users/${targetUserId}`); if (alive) setProfile(data); }
      catch { if (alive) setProfile(null); }
    })();
    return () => { alive = false; };
  }, [open, targetUserId, initialProfile]);

  const targetInitial = ((profile?.email || profile?.nickname || profile?.username || "?") as string).trim().charAt(0).toUpperCase() || "U";
  const targetName = (profile?.nickname || profile?.username || "사용자") as string;

  const [message, setMessage] = React.useState("");
  const [errorToast, setErrorToast] = React.useState<{ visible: boolean; message: string }>({ visible: false, message: "" });
  const [successToast, setSuccessToast] = React.useState<{ visible: boolean; message: string }>({ visible: false, message: "" });

  const resetAll = () => setMessage("");
  React.useEffect(() => { if (open) resetAll(); }, [open]);

  // 배경 스크롤 차단(스크롤바는 보이게 유지), 내부 스크롤 허용
  React.useEffect(() => {
    if (!open) return;
    const modalEl = modalBoxRef.current;

    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflowY = html.style.overflowY;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyPosition = body.style.position;
    const prevBodyTop = body.style.top;
    const prevBodyWidth = body.style.width;
    const lockY = window.scrollY;

    html.style.overflowY = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${lockY}px`;
    body.style.width = "100%";

    const isInside = (node: Node | null) => !!(modalEl && node && modalEl.contains(node));
    const onWheel = (e: WheelEvent) => { if (!isInside(e.target as Node)) e.preventDefault(); };
    const onTouchMove = (e: TouchEvent) => { if (!isInside(e.target as Node)) e.preventDefault(); };
    const onKeyDown = (e: KeyboardEvent) => {
      const keys = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ", "Spacebar"];
      if (keys.includes(e.key) && !isInside(document.activeElement)) e.preventDefault();
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("wheel", onWheel as any);
      window.removeEventListener("touchmove", onTouchMove as any);
      window.removeEventListener("keydown", onKeyDown);
      html.style.overflowY = prevHtmlOverflowY;
      body.style.overflow = prevBodyOverflow;
      body.style.position = prevBodyPosition;
      body.style.top = prevBodyTop;
      body.style.width = prevBodyWidth;
      const y = parseInt(prevBodyTop || "0", 10);
      window.scrollTo(0, y ? -y : lockY);
    };
  }, [open]);

  const modalBoxRef = React.useRef<HTMLDivElement>(null);
  const [fixedModalSize, setFixedModalSize] = React.useState<{ w: number; h: number } | null>(null);
  React.useEffect(() => {
    if (!open) { setFixedModalSize(null); return; }
    requestAnimationFrame(() => {
      const el = modalBoxRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        setFixedModalSize({ w: Math.round(rect.width), h: Math.round(rect.height) });
      }
    });
  }, [open]);

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((message || "").trim().length < 1) {
      setErrorToast({ visible: true, message: "메시지를 입력해 주세요." });
      return;
    }
    if (!targetUserId) {
      setErrorToast({ visible: true, message: "대상 사용자 정보를 찾을 수 없습니다." });
      return;
    }
    try {
      await postMessage({ targetUserId, type: "GENERAL", content: message.trim(), payload: null });
      setSuccessToast({ visible: true, message: "메시지를 전송했어요." });
      onClose();
    } catch (err: any) {
      setErrorToast({ visible: true, message: err?.response?.data?.message || "전송에 실패했어요." });
    }
  };

  const canSubmit = (message || "").trim().length > 0 && !!targetUserId;

  const Modal = open
    ? ReactDOM.createPortal(
        <>
          {/* 투명 캡처 오버레이: 부모의 어두운 배경 유지 */}
          <div
            className="fixed inset-0 z-[10009]"
            onClick={onClose}
            onWheel={(e) => e.preventDefault()}
            onTouchMove={(e) => e.preventDefault()}
            style={{ background: "rgba(0, 0, 0, 0.65)", touchAction: "none" }}
          />

          {/* 모달 박스 */}
          <div
            ref={modalBoxRef}
            className="fixed left-1/2 top-1/2 z-[10010] w-[480px] max-w-[92vw] max-h-[92vh] -translate-x-1/2 -translate-y-1/2 flex flex-col items-stretch overflow-hidden bg-white dark:bg-[var(--surface)] rounded-[12px] shadow-2xl"
            style={{ height: 500 }}
          >
            {/* 헤더 */}
            <div className="relative px-2 pt-2 pb-2">
              <button
                className="absolute left-2 top-0.5 text-[50px] font-light text-gray-500 hover:text-black p-1.5 leading-none"
                onClick={() => { onClose(); onBackToMenu?.(); }}
                aria-label="뒤로가기"
              >
                ‹
              </button>
              <div className="h-12 flex items-center justify-center gap-2 pointer-events-none text-gray-800 dark:text-white">
                {profile?.profileImage ? (
                  <img src={profile.profileImage} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-[var(--avatar-bg)] text-black dark:text-white flex items-center justify-center text-[12px]">{targetInitial}</div>
                )}
                <div className="text-[14px] font-medium">{targetName}</div>
              </div>
              <button
                className="absolute right-2 top-0.5 text-[50px] font-light text-gray-500 hover:text-black p-1.5 leading-none"
                onClick={onClose}
                aria-label="닫기"
              >
                ×
              </button>
              <div className="mt-2 border-t border-gray-200" />
            </div>

            {/* 내용 영역 */}
            <div className="px-6 py-4 flex-1 overflow-visible" style={{ overscrollBehavior: "auto" }}>
              <div className="w-[400px] max-w-full mx-auto">
                <div className="text-center mb-3">
                  <div className="text-[18px] font-bold">일반 메시지</div>
                  <div className="text-[12px] text-gray-500 mt-1">내용을 자세히 입력할수록 회신 가능성이 높아집니다.</div>
                </div>

                <form className="flex flex-col gap-3" onSubmit={submitForm}>
                  <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-semibold text-gray-700">메시지 (최대 500자)</label>
                    <textarea 
                      value={message} 
                      onChange={(e) => {
                        const newValue = e.target.value;
                        if (newValue.length <= 500) {
                          setMessage(newValue);
                        }
                      }} 
                      placeholder="메시지를 입력해주세요." 
                      maxLength={500}
                      className="w-full h-[220px] border border-gray-300 rounded px-3 py-2 text-[14px] resize-none outline-none" 
                    />
                    <div className="flex justify-end">
                      <span className={`text-xs ${message.length > 450 ? 'text-red-500' : message.length > 300 ? 'text-orange-500' : 'text-gray-400'}`}>
                        {message.length}/500
                      </span>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* 하단 고정 버튼 바 */}
            <div className="px-6 py-3 border-t border-gray-200 dark:border-[var(--border-color)] bg-white dark:bg-[var(--surface)] flex items-center justify-end gap-3">
              <button type="button" onClick={onClose} className="px-4 h-10 rounded border border-gray-300 text-gray-700">취소</button>
              <button disabled={!canSubmit} onClick={submitForm as any} className={`px-5 h-10 rounded text-white ${canSubmit ? "bg-[#068334] hover:opacity-90" : "bg-gray-300 cursor-not-allowed"}`}>메시지 전송</button>
            </div>
          </div>
        </>,
        document.body
      )
    : null;

  return <>
    {Modal}
    <Toast
      visible={errorToast.visible}
      message={errorToast.message}
      type="error"
      size="medium"
      autoClose={3000}
      closable={true}
      onClose={() => setErrorToast({ visible: false, message: "" })}
    />
    <Toast
      visible={successToast.visible}
      message={successToast.message}
      type="success"
      size="medium"
      autoClose={2000}
      closable={true}
      onClose={() => setSuccessToast({ visible: false, message: "" })}
    />
  </>;
} 