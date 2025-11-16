import React, { useMemo, useState, useContext, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { HiOutlineArrowUpTray } from "react-icons/hi2";
import Sidebar from "./Sidebar";
import { UserApi, UserProfileResponse } from "../../api/userApi";
import WorkFieldModal from "./WorkFieldModal";
import InterestFieldModal from "./InterestFieldModal";

import { positionMap, FALLBACK_INTERESTS_GENERAL } from "../../constants/position";
import Toast from "../common/Toast";
import api from "../../api/axiosInstance";

const MAX20 = 20;
const MAX_FILE_MB = 10;

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="text-[14px] text-[#6B7280] dark:text-white/70 mb-2 tracking-[0.01em] leading-[1.7]">{children}</div>
);

const Counter: React.FC<{ value: number; max?: number }> = ({ value, max = MAX20 }) => (
    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[#9CA3AF] dark:text-white/40">{value}/{max}</span>
);

const MyPageSettingPage: React.FC = () => {
    const navigate = useNavigate();
    const { search } = useLocation();
    const query = useMemo(() => new URLSearchParams(search), [search]);
    const view = query.get("view") || "";
    const [isNarrow, setIsNarrow] = useState<boolean>(false);
    useEffect(() => {
        const update = () => setIsNarrow(window.innerWidth < 1024); // lg breakpoint
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);
	const { email } = useContext(AuthContext);
	const scopedKey = useCallback((key: string) => (email ? `${key}:${email}` : key), [email]);
	const [errorToast, setErrorToast] = useState<{ visible: boolean; message: string }>({
		visible: false,
		message: ''
	});
	const [successToast, setSuccessToast] = useState<{ visible: boolean; message: string }>({
		visible: false,
		message: ''
	});
	const initialLetter = useMemo(() => {
		if (!email || email.length === 0) return "H";
		const ch = email.trim()[0];
		return ch ? ch.toUpperCase() : "H";
	}, [email]);

	const readStoredNickname = () => {
		try { return localStorage.getItem("userNickname") || sessionStorage.getItem("userNickname") || ""; } catch { return ""; }
	};
	const [userName, setUserName] = useState<string>(() => readStoredNickname());
	const [isEditingNickname, setIsEditingNickname] = useState<boolean>(false);
	const [tempNickname, setTempNickname] = useState<string>("");
	const [isCheckingNickname, setIsCheckingNickname] = useState<boolean>(false);
	const [nicknameCheckResult, setNicknameCheckResult] = useState<"available" | "duplicate" | null>(null);
	const [urlSlug, setUrlSlug] = useState<string>(() => { try { return localStorage.getItem(scopedKey("profileUrlSlug")) || sessionStorage.getItem(scopedKey("profileUrlSlug")) || ""; } catch { return ""; } });
	// 한줄 프로필은 동기 로컬 초기화 후, 서버 fetch 완료 시 한번 더 동기화
	const [oneLineProfile, setOneLineProfile] = useState<string>(() => {
		try {
			// 우선 스코프 키
			const authEmail = localStorage.getItem("authEmail") || sessionStorage.getItem("authEmail") || "";
			const scoped = authEmail ? `profileOneLine:${authEmail}` : "profileOneLine";
			let v = localStorage.getItem(scoped) || sessionStorage.getItem(scoped);
			if (!v) {
				// 스코프 키가 없다면 prefix 검색 후 첫 값을 사용
				for (let i = 0; i < localStorage.length; i++) {
					const k = localStorage.key(i) || "";
					if (k.startsWith("profileOneLine:")) { v = localStorage.getItem(k); break; }
				}
				if (!v) {
					for (let i = 0; i < sessionStorage.length; i++) {
						const k = sessionStorage.key(i) || "";
						if (k.startsWith("profileOneLine:")) { v = sessionStorage.getItem(k); break; }
					}
				}
			}
			return (v || "").slice(0, MAX20);
		} catch { return ""; }
	});
	const [bio, setBio] = useState("");
	const [isEditingBio, setIsEditingBio] = useState<boolean>(false);
	const [tempBio, setTempBio] = useState<string>("");
	const [isEditingOneLineProfile, setIsEditingOneLineProfile] = useState<boolean>(false);
	const [tempOneLineProfile, setTempOneLineProfile] = useState<string>("");
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// 서버 프로필 상태
	const [profile, setProfile] = useState<UserProfileResponse | null>(null);

	// 검증 상태
	const [userNameError, setUserNameError] = useState<string | null>(null);
	const userReqSeqRef = useRef(0); // 최신 요청 시퀀스

	// 최신 값 Refs
	const userNameRef = useRef("");
	useEffect(() => { userNameRef.current = userName; }, [userName]);
	const bioRef = useRef("");
	useEffect(() => { bioRef.current = bio; }, [bio]);
	const oneLineRef = useRef("");
	useEffect(() => { oneLineRef.current = oneLineProfile; }, [oneLineProfile]);
	const slugRef = useRef("");
	useEffect(() => { slugRef.current = urlSlug; }, [urlSlug]);


	// 작업/관심/기술 모달 상태
	const [showWorkModal, setShowWorkModal] = useState(false);
	const [workFields, setWorkFields] = useState<string[]>(() => {
		const raw = localStorage.getItem("workFields") || sessionStorage.getItem("workFields");
		try { return raw ? JSON.parse(raw) : []; } catch { return []; }
	});
	const [showInterestModal, setShowInterestModal] = useState(false);
	const [interestFields, setInterestFields] = useState<string[]>(() => {
		const raw = localStorage.getItem("interestFields") || sessionStorage.getItem("interestFields");
		try { return raw ? JSON.parse(raw) : []; } catch { return []; }
	});




	// 초기 프로필 로드 + 로컬 초기값 세팅
	useEffect(() => {
		(async () => {
			try {
				const me = await UserApi.getMe();
				setProfile(me);
				// 서버 닉네임이 있으면 스토리지와 폼 상태 최신화
				if ((me.nickname || "") && me.nickname !== userName) {
					setUserName(me.nickname || "");
					try { localStorage.setItem("userNickname", me.nickname || ""); sessionStorage.setItem("userNickname", me.nickname || ""); } catch {}
				}
				setBio(me.bio || "");
				setAvatarUrl(me.profileImage || null);
				// 서버 저장값으로 작업/관심/기술 초기화
				const existingWork = (() => { try { return JSON.parse(localStorage.getItem("workFields") || sessionStorage.getItem("workFields") || "null"); } catch { return null; } })();
				const serverWork = me.position?.name ? [me.position.name] : [];
				const initWork = Array.isArray(existingWork) ? existingWork : serverWork;
				setWorkFields(initWork);
				try { localStorage.setItem("workFields", JSON.stringify(initWork)); sessionStorage.setItem("workFields", JSON.stringify(initWork)); } catch {}
				const serverInterests = Array.isArray(me.interests) ? me.interests.map((i)=>i.name) : [];
				setInterestFields(serverInterests);
				try { localStorage.setItem("interestFields", JSON.stringify(serverInterests)); sessionStorage.setItem("interestFields", JSON.stringify(serverInterests)); } catch {}

				// 한 줄 프로필 및 URL 슬러그 초기화
				const storedOneLine = (localStorage.getItem(scopedKey("profileOneLine")) || sessionStorage.getItem(scopedKey("profileOneLine")) || "").slice(0, MAX20);
				if (storedOneLine !== oneLineProfile) setOneLineProfile(storedOneLine);
				// 로컬(스코프) 값을 우선으로 사용하고, 없으면 서버 사용자 이름을 사용
				const storedSlugScoped = (localStorage.getItem(scopedKey("profileUrlSlug")) || sessionStorage.getItem(scopedKey("profileUrlSlug")) || "");
				const resolvedSlug = (storedSlugScoped || me.username || "");
				setUrlSlug(resolvedSlug);
				try {
					localStorage.setItem(scopedKey("profileUrlSlug"), resolvedSlug);
					sessionStorage.setItem(scopedKey("profileUrlSlug"), resolvedSlug);
					localStorage.setItem(scopedKey("profileUrlSlugVerified"), "1");
					sessionStorage.setItem(scopedKey("profileUrlSlugVerified"), "1");
				} catch {}
			} catch (e) {}
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [email, scopedKey]);

	const onOpenWorkModal = () => setShowWorkModal(true);

	const onOpenInterestModal = () => setShowInterestModal(true);

	const handleUploadClick = () => fileInputRef.current?.click();
	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			setErrorToast({
				visible: true,
				message: "이미지 파일만 업로드할 수 있습니다."
			});
			e.target.value = "";
			return;
		}
		if (file.size > MAX_FILE_MB * 1024 * 1024) {
			setErrorToast({
				visible: true,
				message: `파일 용량은 ${MAX_FILE_MB}MB 이하여야 합니다.`
			});
			e.target.value = "";
			return;
		}
		try {
			// 로컬 미리보기 먼저 표시
			const preview = URL.createObjectURL(file);
			setAvatarUrl(preview);
			
			// 1) 업로드 → URL 수신
			const url = await UserApi.uploadImage(file);
			
			// 2) 프로필에 이미지 URL 반영 저장
			await persistProfilePartial({ profileImageUrl: url });
			
			setAvatarUrl(url);
			e.target.value = "";
			
			// 헤더와 드롭다운의 프로필 이미지 업데이트를 위한 이벤트 발생
			window.dispatchEvent(new CustomEvent('profile-image-updated'));
			
			setSuccessToast({
				visible: true,
				message: "프로필 이미지가 업로드되었습니다."
			});
		} catch (err) {
			setErrorToast({
				visible: true,
				message: "이미지 업로드에 실패했습니다. 잠시 후 다시 시도해주세요."
			});
		}
	};

	// 이미지 제거
	const handleRemoveImage = async () => {
		try {
			setAvatarUrl(null);
			if (fileInputRef.current) fileInputRef.current.value = "";
			await persistProfilePartial({ profileImageUrl: null as any });
		} catch {}
	};

	// 프로필 부분 업데이트(필드 일부만 변경)
	const persistProfilePartial = useCallback(async (partial: Partial<{ nickname: string; bio: string; skills: string; github: string; linkedin: string; profileImageUrl: string | null; positionId: number; interestIds: number[] }>, showToast: boolean = true) => {
		// profile 데이터가 없으면 먼저 로드
		let base = profile;
		if (!base) {
			try {
				base = await UserApi.getMe();
			} catch (error) {
				throw error;
			}
		}
		
		const payload = {
			nickname: partial.nickname ?? (base.nickname || ""),
			positionId: partial.positionId ?? (base.position?.id || 0),
			interestIds: partial.interestIds !== undefined ? partial.interestIds : (base.interests?.map((i) => i.id) || []),
			bio: partial.bio ?? (base.bio || ""),
			skills: partial.skills ?? (base.skills || ""),
			github: partial.github ?? (base.github || ""),
			linkedin: partial.linkedin ?? (base.linkedin || ""),
			profileImageUrl: (partial.profileImageUrl !== undefined) ? partial.profileImageUrl : (base.profileImage || ""),
			coverImageUrl: base.coverImage || null,
		};
		
		try {
			await UserApi.updateProfile(payload);
			
			// 프로필 이미지 업데이트의 경우 로컬 상태만 업데이트 (새로고침 최소화)
			if (partial.profileImageUrl !== undefined) {
				setProfile(prev => prev ? { ...prev, profileImage: partial.profileImageUrl } : null);
			} else {
				// 다른 필드 업데이트의 경우 전체 새로고침
				const refreshed = await UserApi.getMe();
				setProfile(refreshed);
			}
			
			if (showToast) {
				setSuccessToast({
					visible: true,
					message: "설정 내용이 저장되었습니다."
				});
			}
			return true;
		} catch (error) {
			throw error;
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// 닉네임 편집 관련 함수들
	const handleEditNickname = () => {
		setTempNickname(userName);
		setIsEditingNickname(true);
		setUserNameError(null);
		setNicknameCheckResult(null);
		setIsCheckingNickname(false);
	};

	const handleCancelNicknameEdit = () => {
		setTempNickname("");
		setIsEditingNickname(false);
		setUserNameError(null);
		setNicknameCheckResult(null);
		setIsCheckingNickname(false);
	};

	const handleSaveNickname = async () => {
		if (!tempNickname.trim()) {
			setUserNameError("닉네임을 입력해주세요.");
			return;
		}
		
		const success = await checkAndSaveUserName(tempNickname);
		if (success) {
			setUserName(tempNickname);
			setIsEditingNickname(false);
			setTempNickname("");
		}
	};

	// bio 편집 관련 함수들
	const handleEditBio = () => {
		setTempBio(bio);
		setIsEditingBio(true);
	};

	const handleCancelBioEdit = () => {
		setTempBio("");
		setIsEditingBio(false);
	};

	const handleSaveBio = async () => {
		const success = await checkAndSaveBio(tempBio);
		if (success) {
			setBio(tempBio);
			setIsEditingBio(false);
			setTempBio("");
		}
	};

	// 한 줄 프로필 편집 관련 함수들
	const handleEditOneLineProfile = () => {
		setTempOneLineProfile(oneLineProfile);
		setIsEditingOneLineProfile(true);
	};

	const handleCancelOneLineProfileEdit = () => {
		setTempOneLineProfile("");
		setIsEditingOneLineProfile(false);
	};

	const handleSaveOneLineProfile = async () => {
		const trimmed = tempOneLineProfile.trim().slice(0, MAX20);
		setOneLineProfile(trimmed);
		setIsEditingOneLineProfile(false);
		setTempOneLineProfile("");
		
		// 로컬 스토리지에 저장
		try {
			localStorage.setItem(scopedKey("profileOneLine"), trimmed);
			sessionStorage.setItem(scopedKey("profileOneLine"), trimmed);
			setSuccessToast({
				visible: true,
				message: "한 줄 프로필이 저장되었습니다."
			});
			try { window.dispatchEvent(new Event("profile-one-line-updated")); } catch {}
		} catch {}
	};

	// 사용자 이름(닉네임) 검사 + 저장: 전용 PATCH API 사용
	const checkAndSaveUserName = useCallback(async (value: string) => {
		const trimmed = value.trim();
		if (!trimmed) return false;
		const isDuplicate = await UserApi.checkNickname(trimmed);
		if (isDuplicate && trimmed !== (profile?.nickname || "")) {
			setUserNameError("이미 사용 중인 닉네임입니다.");
			return false;
		}
		if (profile && trimmed === (profile.nickname || "")) { setUserNameError(null); return false; }
		try {
			// 1차: 전용 PATCH (있을 때 가볍게)
			try { await UserApi.updateNickname(trimmed); } catch {}
			// 2차: 응답이 늦거나 무시되는 경우 대비해 전체 프로필 PUT로 보정
			let base = profile || null;
			if (!base) {
				try { base = await UserApi.getMe(); setProfile(base); } catch {}
			}
			if (base) {
				let posId = base.position?.id || 0;
				if (!posId) {
					try { const p = await UserApi.getPosition(); posId = p.id; } catch {}
				}
				const interestIds = (base.interests || []).map(i=>i.id);
				await UserApi.updateProfile({
					nickname: trimmed,
					positionId: posId || 1,
					interestIds,
					bio: base.bio || "",
					skills: base.skills || "",
					github: base.github || "",
					linkedin: base.linkedin || "",
					profileImageUrl: base.profileImage || null,
					coverImageUrl: base.coverImage || null,
				});
			}
			const refreshed = await UserApi.getMe();
			setProfile(refreshed);
			setUserNameError(null);
			try { 
				localStorage.setItem("userNickname", trimmed); 
				sessionStorage.setItem("userNickname", trimmed);
				// ✅ profileSlug도 함께 저장
				if (refreshed.profileSlug) {
					localStorage.setItem(scopedKey("profileUrlSlug"), refreshed.profileSlug);
					sessionStorage.setItem(scopedKey("profileUrlSlug"), refreshed.profileSlug);
				}
			} catch {}
			window.dispatchEvent(new Event("user-nickname-updated"));
			setSuccessToast({
				visible: true,
				message: "설정 내용이 저장되었습니다."
			});
			return true;
		} catch {
			return false;
		}
	}, [profile, scopedKey]);

	// bio 저장(값이 달라졌을 때만) - 전용 PATCH API 사용
	const checkAndSaveBio = useCallback(async (value: string) => {
		const trimmed = value.trim();
		if (!profile) return false;
		if ((profile.bio || "") === trimmed) return false;
		
		try {
			// 전용 PATCH API 사용
			await UserApi.updateBio(trimmed);
			const refreshed = await UserApi.getMe();
			setProfile(refreshed);
			setSuccessToast({
				visible: true,
				message: "소개가 저장되었습니다."
			});
			return true;
		} catch (error) {
			console.error("Bio 저장 실패:", error);
			setErrorToast({
				visible: true,
				message: "소개 저장에 실패했습니다."
			});
			return false;
		}
	}, [profile]);

	// 헬퍼: 이름→ID 매핑
	const mapWorkNameToId = (name: string | undefined): number => {
		if (!name) return profile?.position?.id || 0;
		return positionMap[name] ?? profile?.position?.id ?? 0;
	};
	const mapInterestNamesToIds = async (names: string[]): Promise<number[]> => {
		try {
			// API에서 최신 관심 분야 데이터 로드
			const res = await api.get<Array<{ id: number; name: string }>>("/meta/interests?type=GENERAL");
			const apiInterests = Array.isArray(res.data) ? res.data : [];
			
			// API 데이터와 폴백 데이터를 결합
			const allInterests = apiInterests.length > 0 ? apiInterests : FALLBACK_INTERESTS_GENERAL;
			const interestMap: Record<string, number> = {};
			allInterests.forEach((item) => {
				interestMap[item.name] = item.id;
			});
			
			// 현재 프로필의 관심 분야도 추가 (혹시 API에 없는 경우 대비)
			(profile?.interests || []).forEach((i) => { 
				interestMap[i.name] = i.id; 
			});
			
			return names.map((n) => interestMap[n]).filter((v): v is number => typeof v === "number");
		} catch (error) {
			// API 실패 시 폴백 사용
			const fallbackMap: Record<string, number> = {};
			FALLBACK_INTERESTS_GENERAL.forEach((item) => {
				fallbackMap[item.name] = item.id;
			});
			(profile?.interests || []).forEach((i) => { 
				fallbackMap[i.name] = i.id; 
			});
			return names.map((n) => fallbackMap[n]).filter((v): v is number => typeof v === "number");
		}
	};

	// 닉네임 실시간(디바운스) 중복 검사
	useEffect(() => {
		// 편집 모드가 아니거나 닉네임이 비어있으면 체크하지 않음
		if (!isEditingNickname || !tempNickname.trim()) { 
			setUserNameError(null); 
			setNicknameCheckResult(null);
			setIsCheckingNickname(false);
			return; 
		}
		
		// 기존 닉네임과 동일하면 체크하지 않음
		if (tempNickname.trim() === userName.trim()) {
			setUserNameError(null);
			setNicknameCheckResult(null);
			setIsCheckingNickname(false);
			return;
		}
		
		setIsCheckingNickname(true);
		const mySeq = ++userReqSeqRef.current;
		const handle = window.setTimeout(async () => {
			try {
				const isDuplicate = await UserApi.checkNickname(tempNickname.trim());
				if (mySeq !== userReqSeqRef.current) return;
				
				if (isDuplicate) {
					setUserNameError("이미 사용 중인 닉네임입니다.");
					setNicknameCheckResult("duplicate");
				} else {
					setUserNameError(null);
					setNicknameCheckResult("available");
				}
			} catch {
				setUserNameError("닉네임 확인 중 오류가 발생했습니다.");
				setNicknameCheckResult(null);
			} finally {
				setIsCheckingNickname(false);
			}
		}, 400);
		return () => window.clearTimeout(handle);
	}, [isEditingNickname, tempNickname, userName]);




	// 입력 변경 핸들러들
	const onOneLineChange = (e: React.ChangeEvent<HTMLInputElement>) => setTempOneLineProfile(e.target.value.slice(0, MAX20));

	const onConfirmWorkFields = async (values: string[]) => {
		setWorkFields(values);
		try {
			localStorage.setItem("workFields", JSON.stringify(values));
			sessionStorage.setItem("workFields", JSON.stringify(values));
		} catch {}
		
		try {
		// 값이 없으면 서버 업데이트 생략
		if (values.length > 0) {
			const posId = mapWorkNameToId(values[0]);
				await persistProfilePartial({ positionId: posId }, false); // 토스트 표시하지 않음
				
				// 작업 분야 저장 성공 토스트 표시
				setSuccessToast({
					visible: true,
					message: "작업 분야가 저장되었습니다."
				});
		} else {
			// 로컬만 변경된 경우에도 사용자 피드백 제공
			setSuccessToast({
				visible: true,
					message: "작업 분야가 해제되었습니다."
				});
			}
		} catch (error: any) {
			const errorMessage = error?.response?.data?.message || error?.message || "작업 분야 저장에 실패했습니다. 다시 시도해주세요.";
			setErrorToast({
				visible: true,
				message: errorMessage
			});
			return; // 에러 시 모달 닫지 않음
		}
		
		setShowWorkModal(false);
	};
	const onConfirmInterestFields = async (values: string[]) => {
		// 모달을 먼저 닫기
		setShowInterestModal(false);
		
		setInterestFields(values);
		try {
			localStorage.setItem("interestFields", JSON.stringify(values));
			sessionStorage.setItem("interestFields", JSON.stringify(values));
		} catch {}
		
		try {
			const ids = await mapInterestNamesToIds(values);
			await persistProfilePartial({ interestIds: ids }, false); // 토스트 표시하지 않음
			
			// 성공 토스트 표시
			setSuccessToast({
				visible: true,
				message: values.length > 0 ? "관심 분야가 저장되었습니다." : "관심 분야가 모두 해제되었습니다."
			});
			
		} catch (error: any) {
			const errorMessage = error?.response?.data?.message || error?.message || "관심 분야 저장에 실패했습니다. 다시 시도해주세요.";
			setErrorToast({
				visible: true,
				message: errorMessage
			});
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
            <div className="min-h-screen font-gmarket pt-5 bg-[#F5F7FA] dark:bg-[var(--bg)] text-black dark:text-white">
			<div className="mx-auto max-w-[1400px] px-4 md:px-6">
				<div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
					{/* 좌측 사이드 카드 */}
					<aside className={`${(isNarrow && view === "profile") ? "hidden" : "block"} w-full lg:w-[320px] shrink-0`}>
						<Sidebar />
					</aside>

					{/* 우측 콘텐츠 */}
						<main className={`${(isNarrow && view !== "profile") ? "hidden" : "flex-1 space-y-0"}`}>
							{/* 모바일 상단 헤더: 좌측 고정 ‹, 중앙 제목 정렬 */}
							<div className="lg:hidden grid grid-cols-[40px_1fr_40px] items-center mb-3">
								<button type="button" aria-label="뒤로가기" onClick={() => navigate("/mypage")} className="justify-self-start px-2 py-1 -ml-2 text-[30px] leading-none text-[#111827]">‹</button>
								<div className="justify-self-center text-[16px] font-medium text-center">프로필 설정</div>
								<span />
							</div>
						{/* 기본 정보 카드 */}
                        <section className="bg-white dark:bg-[var(--surface)] border border-[#E5E7EB] dark:border-[var(--border-color)] rounded-xl p-6 pb-20 box-border w-full max-w-[1400px] mx-auto">
                            <div className="text-[16px] font-medium text-[#111827] dark:text-white mb-6">기본 정보</div>

							{/* 프로필 + 업로드 */}
							<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-6">
								<div className="w-[120px] flex flex-col items-center">
									<div className="relative w-[100px] h-[100px] group">
                                        <div className="w-full h-full rounded-full bg-[#F3F4F6] dark:bg-[var(--avatar-bg)] text-black dark:text-white flex items-center justify-center text-[28px] overflow-hidden">
											{avatarUrl ? (
												<img src={avatarUrl} alt="프로필 이미지" loading="lazy" decoding="async" className="w-full h-full object-cover" />
											) : (
												<span>{initialLetter}</span>
											)}
										</div>
										{avatarUrl && (
											<button
												type="button"
												onClick={handleRemoveImage}
												className="absolute -top-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white rounded-full w-[20px] h-[20px] flex items-center justify-center text-[12px]"
												aria-label="이미지 제거"
											>
												x
											</button>
										)}
									</div>

								</div>
								<div className="flex flex-col">
									<button type="button" aria-label="프로필 사진 업로드" onClick={handleUploadClick} className="h-[36px] px-4 rounded-full border text-[13px] flex items-center gap-2 border-green-500 text-green-500 hover:bg-green-50 w-fit">
										<HiOutlineArrowUpTray className="w-4 h-4" />
										<span>프로필 사진 업로드</span>
									</button>
									<input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
									<p className="mt-3 text-[13px] text-[#6B7280]">10MB 이내의 이미지 파일을 업로드 해주세요.</p>
								</div>
							</div>

							{/* 닉네임 (편집 모드) */}
							<div className="mb-7">
								<FieldLabel>
									<span className="inline-flex items-center gap-1">
										닉네임 <span className="text-green-500">*</span>
									</span>
								</FieldLabel>
								
								{!isEditingNickname ? (
									// 읽기 모드
									<div className="flex items-center justify-between">
										<div className="flex-1 h-[48px] md:h-[55px] py-0 leading-[48px] md:leading-[55px] rounded-[10px] border border-[#E5E7EB] dark:border-[var(--border-color)] px-3 text-[14px] tracking-[0.01em] bg-[#F9FAFB] dark:bg-[var(--surface)] text-[#111827] dark:text-white">
											{userName || "닉네임을 설정해주세요"}
										</div>
										<button
											type="button"
											onClick={handleEditNickname}
											className="ml-3 px-4 h-[48px] md:h-[55px] rounded-[10px] text-[14px] bg-[#21B284] text-white hover:bg-[#1a9a73] transition-colors"
										>
											수정
										</button>
									</div>
								) : (
									// 편집 모드
									<div>
                                <div className="relative">
												<input
							type="text"
												value={tempNickname}
												onChange={(e) => {
													const newValue = e.target.value.slice(0, MAX20);
													setTempNickname(newValue);
													setUserNameError(null);
													setNicknameCheckResult(null);
													setIsCheckingNickname(false);
												}}
							aria-label="닉네임"
							maxLength={MAX20}
												aria-invalid={!!userNameError}
												aria-describedby={userNameError ? 'nickname-error' : undefined}
												className={`w-full h-[48px] md:h-[55px] py-0 leading-[48px] md:leading-[55px] rounded-[10px] border px-3 outline-none text-[14px] tracking-[0.01em] focus:border-[#068334] focus:ring-2 focus:ring-[#068334]/10 dark:bg-[var(--surface)] dark:text-white ${userNameError ? "border-[#DB2E2E]" : "border-[#E5E7EB] dark:border-[var(--border-color)]"}`}
											/>
											<Counter value={tempNickname.length} />
								</div>
										{userNameError && (
											<p id="nickname-error" role="alert" className="mt-2 text-[12px] text-[#DB2E2E]">{userNameError}</p>
										)}
										{/* ✅ 닉네임 중복 검사 결과 표시 */}
										{!userNameError && tempNickname.trim() && tempNickname.trim() !== userName.trim() && (
											<div className="mt-2 flex items-center gap-2">
												{isCheckingNickname ? (
													<>
														<div className="w-3 h-3 border-2 border-[#068334] border-t-transparent rounded-full animate-spin"></div>
														<span className="text-[12px] text-[#6B7280] dark:text-white/60">닉네임 확인 중...</span>
													</>
												) : nicknameCheckResult === "available" ? (
													<>
														<div className="w-3 h-3 bg-green-500 rounded-full"></div>
														<span className="text-[12px] text-green-600 dark:text-green-400">사용 가능한 닉네임입니다</span>
													</>
												) : nicknameCheckResult === "duplicate" ? (
													<>
														<div className="w-3 h-3 bg-red-500 rounded-full"></div>
														<span className="text-[12px] text-red-600 dark:text-red-400">이미 사용 중인 닉네임입니다</span>
													</>
										) : null}
							</div>
										)}
										<div className="mt-3 flex justify-end gap-2">
											<button
												type="button"
												onClick={handleCancelNicknameEdit}
												className="px-4 h-[36px] rounded-[10px] text-[14px] border border-[#E5E7EB] dark:border-[var(--border-color)] bg-white dark:bg-[var(--surface)] text-[#111827] dark:text-white hover:bg-[#F9FAFB] dark:hover:bg-[#111111] transition-colors"
											>
												취소
											</button>
											<button
												type="button"
												onClick={handleSaveNickname}
												disabled={!tempNickname.trim() || nicknameCheckResult === "duplicate" || isCheckingNickname}
												className={`px-4 h-[36px] rounded-[10px] text-[14px] transition-colors ${
													tempNickname.trim() && nicknameCheckResult !== "duplicate" && !isCheckingNickname
														? "bg-[#21B284] text-white hover:bg-[#1a9a73]" 
														: "bg-[#E5E7EB] text-[#111827] cursor-not-allowed"
												}`}
											>
												저장
											</button>
										</div>
								</div>
								)}
							</div>


							{/* 샌드위치 URL (닉네임 기반 자동 생성) */}
							<div className="mb-7">
								<FieldLabel>샌드위치 URL</FieldLabel>
								<div className="flex rounded-[10px] overflow-hidden h-[48px] md:h-[55px] border border-[#E5E7EB] dark:border-[var(--border-color)] min-w-0">
                                        <div className="px-3 md:px-4 flex items-center text-[13px] md:text-[14px] text-[#6B7280] dark:text-white/60 bg-[#F3F4F6] dark:bg-[#111111] border-r border-[#E5E7EB] dark:border-[var(--border-color)] whitespace-nowrap">sandwich-dev.com/</div>
									<div className="flex-1 h-[48px] md:h-[55px] py-0 leading-[48px] md:leading-[55px] px-3 text-[14px] tracking-[0.01em] bg-[#F9FAFB] dark:bg-[var(--surface)] text-[#6B7280] dark:text-white/60 flex items-center">
										{isEditingNickname 
											? (tempNickname.trim() ? tempNickname.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_') : '닉네임을 입력하세요')
											: (profile?.profileSlug || (userName.trim() ? userName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_') : '닉네임을 입력하세요'))
										}
									</div>
								</div>
								<div className="mt-2 text-[12px] text-[#6B7280] dark:text-white/60">
									닉네임을 입력하면 자동으로 생성됩니다
								</div>
							</div>

							{/* 한 줄 프로필 (편집 모드) */}
							<div className="mb-7">
								<FieldLabel>한 줄 프로필</FieldLabel>
								
								{!isEditingOneLineProfile ? (
									// 읽기 모드
									<div className="flex items-center justify-between">
										<div className="flex-1 h-[48px] md:h-[55px] py-0 leading-[48px] md:leading-[55px] rounded-[10px] border border-[#E5E7EB] dark:border-[var(--border-color)] px-3 text-[14px] tracking-[0.01em] bg-[#F9FAFB] dark:bg-[var(--surface)] text-[#111827] dark:text-white">
											{oneLineProfile || "한 줄 프로필을 입력해주세요"}
										</div>
										<button
											type="button"
											onClick={handleEditOneLineProfile}
											className="ml-3 px-4 h-[48px] md:h-[55px] rounded-[10px] text-[14px] bg-[#21B284] text-white hover:bg-[#1a9a73] transition-colors"
										>
											수정
										</button>
									</div>
								) : (
									// 편집 모드
									<div>
										<div className="relative">
											<input
												type="text"
												value={tempOneLineProfile}
												onChange={onOneLineChange}
												placeholder="띄어쓰기 포함 20자 이내로 입력해주세요."
												aria-label="한 줄 프로필"
												maxLength={MAX20}
												className="w-full h-[48px] md:h-[55px] py-0 leading-[48px] md:leading-[55px] rounded-[10px] border border-[#E5E7EB] dark:border-[var(--border-color)] px-3 outline-none text-[14px] tracking-[0.01em] placeholder-[#ADADAD] dark:bg-[var(--surface)] dark:text-white focus:border-[#068334] focus:ring-2 focus:ring-[#068334]/10"
											/>
											<Counter value={tempOneLineProfile.length} />
										</div>
										<div className="mt-3 flex justify-end gap-2">
											<button
												type="button"
												onClick={handleCancelOneLineProfileEdit}
												className="px-4 h-[36px] rounded-[10px] text-[14px] border border-[#E5E7EB] dark:border-[var(--border-color)] bg-white dark:bg-[var(--surface)] text-[#111827] dark:text-white hover:bg-[#F9FAFB] dark:hover:bg-[#111111] transition-colors"
											>
												취소
											</button>
											<button
												type="button"
												onClick={handleSaveOneLineProfile}
												disabled={tempOneLineProfile.trim() === oneLineProfile}
												className={`px-4 h-[36px] rounded-[10px] text-[14px] transition-colors ${
													tempOneLineProfile.trim() !== oneLineProfile
														? "bg-[#21B284] text-white hover:bg-[#1a9a73]" 
														: "bg-[#E5E7EB] text-[#111827] cursor-not-allowed"
												}`}
											>
												저장
											</button>
										</div>
									</div>
								)}
							</div>

							{/* 작업 분야 */}
							<div className="mb-2 flex items-center justify-between">
								<FieldLabel>작업 분야</FieldLabel>
								<button onClick={onOpenWorkModal} aria-label="작업 분야 설정" className="text-[13px] text-[#068334] hover:underline">작업 분야 설정</button>
							</div>
                            <div className={`text-[13px] mb-7 ${workFields.length === 0 ? "text-[#ADADAD]" : "text-black dark:text-white"}`}>
								{workFields.length === 0 ? "선택된 작업 분야가 없습니다." : workFields.join(", ")}
							</div>

							{/* 관심 분야 */}
							<div className="mb-2 flex items-center justify-between">
								<FieldLabel>관심 분야</FieldLabel>
								<button onClick={onOpenInterestModal} aria-label="관심 분야 설정" className="text-[13px] text-[#068334] hover:underline">관심 분야 설정</button>
							</div>
                            <div className={`text-[13px] mb-7 ${interestFields.length === 0 ? "text-[#ADADAD]" : "text-black dark:text-white"}`}>
								{interestFields.length === 0 ? "선택된 관심 분야가 없습니다." : interestFields.join(", ")}
														</div>


							{/* 소개 (편집 모드) */}
							<div className="mt-8 mb-3">
								<FieldLabel>소개</FieldLabel>
							</div>
							
							{!isEditingBio ? (
								// 읽기 모드
								<div className="flex items-start justify-between">
									<div className="flex-1 min-h-[120px] rounded-[10px] border border-[#E5E7EB] dark:border-[var(--border-color)] p-3 text-[14px] bg-[#F9FAFB] dark:bg-[var(--surface)] text-[#111827] dark:text-white whitespace-pre-wrap">
										{bio || "소개를 입력해주세요"}
									</div>
									<button
										type="button"
										onClick={handleEditBio}
										className="ml-3 px-4 h-[48px] md:h-[55px] rounded-[10px] text-[14px] bg-[#21B284] text-white hover:bg-[#1a9a73] transition-colors"
									>
										수정
									</button>
								</div>
							) : (
								// 편집 모드
								<div>
                            <textarea
										value={tempBio}
										onChange={(e) => setTempBio(e.target.value)}
								rows={5}
								placeholder="예) 프론트와 백엔드에 관심이 있는 개발자입니다."
								aria-label="소개"
                                className="w-full rounded-[10px] border border-[#E5E7EB] dark:border-[var(--border-color)] p-3 outline-none text-[14px] placeholder-[#ADADAD] dark:bg-[var(--surface)] dark:text-white focus:border-[#068334] focus:ring-2 focus:ring-[#068334]/10"
							/>
									<div className="mt-3 flex justify-end gap-2">
										<button
											type="button"
											onClick={handleCancelBioEdit}
											className="px-4 h-[36px] rounded-[10px] text-[14px] border border-[#E5E7EB] dark:border-[var(--border-color)] bg-white dark:bg-[var(--surface)] text-[#111827] dark:text-white hover:bg-[#F9FAFB] dark:hover:bg-[#111111] transition-colors"
										>
											취소
										</button>
										<button
											type="button"
											onClick={handleSaveBio}
											disabled={!tempBio.trim() || tempBio.trim() === bio}
											className={`px-4 h-[36px] rounded-[10px] text-[14px] transition-colors ${
												tempBio.trim() && tempBio.trim() !== bio
													? "bg-[#21B284] text-white hover:bg-[#1a9a73]" 
													: "bg-[#E5E7EB] text-[#111827] cursor-not-allowed"
											}`}
										>
											저장
										</button>
									</div>
								</div>
							)}
						</section>

					</main>
				</div>

				{/* 작업 분야 모달 */}
				<WorkFieldModal open={showWorkModal} initial={workFields as any} onClose={()=>setShowWorkModal(false)} onConfirm={(vals)=>onConfirmWorkFields(vals as any)} />
				{/* 관심 분야 모달 */}
				<InterestFieldModal open={showInterestModal} initial={interestFields as any} onClose={()=>setShowInterestModal(false)} onConfirm={(vals)=>onConfirmInterestFields(vals as any)} />

			</div>
		</div>
		</>
	);
};

export default MyPageSettingPage;