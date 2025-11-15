import React, { useEffect, useMemo, useState, useRef } from "react";
import { createProject, uploadImage, ProjectRequest, updateProject, addEnvVarsBulk, EnvVarRequest, getEnvVars, uploadDeployFile, deleteDeployFile } from "../../api/projectApi";
import { createGithubBranchAndPR } from "../../api/projectApi";
import { getStaticUrl } from "../../config/staticBase";
import { FiImage } from "react-icons/fi";
import { HiOutlineUpload } from "react-icons/hi";
import CoverCropper from "./CoverCropper";
import TokenGuideModal from "./TokenGuideModal";
import EnvVarsInput, { EnvVar } from "./EnvVarsInput";
import Toast from "../common/Toast";
import CustomDropdown from "../common/CustomDropdown";

// 년도 옵션 생성 (최신 년도부터 20년 전까지)
const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 21 }, (_, i) => (currentYear - i).toString());
};

// 월 옵션 생성 (01-12)
const monthOptions = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));

// 팀원 수 옵션 생성 (01-20)
const teamSizeOptions = Array.from({ length: 20 }, (_, i) => (i + 1).toString().padStart(2, '0'));

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (projectId: number, previewUrl: string) => void;
  libraryImages?: string[]; // 에디터에서 사용된 이미지 목록
  // 편집 모드 지원
  editMode?: boolean;
  initialDetail?: any;
  editOwnerId?: number;
  editProjectId?: number;
  // 프리뷰 연동
  onTitleChange?: (v: string) => void;
  onSummaryChange?: (v: string) => void;
  onCategoriesChange?: (arr: string[]) => void;
  onCoverChange?: (url: string) => void;
}

const Backdrop: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/40 z-[9998]" onClick={onClose} />
);

const ModalFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center">
    <div className="relative bg-white dark:bg-[var(--surface)] w-[1500px] max-w-[95%] rounded-xl shadow-xl h-[720px] flex flex-col overflow-hidden font-gmarket text-[#232323] dark:text-white leading-[1.55] text-[16px] border border-black/10 dark:border-[var(--border-color)]">
      {children}
    </div>
  </div>
);


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
      <div className="relative bg-white dark:bg-[var(--surface)] w-[760px] max-w-[95%] rounded-xl shadow-xl max-h-[85vh] overflow-hidden border border-black/10 dark:border-[var(--border-color)]">
        <div className="px-6 py-4 border-b border-black/10 dark:border-[var(--border-color)] flex items-center justify-between">
          <div className="text-[18px] font-semibold text-black dark:text-white">콘텐츠에서 선택하기</div>
          <button type="button" className="w-10 h-10 text-[28px] leading-none text-black dark:text-white" onClick={onClose}>×</button>
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
                    className={`relative border rounded overflow-hidden aspect-[4/3] bg-[#F3F4F6] dark:bg-white/5 border-black/10 dark:border-[var(--border-color)] ${isSelected ? 'ring-2 ring-teal-500' : 'hover:ring-2 hover:ring-black/20 dark:hover:ring-white/10'}`}
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
            <div className="text-gray-500 dark:text-white/70">텍스트 에디터에서 사용한 이미지가 없습니다.</div>
          )}
        </div>
        <div className="px-6 py-3 border-t border-black/10 dark:border-[var(--border-color)] flex justify-end gap-2">
          <button type="button" className="h-9 px-4 border border-[#E5E7EB] dark:border-[var(--border-color)] rounded bg-white dark:bg-[var(--surface)] text-black dark:text-white hover:bg-gray-50 dark:hover:bg-white/5" onClick={onClose}>취소</button>
          <button type="button" className="h-9 px-4 rounded text-white ring-1 ring-black/10 dark:ring-white/15 border border-black/20 dark:border-white/10 disabled:opacity-40" style={{background:'#111'}} disabled={!selected} onClick={()=> selected && onConfirm(selected)}>완료</button>
        </div>
      </div>
    </div>
  );
};

