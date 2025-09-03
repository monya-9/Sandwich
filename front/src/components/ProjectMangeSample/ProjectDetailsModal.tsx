import React, { useEffect, useMemo, useState } from "react";
import { createProject, uploadImage, ProjectRequest } from "../../api/projectApi";
import logoPng from "../../assets/logo.png";
import { FiImage } from "react-icons/fi";
import { HiOutlineUpload } from "react-icons/hi";
import CoverCropper from "./CoverCropper";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (projectId: number, previewUrl: string) => void;
  libraryImages?: string[]; // 에디터에서 사용된 이미지 목록
}

const Backdrop: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/40 z-[9998]" onClick={onClose} />
);

const ModalFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center">
    <div className="relative bg-white w-[1500px] max-w-[95%] rounded-xl shadow-xl h-[720px] flex flex-col overflow-hidden font-gmarket text-[#232323] leading-[1.55] text-[16px]">
      {children}
    </div>
  </div>
);

const StepIndicator: React.FC<{ step: number; total: number }> = ({ step, total }) => (
  <div className="px-6 py-3 text-sm text-gray-600 border-b">단계 {step} / {total}</div>
);

const FileButton: React.FC<{ label: string; onPick: (file: File) => void }> = ({ label, onPick }) => {
  const onClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files && input.files[0];
      if (file) onPick(file);
    };
    input.click();
  };
  return (
    <button type="button" onClick={onClick} className="h-10 px-4 border rounded">{label}</button>
  );
};

// CoverCropper extracted to its own file

// 간단한 미디어 라이브러리 모달 (localStorage 기반)
const MediaPicker: React.FC<{
  open: boolean;
  images: string[];
  onClose: () => void;
  onConfirm: (src: string) => void;
}> = ({ open, images, onClose, onConfirm }) => {
  const [selected, setSelected] = useState<string | null>(null);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-[760px] max-w-[95%] rounded-xl shadow-xl max-h-[85vh] overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="text-[18px] font-semibold">콘텐츠에서 선택하기</div>
          <button type="button" className="w-10 h-10 text-[28px] leading-none" onClick={onClose}>×</button>
        </div>
        <div className="p-6 overflow-auto" style={{maxHeight: '65vh'}}>
          {images.length ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((src, idx)=> {
                const isSelected = selected === src;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={()=> setSelected(src)}
                    className={`relative border rounded overflow-hidden aspect-[4/3] bg-[#F3F4F6] ${isSelected ? 'ring-2 ring-teal-500' : 'hover:ring-2 hover:ring-black/20'}`}
                  >
                    <img src={src} alt="library-item" className="w-full h-full object-cover" />
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-teal-500 text-white text-xs font-semibold flex items-center justify-center">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-gray-500">텍스트 에디터에서 사용한 이미지가 없습니다.</div>
          )}
        </div>
        <div className="px-6 py-3 border-t flex justify-end gap-2">
          <button type="button" className="h-9 px-4 border rounded" onClick={onClose}>취소</button>
          <button type="button" className="h-9 px-4 rounded text-white disabled:opacity-40" style={{background:'#111'}} disabled={!selected} onClick={()=> selected && onConfirm(selected)}>완료</button>
        </div>
      </div>
    </div>
  );
};

