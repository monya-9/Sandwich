import React from "react";
import ReactDOM from "react-dom";
import { sendProjectProposal } from "../../../api/message.presets";

type Props = {
  open: boolean;
  onClose: () => void;
  onBackToMenu?: () => void;
  targetUserId?: number;
};

/** 프로젝트 의뢰 및 프리랜서 제안: 제어형 모달 컴포넌트 */
export default function ProposalAction({ open, onClose, onBackToMenu, targetUserId }: Props) {
  const safeGet = (k: string) => { try { return localStorage.getItem(k) || sessionStorage.getItem(k) || ""; } catch { return ""; } };
  const storedEmail = safeGet("userEmail");
  const displayName = (safeGet("userNickname").trim()) || (safeGet("userUsername").trim()) || "사용자";
  const avatarInitial = ((storedEmail || displayName || "?").trim()[0] || "U").toUpperCase();

  // 폼 상태
  const [title, setTitle] = React.useState("");
  const [contact, setContact] = React.useState("");
  const [budget, setBudget] = React.useState("");
  const [negotiable, setNegotiable] = React.useState(false);
  const [description, setDescription] = React.useState("");
  const [refUrls, setRefUrls] = React.useState<string[]>([]); // 처음엔 목록 없음 (composer만 보임)
  const [file, setFile] = React.useState<File | null>(null);
  // URL 작성 입력(추가용)
  const [composerUrl, setComposerUrl] = React.useState("");
  const urlsScrollRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // 사용자 상호작용 여부 (touched)
  const [titleTouched, setTitleTouched] = React.useState(false);
  const [contactTouched, setContactTouched] = React.useState(false);
  const [budgetTouched, setBudgetTouched] = React.useState(false);
  const [descTouched, setDescTouched] = React.useState(false);

  // 열릴 때마다 값 초기화
  const resetAll = () => {
    setTitle("");
    setContact("");
    setBudget("");
    setNegotiable(false);
    setDescription("");
    setRefUrls([]);
    setComposerUrl("");
    setFile(null);
    setTitleTouched(false);
    setContactTouched(false);
    setBudgetTouched(false);
    setDescTouched(false);
  };
  React.useEffect(() => {
    if (open) resetAll();
  }, [open]);

  // 배경 스크롤은 차단하되 모달 내부 스크롤은 허용(스크롤바는 보이도록 유지)
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

    html.style.overflowY = "scroll"; // 스크롤바 표시 유지
    body.style.overflow = "hidden";  // 배경 스크롤 동작 차단
    // 물리적 스크롤까지 완전히 차단 (모바일 포함)
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

  // 현재 모달 크기를 고정시키기 위한 ref/state
  const modalBoxRef = React.useRef<HTMLDivElement>(null);
  const [fixedModalSize, setFixedModalSize] = React.useState<{ w: number; h: number } | null>(null);
  React.useEffect(() => {
    if (!open || fixedModalSize) return; // 최초 1회만
    requestAnimationFrame(() => {
      const el = modalBoxRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        setFixedModalSize({ w: Math.round(rect.width), h: Math.round(rect.height) });
      }
    });
  }, [open, fixedModalSize]);

  // 색상 상수 (emerald-500 사용계열)
  const emerald = "#10b981";

  // 입력 보조
  const onlyDigits = (v: string) => v.replace(/\D+/g, "");
  const onChangeContact = (v: string) => setContact(v);
  const onChangeBudget = (v: string) => setBudget(onlyDigits(v));

  const updateUrl = (idx: number, v: string) => setRefUrls((prev) => prev.map((u, i) => (i === idx ? v : u)));
  const removeUrl = (idx: number) => setRefUrls((prev) => prev.filter((_, i) => i !== idx));

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    if (!f) { setFile(null); return; }
    const max = 10 * 1024 * 1024; // 10MB
    if (f.size > max) { alert("파일은 10MB 이하여야 합니다."); e.currentTarget.value = ""; return; }
    setFile(f);
  };

  const isValidUrl = (value: string) => {
    if (!value) return true; // 공란은 오류 아님
    try {
      const u = new URL(value);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };

  // 필드별 유효성 및 에러 메시지
  const titleError = (title || "").trim().length === 0 ? "필수 항목입니다." : "";
  const contactTrim = (contact || "").trim();
  const contactOnlyDigits = contactTrim.length > 0 && /^\d+$/.test(contactTrim);
  const contactLenOk = contactOnlyDigits && contactTrim.length >= 9 && contactTrim.length <= 11;
  const contactError = !contactTrim
    ? "필수 항목입니다."
    : (!/^\d+$/.test(contactTrim) ? "숫자만 입력 가능합니다." : (!contactLenOk ? "'-'를 제외한 번호를 입력해주세요." : ""));
  const budgetNum = Number(budget || 0);
  const budgetError = negotiable ? "" : (budgetNum >= 100000 ? "" : "10만원 이상 입력해주세요.");
  const descError = (description || "").trim().length >= 10 ? "" : "최소 10자 이상 입력해주세요.";

  // 제출 가능 여부
  const hasInvalidUrlForSubmit = refUrls.some((u) => u.trim().length > 0 && !isValidUrl(u.trim()));
  const canSubmit = (
    !titleError && !contactError && !budgetError && !descError && !hasInvalidUrlForSubmit
  );

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      setTitleTouched(true);
      setContactTouched(true);
      setBudgetTouched(true);
      setDescTouched(true);
      return;
    }
    if (!targetUserId) {
      alert("대상 사용자 정보를 찾을 수 없습니다.");
      return;
    }
    try {
      await sendProjectProposal(targetUserId, {
        title: title.trim(),
        contact: contactTrim,
        budget: budgetNum,
        description: description.trim(),
        isNegotiable: negotiable,
      });
      alert("메시지를 전송했어요.");
      onClose();
    } catch (err: any) {
      alert(err?.response?.data?.message || "전송에 실패했어요.");
    }
  };

  const invalidComposer = composerUrl.trim().length > 0 && !isValidUrl(composerUrl.trim());
  const onClickAddComposer = () => {
    const value = composerUrl.trim();
    if (!value) return; // 내용이 있어야만 추가 (형식은 목록에서 검증)
    // 첫 추가부터 목록에 append
    setRefUrls((prev) => [...prev, ""]);
    // 입력은 유지하여 연속 추가 가능
    requestAnimationFrame(() => {
      urlsScrollRef.current?.scrollTo({ top: urlsScrollRef.current.scrollHeight, behavior: "smooth" });
    });
  };

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
            className="fixed left-1/2 top-1/2 z-[10010] w-[480px] max-w-[92vw] max-h-[88vh] -translate-x-1/2 -translate-y-1/2 flex flex-col items-stretch overflow-hidden bg-white rounded-[12px] shadow-2xl"
            style={fixedModalSize ? { width: fixedModalSize.w, height: fixedModalSize.h } : undefined}
          >
            {/* 헤더: 뒤로가기/중앙 사용자/닫기(X) + 구분선 */}
            <div className="relative px-2 pt-2 pb-2">
              {/* 뒤로가기 */}
              <button
                className="absolute left-2 top-0.5 text-[50px] font-light text-gray-500 hover:text-black p-1.5 leading-none"
                onClick={() => { onClose(); onBackToMenu?.(); }}
                aria-label="뒤로가기"
              >
                ‹
              </button>
              {/* 중앙 사용자 표시 */}
              <div className="h-12 flex items-center justify-center gap-2 pointer-events-none text-gray-800">
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[12px]">{avatarInitial}</div>
                <div className="text-[14px] font-medium">{displayName}</div>
              </div>
              {/* 닫기(X): SuggestAction과 동일 크기/위치 */}
              <button
                className="absolute right-2 top-0.5 text-[50px] font-light text-gray-500 hover:text-black p-1.5 leading-none"
                onClick={onClose}
                aria-label="닫기"
              >
                ×
              </button>
              {/* 구분선 */}
              <div className="mt-2 border-t border-gray-200" />
            </div>

            {/* 내용 영역 (타이틀/설명 + 폼 포함) */}
            <div className="px-6 py-4 overflow-y-auto flex-1 min-h-0" style={{ overscrollBehavior: "contain", scrollbarGutter: "stable both-edges" }}>
              <div className="w-[400px] max-w-full mx-auto">
                {/* 타이틀/설명 */}
                <div className="text-center mb-3">
                  <div className="text-[18px] font-bold">프로젝트 의뢰 및 프리랜서 제안하기</div>
                  <div className="text-[12px] text-gray-500 mt-1">내용을 자세히 입력할수록 회신 가능성이 높아집니다.</div>
                </div>

                <form className="flex flex-col gap-3" onSubmit={submitForm}>
                  <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-semibold text-gray-700">프로젝트 제목<span className="text-green-500">*</span></label>
                    <input value={title} onChange={(e) => { setTitle(e.target.value); setTitleTouched(true); }} onBlur={() => setTitleTouched(true)} placeholder="제목을 입력해주세요." className={`w-full h-9 border rounded px-3 text-[14px] outline-none ${(titleTouched && titleError) ? "border-rose-500" : "border-gray-300"}`} />
                    {(titleTouched && titleError) && (<div className="text-[12px] text-rose-500">{titleError}</div>)}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-semibold text-gray-700">연락처<span className="text-green-500">*</span></label>
                    <input value={contact} onChange={(e) => { onChangeContact(e.target.value); setContactTouched(true); }} onBlur={() => setContactTouched(true)} inputMode="numeric" placeholder="'-' 제외 숫자만 입력해주세요." className={`w-full h-9 border rounded px-3 text-[14px] outline-none ${(contactTouched && contactError) ? "border-rose-500" : "border-gray-300"}`} />
                    {(contactTouched && contactError) && (<div className="text-[12px] text-rose-500">{contactError}</div>)}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-semibold text-gray-700">프로젝트 예산<span className="text-green-500">*</span></label>
                    <div className="flex items-center gap-2">
                      <input value={budget} onChange={(e) => { onChangeBudget(e.target.value); setBudgetTouched(true); }} onBlur={() => setBudgetTouched(true)} inputMode="numeric" pattern="[0-9]*" placeholder="최소 100,000원 이상 숫자만 입력" className={`flex-1 h-9 border rounded px-3 text-[14px] outline-none ${((budgetTouched && budgetError)) ? "border-rose-500" : "border-gray-300"}`} />
                      <span className="text-[14px] text-gray-600">원</span>
                    </div>
                    {(budgetTouched && budgetError) && (<div className="text-[12px] text-rose-500">{budgetError}</div>)}
                    <label className="flex items-center gap-2 text-[12px] text-gray-600 select-none">
                      <input type="checkbox" checked={negotiable} onChange={(e) => setNegotiable(e.target.checked)} className="w-4 h-4 accent-[#068334]" />
                      예산 협의 및 조정 의향이 있습니다.
                    </label>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-semibold text-gray-700">프로젝트 내용<span className="text-green-500">*</span></label>
                    <textarea value={description} onChange={(e) => { setDescription(e.target.value); setDescTouched(true); }} onBlur={() => setDescTouched(true)} placeholder="프로젝트의 간략한 정보로 적어주세요(최소 10자 이상)" className={`w-full h-32 border rounded px-3 py-2 text-[14px] resize-none outline-none ${((descTouched && descError)) ? "border-rose-500" : "border-gray-300"}`} />
                    {(descTouched && descError) && (<div className="text-[12px] text-rose-500">{descError}</div>)}
                  </div>

                  {/* 레퍼런스 URL: 작성 입력 + 추가 버튼 */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-semibold text-gray-700">레퍼런스(URL)</label>
                    <div className="flex items-center gap-2">
                      <input
                        value={composerUrl}
                        onChange={(e) => setComposerUrl(e.target.value)}
                        placeholder="레퍼런스 URL을 입력해주세요."
                        className={`flex-1 h-10 rounded px-3 text-[14px] outline-none border ${invalidComposer ? "border-rose-500" : "border-gray-300"}`}
                      />
                      <button
                        type="button"
                        onClick={onClickAddComposer}
                        disabled={!composerUrl.trim()}
                        className="w-10 h-10 rounded border border-gray-300 text-gray-700 text-[22px] leading-none disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                        aria-label="URL 추가"
                      >+
                      </button>
                    </div>
                    {invalidComposer && (
                      <div className="text-[12px] text-rose-500">올바른 URL 형식을 작성해주세요.</div>
                    )}

                    {/* 추가된 URL 목록: 고정 높이 + 내부 스크롤 */}
                    {refUrls.length > 0 && (
                      <div ref={urlsScrollRef} className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: 160 }}>
                        {refUrls.map((u, idx) => {
                          const value = u;
                          const isEmpty = value.trim().length === 0;
                          const formatInvalid = value.trim().length > 0 && !isValidUrl(value.trim());
                          const invalid = isEmpty || formatInvalid;
                          return (
                            <div key={idx} className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <input
                                  value={value}
                                  onChange={(e) => updateUrl(idx, e.target.value)}
                                  placeholder="레퍼런스 URL을 입력해주세요."
                                  className={`flex-1 h-10 rounded px-3 text-[14px] outline-none border ${invalid ? "border-rose-500" : "border-gray-300"}`}
                                />
                                <button type="button" onClick={() => removeUrl(idx)} className="w-10 h-10 rounded border border-gray-300 text-gray-700 flex items-center justify-center" aria-label="URL 삭제">🗑</button>
                              </div>
                              {invalid && (
                                <div className="text-[12px] text-rose-500">{formatInvalid ? "올바른 URL 형식을 작성해주세요." : "URL 입력란을 작성해주세요."}</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-semibold text-gray-700">첨부파일</label>
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex-1 h-10 border border-gray-300 rounded px-3 text-[14px] flex items-center cursor-pointer select-none ${file ? "text-gray-900" : "text-gray-500"}`}
                        onClick={() => fileInputRef.current?.click()}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current?.click(); } }}
                        role="button"
                        tabIndex={0}
                        aria-label="파일 업로드"
                      >
                        {file ? file.name : "업로드(10MB 이내 파일 선택)"}
                      </div>
                      <button type="button" onClick={() => setFile(null)} className="w-10 h-10 rounded border border-gray-300 text-gray-700 flex items-center justify-center" aria-label="첨부 제거">🗑</button>
                      <input ref={fileInputRef} type="file" onChange={onFileChange} className="hidden" />
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* 하단 고정 버튼 바 */}
            <div className="px-6 py-3 border-t border-gray-200 bg-white flex items-center justify-end gap-3">
              <button type="button" onClick={onClose} className="px-4 h-10 rounded border border-gray-300 text-gray-700">취소</button>
              <button disabled={!canSubmit || !targetUserId} onClick={submitForm as any} className={`px-5 h-10 rounded text-white ${canSubmit && targetUserId ? "bg-[#068334] hover:opacity-90" : "bg-gray-300 cursor-not-allowed"}`}>메시지 전송</button>
            </div>
          </div>
        </>,
        document.body
      )
    : null;

  return <>{Modal}</>;
}