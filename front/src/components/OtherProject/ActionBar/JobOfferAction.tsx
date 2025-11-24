import React from "react";
import ReactDOM from "react-dom";
import { sendJobOffer } from "../../../api/message.presets";
import Toast from "../../common/Toast";
import api from "../../../api/axiosInstance";

type Props = {
  open: boolean;
  onClose: () => void;
  onBackToMenu?: () => void;
  targetUserId?: number;
  initialProfile?: { id: number; nickname?: string | null; username?: string | null; email?: string | null; profileImage?: string | null } | null;
};

/** 채용 제안하기: ProposalAction 스타일을 그대로 따르는 제어형 모달 */
export default function JobOfferAction({ open, onClose, onBackToMenu, targetUserId, initialProfile }: Props) {
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

  // 토스트 상태
  const [errorToast, setErrorToast] = React.useState<{ visible: boolean; message: string }>({ visible: false, message: "" });
  const [successToast, setSuccessToast] = React.useState<{ visible: boolean; message: string }>({ visible: false, message: "" });

  // 폼 상태
  const [company, setCompany] = React.useState("");
  const [minSalary, setMinSalary] = React.useState("");
  const [maxSalary, setMaxSalary] = React.useState("");
  const [salaryNegotiable, setSalaryNegotiable] = React.useState(false);
  const [location, setLocation] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // 열릴 때마다 초기화
  const resetAll = () => {
    setCompany("");
    setMinSalary("");
    setMaxSalary("");
    setSalaryNegotiable(false);
    setLocation("");
    setDescription("");
    setFile(null);
    setCompanyTouched(false);
    setMinTouched(false);
    setMaxTouched(false);
    setLocationTouched(false);
    setDescTouched(false);
  };
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

  // 현재 모달 크기 고정
  const modalBoxRef = React.useRef<HTMLDivElement>(null);
  const [fixedModalSize, setFixedModalSize] = React.useState<{ w: number; h: number } | null>(null);
  React.useEffect(() => {
    if (!open || fixedModalSize) return; // 최초 1회만 측정
    requestAnimationFrame(() => {
      const el = modalBoxRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        setFixedModalSize({ w: Math.round(rect.width), h: Math.round(rect.height) });
      }
    });
  }, [open, fixedModalSize]);

  const onlyDigits = (v: string) => v.replace(/\D+/g, "");
  const onChangeMin = (v: string) => setMinSalary(onlyDigits(v));
  const onChangeMax = (v: string) => setMaxSalary(onlyDigits(v));

  // touched 상태
  const [companyTouched, setCompanyTouched] = React.useState(false);
  const [minTouched, setMinTouched] = React.useState(false);
  const [maxTouched, setMaxTouched] = React.useState(false);
  const [locationTouched, setLocationTouched] = React.useState(false);
  const [descTouched, setDescTouched] = React.useState(false);

  // 파일 변경 핸들러 (복구)
  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    if (!f) { setFile(null); return; }
    const max = 10 * 1024 * 1024;
    if (f.size > max) { setErrorToast({ visible: true, message: "파일은 10MB 이하여야 합니다." }); e.currentTarget.value = ""; return; }
    setFile(f);
  };

  // 연봉 협의 시 입력값 숨김을 위한 이전 값 보관/복원
  const prevMinRef = React.useRef<string>("");
  const prevMaxRef = React.useRef<string>("");
  React.useEffect(() => {
    if (salaryNegotiable) {
      prevMinRef.current = minSalary;
      prevMaxRef.current = maxSalary;
      setMinSalary("");
      setMaxSalary("");
    } else {
      if (prevMinRef.current || prevMaxRef.current) {
        setMinSalary(prevMinRef.current);
        setMaxSalary(prevMaxRef.current);
        prevMinRef.current = "";
        prevMaxRef.current = "";
      }
    }
  }, [salaryNegotiable]);

  // 에러 메시지 계산
  const companyError = (company || "").trim().length === 0 ? "필수 항목입니다" : "";
  const minTrim = (minSalary || "").trim();
  const maxTrim = (maxSalary || "").trim();
  const minIsDigits = minTrim.length > 0 && /^\d+$/.test(minTrim);
  const maxIsDigits = maxTrim.length > 0 && /^\d+$/.test(maxTrim);
  const minVal = Number(minTrim || 0);
  const maxVal = Number(maxTrim || 0);
  const salaryTouched = minTouched || maxTouched;
  let minErrText = ""; let maxErrText = "";
  if (!salaryNegotiable) {
    if (minTrim.length === 0) minErrText = "필수 항목입니다";
    else if (!/^\d+$/.test(minTrim)) minErrText = "숫자만 입력 가능합니다.";
    if (maxTrim.length === 0) maxErrText = "필수 항목입니다";
    else if (!/^\d+$/.test(maxTrim)) maxErrText = "숫자만 입력 가능합니다.";
    if (minIsDigits && maxIsDigits && minVal > maxVal) {
      minErrText = "최소 연봉이 최대 연봉보다 클 수 없습니다.";
      maxErrText = "최대 연봉은 최소 연봉 이상이어야 합니다.";
    }
  }
  const minInvalid = !salaryNegotiable && minErrText !== "";
  const maxInvalid = !salaryNegotiable && maxErrText !== "";
  const locationError = (location || "").trim().length === 0 ? "필수 항목입니다" : "";
  const descError = (description || "").trim().length === 0 ? "필수 항목입니다" : "";

  // 제출 가능 여부
  const canSubmit = (
    !companyError && !locationError && !descError && (salaryNegotiable || (!minInvalid && !maxInvalid))
  );

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      setCompanyTouched(true);
      setMinTouched(true);
      setMaxTouched(true);
      setLocationTouched(true);
      setDescTouched(true);
      return;
    }
    if (!targetUserId) {
      setErrorToast({ visible: true, message: "대상 사용자 정보를 찾을 수 없습니다." });
      return;
    }
    const salaryStr = salaryNegotiable ? "협의" : `${minTrim || "0"}-${maxTrim || "0"} 만원`;
    try {
      await sendJobOffer(targetUserId, {
        companyName: company.trim(),
        salary: salaryStr,
        location: location.trim(),
        description: description.trim(),
      });
      setSuccessToast({ visible: true, message: "메시지를 전송했어요." });
      onClose();
    } catch (err: any) {
      setErrorToast({ visible: true, message: err?.response?.data?.message || "전송에 실패했어요." });
    }
  };

  const Modal = open
    ? ReactDOM.createPortal(
        <>
          {/* 투명 캡처 오버레이: 부모의 어두운 배경 유지 */}
          <div
            className="fixed inset-0 z-[100000]"
            onClick={onClose}
            onWheel={(e) => e.preventDefault()}
            onTouchMove={(e) => e.preventDefault()}
            style={{ background: "rgba(0, 0, 0, 0.65)", touchAction: "none" }}
          />

          {/* 모달 박스 */}
          <div
            ref={modalBoxRef}
            className="fixed left-1/2 top-1/2 z-[100001] w-full sm:w-[480px] max-w-[95vw] max-h-[90vh] sm:max-h-[88vh] -translate-x-1/2 -translate-y-1/2 flex flex-col items-stretch overflow-hidden bg-white dark:bg-[var(--surface)] rounded-[12px] shadow-2xl"
            style={fixedModalSize ? { width: fixedModalSize.w, height: fixedModalSize.h } : undefined}
          >
            {/* 헤더 */}
            <div className="relative px-2 pt-2 pb-2">
              <button
                className="absolute left-1 sm:left-2 top-0.5 text-[40px] sm:text-[50px] font-light text-gray-500 hover:text-black dark:text-white/70 dark:hover:text-white p-1 sm:p-1.5 leading-none"
                onClick={() => { onClose(); onBackToMenu?.(); }}
                aria-label="뒤로가기"
              >
                ‹
              </button>
              <div className="h-10 sm:h-12 flex items-center justify-center gap-2 pointer-events-none text-gray-800 dark:text-white">
                {profile?.profileImage ? (
                  <img src={profile.profileImage} alt="avatar" className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-200 dark:bg-[var(--avatar-bg)] text-black dark:text-white flex items-center justify-center text-[10px] sm:text-[12px]">{targetInitial}</div>
                )}
                <div className="text-[12px] sm:text-[14px] font-medium">{targetName}</div>
              </div>
              <button
                className="absolute right-1 sm:right-2 top-0.5 text-[40px] sm:text-[50px] font-light text-gray-500 hover:text-black dark:text-white/70 dark:hover:text-white p-1 sm:p-1.5 leading-none"
                onClick={onClose}
                aria-label="닫기"
              >
                ×
              </button>
              <div className="mt-2 border-t border-gray-200 dark:border-[var(--border-color)]" />
            </div>

            {/* 내용 영역 */}
            <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 overflow-y-auto flex-1 min-h-0" style={{ overscrollBehavior: "contain", scrollbarGutter: "stable both-edges" }}>
              <div className="w-full sm:w-[400px] max-w-full mx-auto">
                <div className="text-center mb-2 sm:mb-3">
                  <div className="text-base sm:text-[18px] font-bold text-gray-800 dark:text-white">채용 제안하기</div>
                  <div className="text-[10px] sm:text-[12px] text-gray-500 dark:text-gray-400 mt-1">내용을 자세히 입력할수록 회신 가능성이 높아집니다.</div>
                </div>

                <form className="flex flex-col gap-3" onSubmit={submitForm}>
                  <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">회사 이름<span className="text-green-500">*</span></label>
                    <input value={company} onChange={(e) => { setCompany(e.target.value); setCompanyTouched(true); }} onBlur={() => setCompanyTouched(true)} placeholder="회사 이름을 입력해주세요." className={`w-full h-9 border rounded px-3 text-[14px] outline-none bg-white dark:bg-[var(--input-bg)] text-gray-900 dark:text-white dark:placeholder-gray-500 ${(companyTouched && companyError) ? "border-rose-500" : "border-gray-300 dark:border-[var(--border-color)]"}`} />
                    {(companyTouched && companyError) && (<div className="text-[12px] text-rose-500">{companyError}</div>)}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">연봉<span className="text-green-500">*</span></label>
                    <div className="flex items-start gap-2 flex-nowrap">
                      <div className="flex-1 min-w-0">
                        <input
                          value={minSalary}
                          onChange={(e) => { onChangeMin(e.target.value); setMinTouched(true); }}
                          onBlur={() => setMinTouched(true)}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="최소 연봉 입력"
                          disabled={salaryNegotiable}
                          className={`w-full h-9 border rounded px-3 text-[14px] outline-none ${salaryNegotiable ? "bg-[#f5f5f5] dark:bg-[#2a2a2a] text-transparent placeholder-transparent caret-transparent cursor-not-allowed border-[#e5e5e5] dark:border-[#3a3a3a]" : `bg-white dark:bg-[var(--input-bg)] text-gray-900 dark:text-white dark:placeholder-gray-500 ${(minTouched && minInvalid) ? "border-rose-500" : "border-gray-300 dark:border-[var(--border-color)]"}`}`}
                          style={salaryNegotiable ? { WebkitTextFillColor: "transparent" } as React.CSSProperties : undefined}
                        />
                        {(minTouched && minInvalid) && (<div className="text-[12px] text-rose-500 mt-1">{minErrText}</div>)}
                      </div>
                      <span className="text-[14px] text-gray-600 dark:text-gray-400 shrink-0 whitespace-nowrap self-center">만원</span>
                      <span className="text-gray-400 dark:text-gray-500 shrink-0 self-center">-</span>
                      <div className="flex-1 min-w-0">
                        <input
                          value={maxSalary}
                          onChange={(e) => { onChangeMax(e.target.value); setMaxTouched(true); }}
                          onBlur={() => setMaxTouched(true)}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="최대 연봉 입력"
                          disabled={salaryNegotiable}
                          className={`w-full h-9 border rounded px-3 text-[14px] outline-none ${salaryNegotiable ? "bg-[#f5f5f5] dark:bg-[#2a2a2a] text-transparent placeholder-transparent caret-transparent cursor-not-allowed border-[#e5e5e5] dark:border-[#3a3a3a]" : `bg-white dark:bg-[var(--input-bg)] text-gray-900 dark:text-white dark:placeholder-gray-500 ${(maxTouched && maxInvalid) ? "border-rose-500" : "border-gray-300 dark:border-[var(--border-color)]"}`}`}
                          style={salaryNegotiable ? { WebkitTextFillColor: "transparent" } as React.CSSProperties : undefined}
                        />
                        {(maxTouched && maxInvalid) && (<div className="text-[12px] text-rose-500 mt-1">{maxErrText}</div>)}
                      </div>
                      <span className="text-[14px] text-gray-600 dark:text-gray-400 shrink-0 whitespace-nowrap self-center">만원</span>
                    </div>
                    <label className="flex items-center gap-2 text-[12px] text-gray-600 dark:text-gray-400 select-none">
                      <input type="checkbox" checked={salaryNegotiable} onChange={(e) => setSalaryNegotiable(e.target.checked)} className="w-4 h-4 accent-[#068334]" />
                      연봉 협의 가능
                    </label>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">근무 위치<span className="text-green-500">*</span></label>
                    <input value={location} onChange={(e) => { setLocation(e.target.value); setLocationTouched(true); }} onBlur={() => setLocationTouched(true)} placeholder="근무 위치를 입력해주세요." className={`w-full h-9 border rounded px-3 text-[14px] outline-none bg-white dark:bg-[var(--input-bg)] text-gray-900 dark:text-white dark:placeholder-gray-500 ${(locationTouched && locationError) ? "border-rose-500" : "border-gray-300 dark:border-[var(--border-color)]"}`} />
                    {(locationTouched && locationError) && (<div className="text-[12px] text-rose-500">{locationError}</div>)}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">내용 (최대 80자)<span className="text-green-500">*</span></label>
                    <textarea 
                      value={description} 
                      onChange={(e) => {
                        const newValue = e.target.value;
                        if (newValue.length <= 80) {
                          setDescription(newValue);
                          setDescTouched(true);
                        }
                      }} 
                      onBlur={() => setDescTouched(true)} 
                      placeholder="간단한 회사 소개 및 업무 내용을 입력해주세요." 
                      maxLength={80}
                      className={`w-full h-32 border rounded px-3 py-2 text-[14px] resize-none outline-none bg-white dark:bg-[var(--input-bg)] text-gray-900 dark:text-white dark:placeholder-gray-500 ${(descTouched && descError) ? "border-rose-500" : "border-gray-300 dark:border-[var(--border-color)]"}`} 
                    />
                    <div className="flex justify-end">
                      <span className={`text-xs ${description.length >= 80 ? 'text-red-500' : 'text-gray-400'}`}>
                        {description.length}/80
                      </span>
                    </div>
                    {(descTouched && descError) && (<div className="text-[12px] text-rose-500">{descError}</div>)}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">첨부파일</label>
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex-1 h-10 border border-gray-300 dark:border-[var(--border-color)] rounded px-3 text-[14px] flex items-center cursor-pointer select-none bg-white dark:bg-[var(--input-bg)] ${file ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}
                        onClick={() => fileInputRef.current?.click()}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current?.click(); } }}
                        role="button"
                        tabIndex={0}
                        aria-label="파일 업로드"
                      >
                        {file ? file.name : "업로드(10MB 이내 파일 선택)"}
                      </div>
                      <button type="button" onClick={() => setFile(null)} className="w-10 h-10 rounded border border-gray-300 dark:border-[var(--border-color)] text-gray-700 dark:text-gray-300 flex items-center justify-center" aria-label="첨부 제거">🗑</button>
                      <input ref={fileInputRef} type="file" onChange={onFileChange} className="hidden" />
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* 하단 고정 버튼 바 */}
            <div className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 border-t border-gray-200 dark:border-[var(--border-color)] bg-white dark:bg-[var(--surface)] flex items-center justify-end gap-2 sm:gap-3">
              <button type="button" onClick={onClose} className="px-3 sm:px-4 h-9 sm:h-10 rounded border border-gray-300 dark:border-[var(--border-color)] text-gray-700 dark:text-gray-300 text-sm sm:text-base">취소</button>
              <button disabled={!canSubmit || !targetUserId} onClick={submitForm as any} className={`px-4 sm:px-5 h-9 sm:h-10 rounded text-white text-sm sm:text-base ${canSubmit && targetUserId ? "bg-[#068334] hover:opacity-90" : "bg-gray-300 cursor-not-allowed"}`}>메시지 전송</button>
            </div>
          </div>
        </>,
        document.body
      )
    : null;

  return <>
    {Modal}
    {/* 토스트: 포털 바깥에서 렌더링하여 모달 닫혀도 유지 */}
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