const ProjectDetailsModal: React.FC<Props> = ({ open, onClose, onCreated, libraryImages, editMode = false, initialDetail, editOwnerId, editProjectId, onTitleChange, onSummaryChange, onCategoriesChange, onCoverChange }) => {
  const [coverUrl, setCoverUrl] = useState<string>(getStaticUrl("assets/logo.png"));
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null); // 업로드 실패 시 지연 업로드용
  const [isImageLoading, setIsImageLoading] = useState<boolean>(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [startYear, setStartYear] = useState<number | "">("");
  const [endYear, setEndYear] = useState<number | "">("");
  const [startMonth, setStartMonth] = useState<string>("01");
  const [endMonth, setEndMonth] = useState<string>("01");
  const [isTeam, setIsTeam] = useState(false);
  const [teamSize, setTeamSize] = useState<number | "">("");

  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [frontendBuildCommand, setFrontendBuildCommand] = useState("");
  const [backendBuildCommand, setBackendBuildCommand] = useState("");
  const [portNumber, setPortNumber] = useState<number | "">("");

  const [tools, setTools] = useState<string[]>([]);
  const [detailDescription, setDetailDescription] = useState(" ");

  const [qrCodeEnabled, setQrCodeEnabled] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false); // 미디어 피커 상태 (훅은 early return 위)
  const [noImageToast, setNoImageToast] = useState(false); // 콘텐츠 이미지 없음 토스트

  // 배포/데모 여부
  const [deployEnabled, setDeployEnabled] = useState(false);

  // GitHub 배포 설정
  const [ghOwner, setGhOwner] = useState("");
  const [ghRepo, setGhRepo] = useState("");
  const [ghBase, setGhBase] = useState("main");
  const [ghToken, setGhToken] = useState("");
  
  // 환경 변수 및 토큰 가이드 모달
  const [envVars, setEnvVars] = useState<EnvVar[]>([{key: '', value: ''}]);
  const [tokenGuideOpen, setTokenGuideOpen] = useState(false);
  const [githubSyncEnabled, setGithubSyncEnabled] = useState(false);
  const [envVarsSubmitted, setEnvVarsSubmitted] = useState(false);

  // 배포 파일 관리
  const [deployFiles, setDeployFiles] = useState<Array<{name: string; url: string}>>([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  // 크롭 모달 상태
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorToast, setErrorToast] = useState({ visible: false, message: "" });
  const [successToast, setSuccessToast] = useState({ visible: false, message: "" });

  // 함수들을 ref로 저장해서 무한 루프 방지
  const onTitleChangeRef = useRef(onTitleChange);
  const onSummaryChangeRef = useRef(onSummaryChange);
  const onCategoriesChangeRef = useRef(onCategoriesChange);
  const onCoverChangeRef = useRef(onCoverChange);

  // ref 업데이트
  useEffect(() => {
    onTitleChangeRef.current = onTitleChange;
    onSummaryChangeRef.current = onSummaryChange;
    onCategoriesChangeRef.current = onCategoriesChange;
    onCoverChangeRef.current = onCoverChange;
  });

  // 배포가 비활성화되면 QR 코드 생성도 자동으로 비활성화
  useEffect(() => {
    if (!deployEnabled) {
      setQrCodeEnabled(false);
    }
  }, [deployEnabled]);

  useEffect(() => {
    if (!open) return;
    if (!editMode || !initialDetail) return;
    
    // 수정 모드일 때만 기존 값 불러오기
    try {
      const titleValue = initialDetail.title || "";
      const summaryValue = initialDetail.summary || initialDetail.description || "";
      const toolsCsv = initialDetail.tools || "";
      const arr = String(toolsCsv).split(",").map((s: string) => s.trim()).filter(Boolean);
      
      setTitle(titleValue);
      setSummary(summaryValue);
      setTools(arr);
      
      if (initialDetail.startYear) setStartYear(Number(initialDetail.startYear));
      if (initialDetail.endYear) setEndYear(Number(initialDetail.endYear));
      if (typeof initialDetail.coverUrl === 'string' && initialDetail.coverUrl) {
        setCoverUrl(initialDetail.coverUrl);
      }
      setDetailDescription(initialDetail.description || " ");
      setRepositoryUrl(initialDetail.repositoryUrl || "");
      setDemoUrl(initialDetail.demoUrl || "");
      setFrontendBuildCommand(initialDetail.frontendBuildCommand || "");
      setBackendBuildCommand(initialDetail.backendBuildCommand || "");
      setPortNumber(initialDetail.portNumber || "");
      if (typeof initialDetail.qrCodeEnabled === 'boolean') setQrCodeEnabled(initialDetail.qrCodeEnabled);
      if (typeof initialDetail.deployEnabled === 'boolean') setDeployEnabled(initialDetail.deployEnabled);

      // Prefill GitHub information from existing fields
      // GitHub 정보는 별도 필드가 없으므로 기존 필드들을 활용하거나 빈 값으로 설정
      setGhOwner(initialDetail.repositoryUrl || "");
      setGhRepo(initialDetail.extraRepoUrl || "");
      setGhBase("main"); // 기본값으로 설정 (프로젝트 상세에는 브랜치 정보가 없음)
      setGhToken(""); // 토큰은 보안상 저장되지 않으므로 빈 값
      
      // 콜백 함수들은 별도 useEffect에서 호출
      setTimeout(() => {
        onTitleChangeRef.current?.(titleValue);
        onSummaryChangeRef.current?.(summaryValue);
        onCategoriesChangeRef.current?.(arr);
        if (typeof initialDetail.coverUrl === 'string' && initialDetail.coverUrl) {
          onCoverChangeRef.current?.(initialDetail.coverUrl);
        }
      }, 0);
    } catch {}
  }, [open, editMode, initialDetail]);

  // 콜백 함수들은 상태 변경 시에만 호출 (ref 사용으로 무한 루프 방지)
  useEffect(() => { 
    onTitleChangeRef.current?.(title); 
  }, [title]);
  useEffect(() => { 
    onSummaryChangeRef.current?.(summary || detailDescription || ""); 
  }, [summary, detailDescription]);
  useEffect(() => { 
    onCategoriesChangeRef.current?.(tools); 
  }, [tools]);
  useEffect(() => { 
    onCoverChangeRef.current?.(coverUrl); 
  }, [coverUrl]);

  const coverIsUploaded = useMemo(() => {
    const v = String(coverUrl || "");
    return /^(http|https):\/\//.test(v);
  }, [coverUrl]);
  const isStep1Valid = useMemo(
    () => !!title && (!!startYear || !!endYear) && (coverIsUploaded || !!pendingCoverFile),
    [title, startYear, endYear, coverIsUploaded, pendingCoverFile]
  );

  // 추가: 기술 스택 옵션 및 토글 헬퍼
  const toolOptions: string[] = [
    "JavaScript","Python","Java","C / C ++","C#","Android","iOS","Docker",
    "Go","Kotlin","Swift","Rust","React","Vue","PostgreSQL","MySQL",
    "Angular","Node.js","Flask","Django","Spring","Kubernetes","AWS",
    "Elasticsearch","MongoDB","Redis","Jenkins"
  ];
  const toggleTool = (name: string) => {
    setTools(prev => {
      const has = prev.includes(name);
      if (has) return prev.filter(t => t !== name);
      return [...prev, name];
    });
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

  // 수정 모드일 때 기존 환경변수 조회
  useEffect(() => {
    if (!open || !editMode || !editProjectId) return;
    
    const loadExistingEnvVars = async () => {
      try {
        const existingEnvVars = await getEnvVars(editProjectId);
        
        if (existingEnvVars.length > 0) {
          const envVarsData = existingEnvVars.map((env: any) => ({
            key: env.keyName,
            value: '', // 보안상 값은 비워둠 (암호화되어 있어서)
            status: undefined,
            message: undefined
          }));
          setEnvVars(envVarsData);
        } else {
          // 기존 환경변수가 없으면 기본 빈 행 유지
          setEnvVars([{key: '', value: ''}]);
        }
      } catch (e: any) {
        // 조회 실패해도 기본 빈 행은 유지
        setEnvVars([{key: '', value: ''}]);
      }
    };

    loadExistingEnvVars();
  }, [open, editMode, editProjectId]);

  // 재시도 이벤트 처리
  useEffect(() => {
    const handleRetryEnvVar = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { index, envVar } = customEvent.detail;
      
      try {
        const envRequest: EnvVarRequest = {
          keyName: envVar.key.trim(),
          value: envVar.value.trim()
        };
        
        const retryResponse = await addEnvVarsBulk(
          editProjectId || 0,
          [envRequest],
          githubSyncEnabled ? ghToken : undefined,
          githubSyncEnabled ? ghOwner : undefined,
          githubSyncEnabled ? ghRepo : undefined
        );
        
        // 재시도 응답 처리
        if (Array.isArray(retryResponse)) {
          const responseItem = retryResponse.find(item => item.keyName === envVar.key);
          if (responseItem) {
            setEnvVars(prev => prev.map((item, i) => 
              i === index ? { ...item, status: 'OK', message: undefined } : item
            ));
          }
        } else {
          // 문자열 응답인 경우
          setEnvVars(prev => prev.map((item, i) => 
            i === index ? { ...item, status: 'OK', message: undefined } : item
          ));
        }
        
        setErrorToast({ 
          visible: true, 
          message: `환경변수 "${envVar.key}" 재시도 성공` 
        });
      } catch (e: any) {
        setEnvVars(prev => prev.map((item, i) => 
          i === index ? { ...item, status: 'FAILED', message: e?.message } : item
        ));
        
        setErrorToast({ 
          visible: true, 
          message: `환경변수 "${envVar.key}" 재시도 실패: ${e?.message}` 
        });
      }
    };

    window.addEventListener('retryEnvVar', handleRetryEnvVar);
    
    return () => {
      window.removeEventListener('retryEnvVar', handleRetryEnvVar);
    };
  }, [editProjectId, githubSyncEnabled, ghToken, ghOwner, ghRepo]);

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
    if (err) { 
      setErrorToast({ visible: true, message: err });
      return; 
    }
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
    rect: { blob: Blob; url: string }
  ) => {
    setIsImageLoading(true);
    setCropOpen(false);

    // 1) 미리보기 먼저 표시 (4:3 비율 직사각형 이미지 사용)
    let previewUrl = rect.url;
    try {
      const dataUrl = await new Promise<string>((resolve) => {
        try {
          const fr = new FileReader();
          fr.onload = () => resolve(String(fr.result || rect.url));
          fr.onerror = () => resolve(rect.url);
          fr.readAsDataURL(rect.blob);
        } catch {
          resolve(rect.url);
        }
      });
      previewUrl = dataUrl;
    } catch {}
    setCoverUrl(previewUrl);

    // 2) 업로드 파일 준비 + 우선 pendingCoverFile 세팅(버튼 활성화 보장)
    const file = new File([rect.blob], "cover.jpg", { type: "image/jpeg" });
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
    } finally {
      setIsImageLoading(false);
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
    const coverIsUploaded = typeof coverUrl === 'string' && /^(http|https):\/\//.test(String(coverUrl));
    if (coverIsUploaded) return String(coverUrl);
    if (!pendingCoverFile) return undefined;
    try {
      const res = await uploadImage(pendingCoverFile);
      setPendingCoverFile(null);
      setCoverUrl(res.url);
      return res.url;
    } catch (e: any) {
      // 업로드가 실패했더라도 기존 값이 서버 URL이면 통과
      return coverIsUploaded ? String(coverUrl) : undefined;
    }
  };

  // 배포 파일 업로드
  const handleDeployFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!editOwnerId && !editProjectId) {
      setErrorToast({ visible: true, message: "프로젝트를 먼저 생성해야 배포 파일을 업로드할 수 있습니다." });
      return;
    }

    setUploadingFile(true);
    const userId = editOwnerId || 0;
    const projectId = editProjectId || 0;

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileUrl = await uploadDeployFile(userId, projectId, file);
        return { name: file.name, url: fileUrl };
      });
        const uploaded = await Promise.all(uploadPromises);
        setDeployFiles(prev => [...prev, ...uploaded]);
        setSuccessToast({ visible: true, message: `${uploaded.length}개 파일 업로드 완료` });
    } catch (e: any) {
      setErrorToast({ visible: true, message: `업로드 실패: ${e?.message}` });
    } finally {
      setUploadingFile(false);
    }
  };

  // 배포 파일 삭제
  const handleDeployFileDelete = async (fileUrl: string, fileName: string) => {
    try {
        await deleteDeployFile(fileUrl);
        setDeployFiles(prev => prev.filter(f => f.url !== fileUrl));
        setSuccessToast({ visible: true, message: `"${fileName}" 삭제 완료` });
    } catch (e: any) {
      setErrorToast({ visible: true, message: `삭제 실패: ${e?.message}` });
    }
  };

  const onSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const finalCover = await ensureCoverUploaded();
      const resolvedCover = finalCover || (coverIsUploaded ? coverUrl : undefined);
      if (!resolvedCover) {
        setErrorToast({
          visible: true,
          message: "커버 이미지를 업로드해 주세요."
        });
        return;
      }
      const payload: ProjectRequest = {
        title,
        description: summary || detailDescription,
        tools: tools.join(","),
        repositoryUrl,
        demoUrl: deployEnabled ? (demoUrl.trim() || undefined) : undefined,
        startYear: startYear === "" ? undefined : Number(startYear),
        endYear: endYear === "" ? undefined : Number(endYear),
        isTeam,
        teamSize: teamSize === "" ? undefined : Number(teamSize),
        coverUrl: String(resolvedCover),
        image: String(resolvedCover),
        deployEnabled,
        qrCodeEnabled,
        // 배포 설정이 체크되었을 때 빌드 명령어를 저장 (빈 문자열이어도 저장하여 배포 설정이 체크되었음을 표시)
        // 체크되지 않았으면 undefined로 저장하여 배포 설정이 해제되었음을 표시
        frontendBuildCommand: deployEnabled ? (frontendBuildCommand.trim() || "") : undefined,
        backendBuildCommand: deployEnabled ? (backendBuildCommand.trim() || "") : undefined,
        portNumber: portNumber === "" ? undefined : Number(portNumber),
      };
      
      let projectId: number;
      if (editMode && editOwnerId && editProjectId) {
        await updateProject(editOwnerId, editProjectId, payload);
        projectId = editProjectId;
        onCreated?.(editProjectId, initialDetail?.previewUrl || "");
      } else {
        const res = await createProject(payload);
        projectId = res.projectId;
        onCreated?.(res.projectId, res.previewUrl);
        setErrorToast({ visible: true, message: `프로젝트 생성 완료! 미리보기: ${res.previewUrl}` });
      }

      // 환경변수 등록 (별도 API 호출)
      const validEnvVars = envVars.filter(env => env.key.trim() && env.value.trim());
      if (validEnvVars.length > 0) {
        // GitHub 동기화 시 필수 검증
        if (githubSyncEnabled) {
          if (!ghToken || !ghToken.trim()) {
            setErrorToast({ 
              visible: true, 
              message: "GitHub 동기화를 위해서는 토큰을 입력해야 합니다." 
            });
            return;
          }
          if (!ghOwner || !ghOwner.trim()) {
            setErrorToast({ 
              visible: true, 
              message: "Owner와 Repo를 입력해야 GitHub 동기화가 가능합니다." 
            });
            return;
          }
          if (!ghRepo || !ghRepo.trim()) {
            setErrorToast({ 
              visible: true, 
              message: "Owner와 Repo를 입력해야 GitHub 동기화가 가능합니다." 
            });
            return;
          }
        }

        try {
          const envRequests: EnvVarRequest[] = validEnvVars.map(env => ({
            keyName: env.key.trim(),
            value: env.value.trim()
          }));
          
          const envResponse = await addEnvVarsBulk(
            projectId,
            envRequests,
            githubSyncEnabled ? ghToken : undefined,
            ghOwner || "",  // 항상 전달 (빈 문자열이라도)
            ghRepo || ""    // 항상 전달 (빈 문자열이라도)
          );
          
          // 실제 백엔드 응답 처리
          if (Array.isArray(envResponse)) {
            // 백엔드가 배열 형태로 반환하는 경우 (실제 응답)
            setEnvVars(prev => prev.map((envVar, index) => {
              const responseItem = envResponse.find(item => item.keyName === envVar.key);
              if (responseItem) {
                return {
                  ...envVar,
                  status: 'OK',
                  message: undefined
                };
              }
              return envVar;
            }));
            
            setEnvVarsSubmitted(true);
            
            // 전체 요약 알림
            const successCount = envResponse.length;
            const githubSuccessCount = githubSyncEnabled ? successCount : 0;
            
            setErrorToast({ 
              visible: true, 
              message: `환경변수 등록 완료 (DB: ${successCount}개${githubSyncEnabled ? `, GitHub: ${githubSuccessCount}개` : ''})` 
            });
          } else {
            // 백엔드가 문자열을 반환하는 경우 (기존 방식)
            setEnvVars(prev => prev.map(envVar => ({
              ...envVar,
              status: 'OK',
              message: undefined
            })));
            
            setEnvVarsSubmitted(true);
            
            setErrorToast({ 
              visible: true, 
              message: `환경변수 등록 완료 (${validEnvVars.length}개)` 
            });
          }
        } catch (e: any) {
          // 백엔드 응답에서 더 자세한 에러 메시지 추출
          let errorMessage = e?.message || "알 수 없는 오류";
          if (e?.response?.data?.message) {
            errorMessage = e.response.data.message;
          } else if (e?.response?.data) {
            errorMessage = JSON.stringify(e.response.data);
          }
          
          setErrorToast({ 
            visible: true, 
            message: `환경변수 등록 실패: ${errorMessage}` 
          });
        }
      }

      // GitHub 브랜치/PR 생성
      if (ghOwner && ghRepo && ghBase && ghToken) {
        try {
          await createGithubBranchAndPR(projectId, { 
            owner: ghOwner, 
            repo: ghRepo, 
            baseBranch: ghBase, 
            token: ghToken,
            frontendBuildCommand: frontendBuildCommand || "",
            backendBuildCommand: backendBuildCommand || ""
          });
        } catch (e: any) {
          // 브랜치가 이미 존재하는 경우는 경고만 표시
          if (e?.message?.includes("Reference already exists")) {
            // 브랜치가 이미 존재합니다. 기존 브랜치를 사용합니다.
          } else {
            setErrorToast({ 
              visible: true, 
              message: `GitHub PR 생성 실패: ${e?.message}` 
            });
          }
        }
      }
      
      // 프로젝트 생성/업데이트 성공 후 상태 초기화
      setDeployEnabled(false);
      setQrCodeEnabled(true);
      setGhOwner("");
      setGhRepo("");
      setGhBase("main");
      setGhToken("");
      setFrontendBuildCommand("");
      setBackendBuildCommand("");
      setPortNumber("");
      setGithubSyncEnabled(false);
      setEnvVars([{key: '', value: ''}]);
      setEnvVarsSubmitted(false);
      
      onClose();
    } catch (e: any) {
      setErrorToast({
        visible: true,
        message: e?.message ?? "생성 실패"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Toast
        visible={errorToast.visible}
        message={errorToast.message}
        type="error"
        size="medium"
        autoClose={3000}
        closable={true}
        onClose={() => setErrorToast(prev => ({ ...prev, visible: false }))}
      />
        <Toast
          visible={successToast.visible}
          message={successToast.message}
          type="success"
          size="medium"
          autoClose={3000}
          closable={true}
          onClose={() => setSuccessToast(prev => ({ ...prev, visible: false }))}
        />
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 dark:border-[var(--border-color)]">
          <div className="text-[22px] font-semibold text-black dark:text-white">세부 정보 설정</div>
          <button type="button" onClick={onClose} className="w-10 h-10 flex items-center justify-center text-[40px] leading-none text-black dark:text-white">×</button>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="grid items-start h-full pt-0 gap-x-20" style={{ gridTemplateColumns: '420px 1fr', gridAutoRows: 'auto' }}>
          {/* Left column */}
          <div className="p-8 flex flex-col self-start bg-white dark:bg-[var(--surface)] h-fit border-r border-[#E5E7EB] dark:border-[var(--border-color)]">
            <div className="text-[16px] font-semibold text-gray-900 dark:text-white mb-3">커버 이미지 <span className="text-blue-500">(필수)</span></div>
            <div className="w-[360px] aspect-[4/3] bg-[#EEF3F3] dark:bg-white/5 rounded-[10px] flex items-center justify-center overflow-hidden relative">
              {isImageLoading ? (
                <div className="flex flex-col items-center justify-center text-neutral-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-2"></div>
                  <span className="text-sm">이미지 불러오는 중...</span>
                </div>
              ) : coverUrl ? (
                <img 
                  src={coverUrl} 
                  alt="cover" 
                  className={`w-full h-full select-none ${coverUrl === getStaticUrl("assets/logo.png") ? 'object-contain' : 'object-cover object-top'}`} 
                  draggable={false} 
                />
              ) : (
                <div className="w-8 h-8 rounded bg-white/60" />
              )}
            </div>
            <div className="w-[360px] mt-6 border border-[#ADADAD] dark:border-[var(--border-color)] rounded-[8px] overflow-hidden grid grid-cols-2 relative">
              <div className="absolute top-px bottom-px left-1/2 w-px bg-[#ADADAD] dark:bg-[var(--border-color)]" />
              <button type="button" className="h-[64px] bg-white dark:bg-[var(--surface)] flex flex-col items-center justify-center gap-1" onClick={openPicker}>
                <FiImage className="text-[#232323] dark:text-white" />
                <span className="font-gmarket text-black dark:text-white">콘텐츠에서 선택</span>
              </button>
              <button type="button" className="h-[64px] bg-white dark:bg-[var(--surface)] flex flex-col items-center justify-center gap-1" onClick={handleLocalUpload}>
                <HiOutlineUpload className="text-[#232323] dark:text-white" />
                <span className="font-gmarket text-black dark:text-white">직접 업로드</span>
              </button>
            </div>
            <div className="w-[360px] mt-2 font-gmarket text-black dark:text-white/70 text-[15px]">
              커버 이미지 권장 사이즈는 4:3 비율이며, 5MB 이상 파일이나 GIF 파일은 업로드하실 수 없습니다.
            </div>

          </div>

          {/* Right column */}
          <div className="p-8 pb-28 flex flex-col h-full overflow-y-auto overscroll-contain">
            <div className="flex-1 space-y-6">
              {/* 섹션 1: 기본 정보 */}
              <div>
                <div className="text-[16px] font-semibold text-gray-900 dark:text-white mb-3">제목 <span className="text-blue-500">(필수)</span></div>
                <input className="border border-[#ADADAD] dark:border-[var(--border-color)] rounded px-5 h-14 w-full text-[17px] placeholder:text-gray-500 dark:placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-black/15 focus:border-black bg-white dark:bg-[var(--surface)] dark:text-white" placeholder="제목을 입력하세요." value={title} onChange={e=>setTitle(e.target.value)} />
              </div>
              <div>
                <div className="text-[16px] font-semibold text-gray-900 dark:text-white mb-3">한 줄 소개</div>
                <input className="border border-[#ADADAD] dark:border-[var(--border-color)] rounded px-5 h-14 w-full text-[17px] placeholder:text-gray-500 dark:placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-black/15 focus:border-black bg-white dark:bg-[var(--surface)] dark:text-white" placeholder="프로젝트에 대해 간단하게 설명해주세요" value={summary} onChange={e=>setSummary(e.target.value)} />
              </div>
              <div>
                <div className="text-[16px] font-semibold text-gray-900 dark:text-white mb-3">프로젝트 진행 기간</div>
                <div className="flex items-center gap-3 flex-wrap">
                  <CustomDropdown
                    value={startYear === '' ? '' : startYear.toString()}
                    onChange={(value) => setStartYear(value === '' ? '' : Number(value))}
                    options={getYearOptions()}
                    placeholder="년도"
                    className="w-40"
                  />
                  <CustomDropdown
                    value={startMonth}
                    onChange={(value) => setStartMonth(value)}
                    options={monthOptions}
                    placeholder="월"
                    className="w-20"
                  />
                  <span className="text-gray-400 dark:text-white/60">-</span>
                  <CustomDropdown
                    value={endYear === '' ? '' : endYear.toString()}
                    onChange={(value) => setEndYear(value === '' ? '' : Number(value))}
                    options={getYearOptions()}
                    placeholder="년도"
                    className="w-40"
                  />
                  <CustomDropdown
                    value={endMonth}
                    onChange={(value) => setEndMonth(value)}
                    options={monthOptions}
                    placeholder="월"
                    className="w-20"
                  />
                </div>
              </div>
              <div>
                <div className="text-[16px] font-semibold text-gray-900 dark:text-white mb-3">프로젝트 여부</div>
                <div className="flex flex-col gap-3 text-[16px]">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="scale-110" checked={!isTeam} onChange={(e)=>setIsTeam(!e.target.checked)} /> <span className="text-black dark:text-white">개인 프로젝트</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="scale-110" checked={isTeam} onChange={(e)=>setIsTeam(e.target.checked)} /> <span className="text-black dark:text-white">팀 프로젝트</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <span className={isTeam ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-white/50"}>팀원 구성원 수</span>
                    <CustomDropdown
                      value={teamSize === '' ? '01' : String(teamSize).padStart(2,'0')}
                      onChange={(value) => setTeamSize(Number(value))}
                      options={teamSizeOptions}
                      placeholder="01"
                      className="w-24"
                      disabled={!isTeam}
                    />
                  </div>
                </div>
              </div>

              {/* 섹션 2: 저장소/빌드/포트 */}
              <div className="pt-4">
                <div className="text-[16px] font-semibold text-gray-900 dark:text-white mb-3">프로젝트 배포 설정 여부</div>
                <label className="flex items-center gap-2 text-[16px] text-black dark:text-white mb-3">
                  <input 
                    type="checkbox" 
                    className="scale-110" 
                    checked={deployEnabled} 
                    onChange={(e) => setDeployEnabled(e.target.checked)} 
                  /> 
                  <span>배포 설정</span>
                </label>
              </div>
              {/* QR 코드 생성 여부 - 배포 설정 바로 아래 */}
              <div className={!deployEnabled ? 'opacity-50 pointer-events-none' : ''}>
                <div className="text-[16px] font-semibold text-gray-900 dark:text-white mb-3">QR 코드 생성 여부</div>
                <label className="flex items-center gap-2 text-[16px] text-black dark:text-white">
                  <input 
                    type="checkbox" 
                    className="scale-110" 
                    checked={qrCodeEnabled} 
                    onChange={(e) => setQrCodeEnabled(e.target.checked)}
                    disabled={!deployEnabled}
                  /> 
                  <span>QR 코드 생성</span>
                </label>
                {!deployEnabled && (
                  <div className="text-[12px] text-gray-500 dark:text-white/60 mt-2">
                    배포 설정을 활성화해야 QR 코드를 생성할 수 있습니다.
                  </div>
                )}
              </div>
              
              {/* 배포 URL 입력 */}
              <div className={`pt-4 ${!deployEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="text-[16px] font-semibold text-gray-900 dark:text-white mb-3">
                  배포 URL (Demo URL)
                  {deployEnabled && <span className="text-orange-500 ml-1">*</span>}
                </div>
                <input 
                  className={`border border-[#ADADAD] dark:border-[var(--border-color)] rounded px-5 h-12 w-full text-[16px] placeholder:text-gray-500 dark:placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-black/15 focus:border-black bg-white dark:bg-[var(--surface)] dark:text-white ${!deployEnabled ? 'cursor-not-allowed' : ''}`}
                  placeholder="예: https://d11ngnf9bl79gb.cloudfront.net/57/197/index.html"
                  value={demoUrl} 
                  onChange={e=>setDemoUrl(e.target.value)}
                  disabled={!deployEnabled}
                />
                <div className="text-[12px] text-gray-500 dark:text-white/60 mt-2">
                  CloudFront 배포 URL을 입력하세요. 라이브 데모 링크와 QR 코드에 사용됩니다.
                </div>
              </div>
              
              <div className="pt-4">
                <div className="text-[16px] font-semibold text-gray-900 dark:text-white mb-3">Github 이름</div>
                <input 
                  className={`border border-[#ADADAD] dark:border-[var(--border-color)] rounded px-5 h-12 w-full text-[16px] placeholder:text-gray-500 dark:placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-black/15 focus:border-black bg-white dark:bg-[var(--surface)] dark:text-white ${!deployEnabled ? 'opacity-50 cursor-not-allowed' : ''}`} 
                  placeholder="owner (Github 사용자/조직)" 
                  value={ghOwner} 
                  onChange={e=>setGhOwner(e.target.value)}
                  disabled={!deployEnabled}
                />
              </div>
              <div>
                <div className="text-[16px] font-semibold text-gray-900 dark:text-white mb-3">Github 레포명</div>
                <input 
                  className={`border border-[#ADADAD] dark:border-[var(--border-color)] rounded px-5 h-12 w-full text-[16px] placeholder:text-gray-500 dark:placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-black/15 focus:border-black bg-white dark:bg-[var(--surface)] dark:text-white ${!deployEnabled ? 'opacity-50 cursor-not-allowed' : ''}`} 
                  placeholder="repo (레포 이름)" 
                  value={ghRepo} 
                  onChange={e=>setGhRepo(e.target.value)}
                  disabled={!deployEnabled}
                />
              </div>
              <div>
                <div className="text-[16px] font-semibold text-gray-900 dark:text-white mb-3">레포 메인 브랜치명</div>
                <input 
                  className={`border border-[#ADADAD] dark:border-[var(--border-color)] rounded px-5 h-12 w-full text-[16px] placeholder:text-gray-500 dark:placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-black/15 focus:border-black bg-white dark:bg-[var(--surface)] dark:text-white ${!deployEnabled ? 'opacity-50 cursor-not-allowed' : ''}`} 
                  placeholder="baseBranch (기본 main)" 
                  value={ghBase} 
                  onChange={e=>setGhBase(e.target.value)}
                  disabled={!deployEnabled}
                />
              </div>
              {/* 빌드 커맨드 입력 */}
              <div>
                <div className="text-[16px] font-semibold text-gray-900 dark:text-white mb-3">프론트 빌드 명령어</div>
                <input
                  className={`border border-[#ADADAD] dark:border-[var(--border-color)] rounded px-5 h-12 w-full text-[16px] placeholder:text-gray-500 dark:placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-black/15 focus:border-black bg-white dark:bg-[var(--surface)] dark:text-white ${!deployEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder="예: npm run build"
                  value={frontendBuildCommand}
                  onChange={(e) => setFrontendBuildCommand(e.target.value)}
                  disabled={!deployEnabled}
                />
              </div>
              <div>
                <div className="text-[16px] font-semibold text-gray-900 dark:text-white mb-3">백엔드 빌드 명령어</div>
                <input
                  className={`border border-[#ADADAD] dark:border-[var(--border-color)] rounded px-5 h-12 w-full text-[16px] placeholder:text-gray-500 dark:placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-black/15 focus:border-black bg-white dark:bg-[var(--surface)] dark:text-white ${!deployEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder="예: ./gradlew build"
                  value={backendBuildCommand}
                  onChange={(e) => setBackendBuildCommand(e.target.value)}
                  disabled={!deployEnabled}
                />
              </div>
              <div>
                <div className="text-[16px] font-semibold text-gray-900 dark:text-white mb-3">Github 토큰</div>
                <input 
                  type="password" 
                  className={`border border-[#ADADAD] dark:border-[var(--border-color)] rounded px-4 h-12 w-full text-[16px] bg-white dark:bg-[var(--surface)] dark:text-white ${!deployEnabled ? 'opacity-50 cursor-not-allowed' : ''}`} 
                  placeholder="Personal Access Token" 
                  value={ghToken} 
                  onChange={e=>setGhToken(e.target.value)}
                  disabled={!deployEnabled}
                />
                
                {/* GitHub 동기화 체크박스 - 토큰 입력 바로 아래 */}
                <div className="mt-2">
                  <label className={`flex items-center gap-2 text-[14px] text-black dark:text-white ${!deployEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input 
                      type="checkbox" 
                      className="scale-110" 
                      checked={githubSyncEnabled} 
                      onChange={(e) => setGithubSyncEnabled(e.target.checked)}
                      disabled={!deployEnabled}
                    /> 
                    <span>GitHub 동기화 여부</span>
                  </label>
                  {githubSyncEnabled && deployEnabled && (
                    <div className="text-[12px] text-gray-500 dark:text-white/60 mt-1">
                      환경변수가 GitHub Actions Secrets로도 등록됩니다.
                    </div>
                  )}
                </div>
                
                <div className="text-[12px] text-gray-500 dark:text-white/60 mt-2">토큰은 저장 시 사용만 하고 서버에 보관하지 않습니다.</div>
                <button 
                  type="button" 
                  className={`mt-2 px-4 py-2 text-sm bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded hover:from-orange-600 hover:to-yellow-600 transition-colors ${!deployEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => setTokenGuideOpen(true)}
                  disabled={!deployEnabled}
                >
                  토큰 발급 설명서
                </button>
              </div>
              {/* 배포용 추가 파일 업로드 - 수정 모드에서만 표시 */}
              {editMode && editOwnerId && editProjectId && (
                <div className={`pt-4 ${!deployEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="text-[16px] font-semibold text-gray-900 dark:text-white mb-3">
                    배포용 추가 파일
                    <span className="text-[12px] text-gray-500 dark:text-white/60 ml-2 font-normal">
                      (config.json, nginx.conf 등)
                    </span>
                  </div>
                  
                  {/* 파일 업로드 버튼 */}
                  <div className="flex items-center gap-3 mb-3">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => handleDeployFileUpload(e.target.files)}
                        disabled={uploadingFile}
                      />
                      <div className={`px-4 py-2 rounded border text-sm transition-colors ${
                        uploadingFile
                          ? 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/40 border-gray-300 dark:border-white/20 cursor-not-allowed'
                          : 'bg-white dark:bg-[var(--surface)] text-black dark:text-white border-[#ADADAD] dark:border-[var(--border-color)] hover:bg-gray-50 dark:hover:bg-white/5'
                      }`}>
                        {uploadingFile ? '업로드 중...' : '📁 파일 선택'}
                      </div>
                    </label>
                  </div>

                  {/* 업로드된 파일 목록 */}
                  {deployFiles.length > 0 && (
                    <div className="border border-[#ADADAD] dark:border-[var(--border-color)] rounded p-3 space-y-2">
                      <div className="text-[14px] font-semibold text-gray-700 dark:text-white/80 mb-2">
                        업로드된 파일 ({deployFiles.length}개)
                      </div>
                      {deployFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-white/5 rounded">
                          <span className="text-[14px] text-black dark:text-white truncate flex-1">
                            📄 {file.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeployFileDelete(file.url, file.name)}
                            className="ml-3 px-3 py-1 text-[12px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-[12px] text-gray-500 dark:text-white/60 mt-2">
                    배포 시 GitHub Actions에서 자동으로 다운로드하여 사용됩니다.
                  </div>
                </div>
              )}

              <div className={!deployEnabled ? 'opacity-50 pointer-events-none' : ''}>
                <EnvVarsInput
                  envVars={envVars}
                  onEnvVarsChange={setEnvVars}
                  submitted={envVarsSubmitted}
                />
              </div>

              {/* 섹션 3: 카테고리 및 상세 설명 */}
              <div className="pt-4">
                <div className="text-[16px] font-semibold text-gray-900 dark:text-white mb-3">카테고리</div>
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                  {toolOptions.map(opt => (
                    <label key={opt} className="flex items-center gap-2 text-[15px] text-black dark:text-white">
                      <input type="checkbox" className="scale-110" checked={tools.includes(opt)} onChange={()=>toggleTool(opt)} /> {opt}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[16px] font-semibold text-gray-900 dark:text-white mb-3">프로젝트 상세 설명</div>
                <textarea className="border border-[#ADADAD] dark:border-[var(--border-color)] rounded p-4 w-full min-h-[180px] text-[15px] placeholder:text-gray-500 dark:placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-black/15 focus:border-black bg-white dark:bg-[var(--surface)] dark:text-white" placeholder="프로젝트 소개, 주요 기능, 구현 내용 등 상세 설명을 입력해주세요" value={detailDescription} onChange={e=>setDetailDescription(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="px-6 pb-10" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-black/10 dark:border-[var(--border-color)] flex justify-end gap-2">
          <button className="h-10 px-4 border border-[#ADADAD] dark:border-[var(--border-color)] rounded bg-white dark:bg-[var(--surface)] text-black dark:text-white" onClick={onClose} type="button">닫기</button>
          <button
            className="h-10 px-5 rounded text-white bg-[#16A34A] hover:bg-[#12863D] shadow-md ring-1 ring-black/5 dark:ring-white/10 transition-colors disabled:bg-[#F3F4F6] dark:disabled:bg-white/10 disabled:text-[#6B7280] dark:disabled:text-white/40 disabled:border disabled:border-[#E5E7EB] dark:disabled:border-[var(--border-color)] disabled:ring-0 disabled:shadow-none"
            disabled={!isStep1Valid || submitting}
            onClick={onSubmit}
            type="button"
          >
            업로드
          </button>
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
        {tokenGuideOpen && (
          <TokenGuideModal open={tokenGuideOpen} onClose={() => setTokenGuideOpen(false)} />
        )}
      </ModalFrame>
    </>
  );
};

export default ProjectDetailsModal; 