const ProjectDetailsModal: React.FC<Props> = ({ open, onClose, onCreated, libraryImages }) => {
  const totalSteps = 4;
  const [step, setStep] = useState(1);
  const gotoNext = () => setStep(s => Math.min(totalSteps, s + 1));
  const gotoPrev = () => setStep(s => Math.max(1, s - 1));

  const [coverUrl, setCoverUrl] = useState<string>(logoPng);
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null); // 업로드 실패 시 지연 업로드용
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [startYear, setStartYear] = useState<number | "">("");
  const [endYear, setEndYear] = useState<number | "">("");
  const [startMonth, setStartMonth] = useState<string>("01");
  const [endMonth, setEndMonth] = useState<string>("01");
  const [isTeam, setIsTeam] = useState(false);
  const [teamSize, setTeamSize] = useState<number | "">("");

  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [frontendBuildCommand, setFrontendBuildCommand] = useState("");
  const [backendBuildCommand, setBackendBuildCommand] = useState("");
  const [portNumber, setPortNumber] = useState<number | "">("");

  const [tools, setTools] = useState<string[]>([]);
  const [detailDescription, setDetailDescription] = useState(" ");

  const [demoUrl, setDemoUrl] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [extraRepoUrl, setExtraRepoUrl] = useState("");
  const [qrCodeEnabled, setQrCodeEnabled] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false); // 미디어 피커 상태 (훅은 early return 위)
  const [noImageToast, setNoImageToast] = useState(false); // 콘텐츠 이미지 없음 토스트

  // 크롭 모달 상태
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const coverIsUploaded = useMemo(() => {
    const v = String(coverUrl || "");
    return /^https?:\/\//.test(v) || v.startsWith("/api/");
  }, [coverUrl]);
  const isStep1Valid = useMemo(
    () => !!title && (!!startYear || !!endYear) && (coverIsUploaded || !!pendingCoverFile),
    [title, startYear, endYear, coverIsUploaded, pendingCoverFile]
  );

  const months: string[] = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  // 추가: 기술 스택 옵션 및 토글 헬퍼
  const toolOptions: string[] = [
    "JavaScript","Python","Java","C / C ++","C#","Android","iOS","Docker",
    "Go","Kotlin","Swift","Rust","React","Vue","PostgreSQL","MySQL",
    "Angular","Node.js","Flask","Django","Spring","Kubernetes","AWS",
    "Elasticsearch","MongoDB","Redis","Jenkins"
  ];
  const toggleTool = (name: string) => {
    setTools(prev => prev.includes(name) ? prev.filter(t => t !== name) : [...prev, name]);
  };

  // 모달 오픈 시 바깥쪽 스크롤 잠금
  useEffect(() => {
    if (!open) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [open]);

  if (!open) return null;

  const validateFile = (file: File): string | null => {
    if (/gif$/i.test(file.type) || file.name.toLowerCase().endsWith('.gif')) {
      return 'GIF 파일은 업로드할 수 없습니다.';
    }
    const max = 5 * 1024 * 1024;
    if (file.size > max) return '5MB 이상 파일은 업로드할 수 없습니다.';
    return null;
  };

  const openCropperWithFile = (file: File) => {
    const err = validateFile(file);
    if (err) { alert(err); return; }
    const url = URL.createObjectURL(file);
    setCropSrc(url);
    setCropOpen(true);
  };

  const openCropperWithUrl = (src: string) => {
    setCropSrc(src);
    setCropOpen(true);
  };

  const onCropDone = async (
    square: { blob: Blob; url: string },
    _rect: { blob: Blob; url: string }
  ) => {
    // 1) 미리보기 먼저 표시
    let previewUrl = square.url;
    try {
      const dataUrl = await new Promise<string>((resolve) => {
        try {
          const fr = new FileReader();
          fr.onload = () => resolve(String(fr.result || square.url));
          fr.onerror = () => resolve(square.url);
          fr.readAsDataURL(square.blob);
        } catch {
          resolve(square.url);
        }
      });
      previewUrl = dataUrl;
    } catch {}
    setCoverUrl(previewUrl);
    setCropOpen(false);

    // 2) 업로드 파일 준비 + 우선 pendingCoverFile 세팅(버튼 활성화 보장)
    const file = new File([square.blob], "cover.jpg", { type: "image/jpeg" });
    setPendingCoverFile(file);

    try {
      // 3) 업로드 수행
      const res = await uploadImage(file);

      // 4) 접근 가능한 URL인지 확인 (CORS/권한/만료 등)
      await new Promise<void>((resolve, reject) => {
        const im = new Image();
        try { (im as any).crossOrigin = "anonymous"; } catch {}
        im.onload = () => resolve();
        im.onerror = () => reject(new Error("이미지 로드 실패"));
        im.src = res.url;
      });

      // 5) 접근 OK → 진짜 URL로 교체 + pendingCoverFile 해제
      setCoverUrl(res.url);
      setPendingCoverFile(null);
    } catch (err) {
      // 업로드 실패 or 접근 실패 → 미리보기 유지 + 재시도 위해 pending 유지
      console.warn("커버 업로드/검증 실패, 재시도 필요:", (err as any)?.message);
    }
  };

  const handleLocalUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files && input.files[0];
      if (file) openCropperWithFile(file);
    };
    input.click();
  };

  // 콘텐츠에서 선택: 미디어 피커 오픈
  const openPicker = () => {
    const hasImages = Array.isArray(libraryImages) && libraryImages.length > 0;
    if (!hasImages) {
      setNoImageToast(true);
      window.setTimeout(() => setNoImageToast(false), 2200);
      return;
    }
    setPickerOpen(true);
  };

  const ensureCoverUploaded = async (): Promise<string | undefined> => {
    // 이미 서버 URL이면 그대로 사용
    if (!pendingCoverFile) return coverIsUploaded ? String(coverUrl) : undefined;
    try {
      const res = await uploadImage(pendingCoverFile);
      setPendingCoverFile(null);
      setCoverUrl(res.url);
      return res.url;
    } catch (e: any) {
      console.warn('커버 업로드 재시도 실패:', e?.message);
      // 업로드가 실패했더라도 기존 값이 서버 URL이면 통과
      return coverIsUploaded ? String(coverUrl) : undefined;
    }
  };

  const onSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const finalCover = await ensureCoverUploaded();
      const resolvedCover = finalCover || (coverIsUploaded ? coverUrl : undefined);
      if (!resolvedCover) {
        alert("커버 이미지를 업로드해 주세요.");
        return;
      }
      const payload: ProjectRequest = {
        title,
        description: summary || detailDescription,
        tools: tools.join(","),
        repositoryUrl,
        demoUrl,
        startYear: startYear === "" ? undefined : Number(startYear),
        endYear: endYear === "" ? undefined : Number(endYear),
        isTeam,
        teamSize: teamSize === "" ? undefined : Number(teamSize),
        coverUrl: String(resolvedCover),
        image: String(resolvedCover),
        shareUrl: shareUrl || undefined,
        qrCodeEnabled,
        frontendBuildCommand: frontendBuildCommand || undefined,
        backendBuildCommand: backendBuildCommand || undefined,
        portNumber: portNumber === "" ? undefined : Number(portNumber),
        extraRepoUrl: extraRepoUrl || undefined,
      };
      const res = await createProject(payload);
      onCreated?.(res.projectId, res.previewUrl);
      alert(`프로젝트 생성 완료! 미리보기: ${res.previewUrl}`);
      onClose();
    } catch (e: any) {
      alert(e?.message ?? "생성 실패");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {cropOpen ? (
        <div className="fixed inset-0 z-[9998]" />
      ) : (
        <Backdrop onClose={onClose} />
      )}
      <ModalFrame>
        {noImageToast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[10001]" role="status" aria-live="polite"> 
            <div className="bg-[#111] text-white rounded-[10px] px-4 py-2 shadow-lg flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-[#F04438] flex items-center justify-center text-[12px] font-bold">!</span>
              <span className="text-[14px]">콘텐츠 중 이미지가 없습니다</span>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="text-[22px] font-semibold">세부 정보 설정</div>
          <button type="button" onClick={onClose} className="w-10 h-10 flex items-center justify-center text-[40px] leading-none">×</button>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="grid items-start h-full pt-0 gap-x-20" style={{ gridTemplateColumns: '420px 1fr', gridAutoRows: 'auto' }}>
          {/* Left column */}
          <div className="p-8 flex flex-col self-start bg-white h-fit border-r border-[#E5E7EB]">
            <div className="text-[16px] font-semibold text-gray-900 mb-3">커버 이미지 <span className="text-blue-500">(필수)</span></div>
            <div className="w-[360px] aspect-square bg-[#EEF3F3] rounded-[10px] flex items-center justify-center overflow-hidden">
              {coverUrl ? (
                <img src={coverUrl} alt="cover" className="w-full h-full object-contain select-none" draggable={false} />
              ) : (
                <div className="w-8 h-8 rounded bg-white/60" />
              )}
            </div>
            <div className="w-[360px] mt-6 border border-[#ADADAD] rounded-[8px] overflow-hidden grid grid-cols-2 relative">
              <div className="absolute top-px bottom-px left-1/2 w-px bg-[#ADADAD]" />
              <button type="button" className="h-[64px] bg-white flex flex-col items-center justify-center gap-1" onClick={openPicker}>
                <FiImage className="text-[#232323]" />
                <span className="font-gmarket text-black">콘텐츠에서 선택</span>
              </button>
              <button type="button" className="h-[64px] bg-white flex flex-col items-center justify-center gap-1" onClick={handleLocalUpload}>
                <HiOutlineUpload className="text-[#232323]" />
                <span className="font-gmarket text-black">직접 업로드</span>
              </button>
            </div>
            <div className="w-[360px] mt-2 font-gmarket text-black text-[15px]">
              커버 이미지 권장 사이즈는 760x760이며, 5MB 이상 파일이나 GIF 파일은 업로드하실 수 없습니다.
            </div>

          </div>

          {/* Right column */}
          <div className="p-8 pb-28 flex flex-col h-full overflow-y-auto overscroll-contain">
            <div className="flex-1 space-y-6">
              {/* 섹션 1: 기본 정보 */}
              <div>
                <div className="text-[16px] font-semibold text-gray-900 mb-3">제목 <span className="text-blue-500">(필수)</span></div>
                <input className="border border-[#ADADAD] rounded px-5 h-14 w-full text-[17px] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black/15 focus:border-black bg-white" placeholder="제목을 입력하세요." value={title} onChange={e=>setTitle(e.target.value)} />
              </div>
              <div>
                <div className="text-[16px] font-semibold text-gray-900 mb-3">한 줄 소개</div>
                <input className="border border-[#ADADAD] rounded px-5 h-14 w-full text-[17px] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black/15 focus:border-black bg-white" placeholder="프로젝트에 대해 간단하게 설명해주세요" value={summary} onChange={e=>setSummary(e.target.value)} />
              </div>
              <div>
                <div className="text-[16px] font-semibold text-gray-900 mb-3">프로젝트 진행 기간</div>
                <div className="flex items-center gap-3 flex-wrap">
                  <input className="border border-[#ADADAD] rounded px-4 h-12 w-32 text-[16px] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black/15 focus:border-black bg-white" placeholder="시작년도" value={startYear} onChange={e=>setStartYear(e.target.value === '' ? '' : Number(e.target.value))} />
                  <select className="border border-[#ADADAD] rounded h-12 px-3 w-20 text-[16px] focus:outline-none focus:ring-2 focus:ring-black/15 focus:border-black bg-white" value={startMonth} onChange={e=>setStartMonth(e.target.value)}>
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <input className="border border-[#ADADAD] rounded px-4 h-12 w-32 text-[16px] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black/15 focus:border-black bg-white" placeholder="종료년도" value={endYear} onChange={e=>setEndYear(e.target.value === '' ? '' : Number(e.target.value))} />
                  <select className="border border-[#ADADAD] rounded h-12 px-3 w-20 text-[16px] focus:outline-none focus:ring-2 focus:ring-black/15 focus:border-black bg-white" value={endMonth} onChange={e=>setEndMonth(e.target.value)}>
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <div className="text-[16px] font-semibold text-gray-900 mb-3">프로젝트 여부</div>
                <div className="flex flex-col gap-3 text-[16px]">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="scale-110 accent-black" checked={!isTeam} onChange={(e)=>setIsTeam(!e.target.checked)} /> 개인 프로젝트
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="scale-110 accent-black" checked={isTeam} onChange={(e)=>setIsTeam(e.target.checked)} /> 팀 프로젝트
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-900">팀원 구성원 수</span>
                    <select className="border border-[#ADADAD] rounded h-12 px-3 w-24 text-[16px] focus:outline-none focus:ring-2 focus:ring-black/15 focus:border-black bg-white" value={teamSize === '' ? '01' : String(teamSize).padStart(2,'0')} onChange={e=>setTeamSize(Number(e.target.value))}>
                      {Array.from({length:20},(_,i)=>String(i+1).padStart(2,'0')).map(n=> <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* 섹션 2: 저장소/빌드/포트 */}
              <div className="pt-4">
                <div className="text-[16px] font-semibold text-gray-900 mb-3">GitHub URL</div>
                <input className="border border-[#ADADAD] rounded px-5 h-12 w-full text-[16px] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black/15 focus:border-black bg-white" placeholder="프론트엔드/백엔드 소스코드 링크를 URL로 입력하세요" value={repositoryUrl} onChange={e=>setRepositoryUrl(e.target.value)} />
              </div>
              <div>
                <div className="text-[16px] font-semibold text-gray-900 mb-3">빌드 명령어 (Frontend)</div>
                <input className="border border-[#ADADAD] rounded px-5 h-12 w-full text-[16px] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black/15 focus:border-black bg-white" placeholder="ex) npm run build" value={frontendBuildCommand} onChange={e=>setFrontendBuildCommand(e.target.value)} />
              </div>
              <div>
                <div className="text-[16px] font-semibold text-gray-900 mb-3">빌드 명령어 (Backend)</div>
                <input className="border border-[#ADADAD] rounded px-5 h-12 w-full text-[16px] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black/15 focus:border-black bg-white" placeholder="ex) ./gradlew build" value={backendBuildCommand} onChange={e=>setBackendBuildCommand(e.target.value)} />
              </div>
              <div>
                <div className="text-[16px] font-semibold text-gray-900 mb-3">서버 포트 번호</div>
                <input className="border border-[#ADADAD] rounded px-5 h-12 w-full text-[16px] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black/15 focus:border-black bg-white" placeholder="ex) 8080" value={portNumber} onChange={e=>setPortNumber(e.target.value === '' ? '' : Number(e.target.value))} />
              </div>

              {/* 섹션 3: 기술 스택 및 상세 설명 */}
              <div className="pt-4">
                <div className="text-[16px] font-semibold text-gray-900 mb-3">기술 스택 선택</div>
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                  {toolOptions.map(opt => (
                    <label key={opt} className="flex items-center gap-2 text-[15px]">
                      <input type="checkbox" className="scale-110 accent-black" checked={tools.includes(opt)} onChange={()=>toggleTool(opt)} /> {opt}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[16px] font-semibold text-gray-900 mb-3">프로젝트 상세 설명</div>
                <textarea className="border border-[#ADADAD] rounded p-4 w-full min-h-[180px] text-[15px] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black/15 focus:border-black bg-white" placeholder="프로젝트 소개, 주요 기능, 구현 내용 등 상세 설명을 입력해주세요" value={detailDescription} onChange={e=>setDetailDescription(e.target.value)} />
              </div>

              {/* 섹션 4: 데모/공유/추가 URL & QR */}
              <div className="pt-4">
                <div className="text-[16px] font-semibold text-gray-900 mb-3">라이브 데모 URL (생성 후 자동 제공 예정)</div>
                <input className="border border-[#ADADAD] rounded px-5 h-12 w-full text-[16px] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black/15 focus:border-black bg-white" placeholder="자동생성 (https://username.yoursite.com)" value={demoUrl} onChange={e=>setDemoUrl(e.target.value)} />
              </div>
              <div>
                <div className="text-[16px] font-semibold text-gray-900 mb-3">SNS 공유용 링크 입력</div>
                <input className="border border-[#ADADAD] rounded px-5 h-12 w-full text-[16px] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black/15 focus:border-black bg-white" placeholder="ex) 블로그 등 링크" value={shareUrl} onChange={e=>setShareUrl(e.target.value)} />
              </div>
              <div>
                <div className="text-[16px] font-semibold text-gray-900 mb-3">추가 소스코드 URL</div>
                <input className="border border-[#ADADAD] rounded px-5 h-12 w-full text-[16px] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black/15 focus:border-black bg-white" placeholder="GitLab, Bitbucket 등 다른 저장소 링크" value={extraRepoUrl} onChange={e=>setExtraRepoUrl(e.target.value)} />
              </div>
              <div>
                <div className="text-[16px] font-semibold text-gray-900 mb-3">QR 코드 자동 생성 여부 (기본 자동 생성)</div>
                <div className="flex items-center gap-8">
                  <label className="flex items-center gap-2"><input type="radio" name="qr" className="accent-black" checked={qrCodeEnabled} onChange={()=>setQrCodeEnabled(true)} /> 생성</label>
                  <label className="flex items-center gap-2"><input type="radio" name="qr" className="accent-black" checked={!qrCodeEnabled} onChange={()=>setQrCodeEnabled(false)} /> 생성 안 함</label>
                </div>
              </div>
            </div>
          </div>
          <div className="px-6 pb-10" />
          </div>
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-2">
          <button className="h-10 px-4 border rounded" onClick={onClose} type="button">닫기</button>
          <button className="h-10 px-5 bg-black text-white rounded disabled:opacity-50" disabled={!isStep1Valid || submitting} onClick={onSubmit} type="button">업로드</button>
        </div>
        {pickerOpen && (
          <MediaPicker open={pickerOpen} images={libraryImages || []} onClose={()=>setPickerOpen(false)} onConfirm={(src)=>{
            setPickerOpen(false);
            openCropperWithUrl(src);
          }} />
        )}
        {cropOpen && (
          <CoverCropper open={cropOpen} src={cropSrc} onClose={()=>{setCropOpen(false); setCropSrc(null);}} onCropped={onCropDone} />
        )}
      </ModalFrame>
    </>
  );
};

export default ProjectDetailsModal; 