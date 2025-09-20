import React, { useMemo, useState, useContext, useRef, useEffect, useCallback } from "react";
import { AuthContext } from "../../context/AuthContext";
import { HiOutlineArrowUpTray } from "react-icons/hi2";
import Sidebar from "./Sidebar";
import { UserApi, UserProfileResponse } from "../../api/userApi";
import WorkFieldModal from "./WorkFieldModal";
import InterestFieldModal from "./InterestFieldModal";
import SkillFieldModal from "./SkillFieldModal";
import { positionMap, interestMap } from "../../constants/position";
import Toast from "../common/Toast";

const MAX20 = 20;
const MAX_FILE_MB = 10;

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
	<div className="text-[14px] text-[#6B7280] mb-2 tracking-[0.01em] leading-[1.7]">{children}</div>
);

const Counter: React.FC<{ value: number; max?: number }> = ({ value, max = MAX20 }) => (
	<span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[#9CA3AF]">{value}/{max}</span>
);

const MyPageSettingPage: React.FC = () => {
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
	const [userInitialized, setUserInitialized] = useState<boolean>(() => readStoredNickname().length > 0);
	const [urlSlug, setUrlSlug] = useState<string>(() => { try { return localStorage.getItem("profileUrlSlug") || sessionStorage.getItem("profileUrlSlug") || ""; } catch { return ""; } });
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

	// 필수 항목 입력 상태
	const isUserNameEmpty = userName.trim().length === 0;

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
	const [showSkillModal, setShowSkillModal] = useState(false);
	const [skillFields, setSkillFields] = useState<string[]>(() => {
		const raw = localStorage.getItem("skillFields") || sessionStorage.getItem("skillFields");
		try { return raw ? JSON.parse(raw) : []; } catch { return []; }
	});

	// 읽기 전용 사용자 이름 표시값: 서버값 > 스토리지 > 로컬 슬러그
	const usernameDisplay = useMemo(() => {
		const server = profile?.username?.trim();
		if (server) return server;
		try {
			const stored = (localStorage.getItem("userUsername") || sessionStorage.getItem("userUsername") || "").trim();
			if (stored) return stored;
		} catch {}
		return (urlSlug || "").trim();
	}, [profile?.username, urlSlug]);

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
				setUserInitialized(true);
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
				const serverSkills = (me.skills || "").split(",").map(s=>s.trim()).filter(Boolean);
				setSkillFields(serverSkills);
				try { localStorage.setItem("skillFields", JSON.stringify(serverSkills)); sessionStorage.setItem("skillFields", JSON.stringify(serverSkills)); } catch {}
				// 한 줄 프로필 및 URL 슬러그 초기화
				const storedOneLine = (localStorage.getItem(scopedKey("profileOneLine")) || sessionStorage.getItem(scopedKey("profileOneLine")) || "").slice(0, MAX20);
				if (storedOneLine !== oneLineProfile) setOneLineProfile(storedOneLine);
				const storedSlug = (localStorage.getItem("profileUrlSlug") || sessionStorage.getItem("profileUrlSlug") || me.username || "");
				setUrlSlug(storedSlug);
			} catch {}
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [email, scopedKey]);

	const onOpenWorkModal = () => setShowWorkModal(true);
	const onOpenSkillModal = () => setShowSkillModal(true);
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
			await persistProfilePartial({ profileImageUrl: null as any }); // 먼저 비워 flicker 방지
			await persistProfilePartial({ profileImageUrl: url });
			setAvatarUrl(url);
			e.target.value = "";
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
	const persistProfilePartial = useCallback(async (partial: Partial<{ nickname: string; bio: string; skills: string; github: string; linkedin: string; profileImageUrl: string | null; positionId: number; interestIds: number[] }>) => {
		const base = profile;
		if (!base) return false;
		await UserApi.updateProfile({
			nickname: partial.nickname ?? (base.nickname || ""),
			positionId: partial.positionId ?? (base.position?.id || 0),
			interestIds: partial.interestIds ?? (base.interests?.map((i) => i.id) || []),
			bio: partial.bio ?? (base.bio || ""),
			skills: partial.skills ?? (base.skills || ""),
			github: partial.github ?? (base.github || ""),
			linkedin: partial.linkedin ?? (base.linkedin || ""),
			profileImageUrl: (partial.profileImageUrl !== undefined) ? partial.profileImageUrl : (base.profileImage || ""),
		});
		const refreshed = await UserApi.getMe();
		setProfile(refreshed);
		setSuccessToast({
			visible: true,
			message: "설정 내용이 저장되었습니다."
		});
		return true;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

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
				});
			}
			const refreshed = await UserApi.getMe();
			setProfile(refreshed);
			setUserNameError(null);
			try { localStorage.setItem("userNickname", trimmed); sessionStorage.setItem("userNickname", trimmed); } catch {}
			window.dispatchEvent(new Event("user-nickname-updated"));
			setSuccessToast({
				visible: true,
				message: "설정 내용이 저장되었습니다."
			});
			return true;
		} catch {
			return false;
		}
	}, [profile]);

	// bio 저장(값이 달라졌을 때만)
	const checkAndSaveBio = useCallback(async (value: string) => {
		const trimmed = value.trim();
		if (!profile) return false;
		if ((profile.bio || "") === trimmed) return false;
		return persistProfilePartial({ bio: trimmed });
	}, [profile, persistProfilePartial]);

	// 헬퍼: 이름→ID 매핑
	const mapWorkNameToId = (name: string | undefined): number => {
		if (!name) return profile?.position?.id || 0;
		return positionMap[name] ?? profile?.position?.id ?? 0;
	};
	const mapInterestNamesToIds = (names: string[]): number[] => {
		const dynamic: Record<string, number> = {};
		(profile?.interests || []).forEach((i) => { dynamic[i.name] = i.id; });
		return names.map((n) => dynamic[n] ?? interestMap[n]).filter((v): v is number => typeof v === "number");
	};

	// 닉네임 실시간(디바운스) 중복 검사
	useEffect(() => {
		const current = userName.trim();
		if (!current) { setUserNameError(null); return; }
		const mySeq = ++userReqSeqRef.current;
		const handle = window.setTimeout(async () => {
			try {
				const isDuplicate = await UserApi.checkNickname(current);
				if (mySeq !== userReqSeqRef.current) return;
				if (isDuplicate && current !== (profile?.nickname || "")) {
					setUserNameError("이미 사용 중인 닉네임입니다.");
				} else {
					setUserNameError(null);
				}
			} catch {}
		}, 400);
		return () => window.clearTimeout(handle);
	}, [userName, profile?.nickname]);

	// 샌드위치 URL 슬러그 실시간(디바운스) 중복/유효성 검사
	const [slugError, setSlugError] = useState<string | null>(null);
	const slugReqSeqRef = useRef(0);
	const [slugInitialized, setSlugInitialized] = useState(false);
	useEffect(() => {
		const current = urlSlug.trim();
		if (!current) { setSlugError("필수 항목입니다."); return; }
		if (!/^[a-z0-9_]{3,20}$/.test(current)) { setSlugError("소문자/숫자/언더스코어만 사용 (3~20자)"); return; }
		// 사용자가 이전에 유효성 통과 후 저장한 값이라면(로컬 플래그), 서버 체크를 생략하고 에러를 숨깁니다.
		try {
			const verified = localStorage.getItem("profileUrlSlugVerified") === "1" || sessionStorage.getItem("profileUrlSlugVerified") === "1";
			if (verified) { setSlugError(null); setSlugInitialized(true); return; }
		} catch {}
		const mySeq = ++slugReqSeqRef.current;
		const handle = window.setTimeout(async () => {
			try {
				const res = await UserApi.checkUsername(current);
				if (mySeq !== slugReqSeqRef.current) return;
				// 현재 서버 username 과 동일한 값은 사용 가능
				if (res.exists && current !== (profile?.username || "")) {
					setSlugError("이미 사용 중인 주소입니다.");
					setSlugInitialized(true);
					return;
				}
				setSlugError(null);
				// 자동 저장: 유효하고 중복 아님 → 로컬 저장
				const prevSlug = localStorage.getItem("profileUrlSlug") || sessionStorage.getItem("profileUrlSlug") || "";
				if (current !== prevSlug) {
					localStorage.setItem("profileUrlSlug", current);
					sessionStorage.setItem("profileUrlSlug", current);
					localStorage.setItem("profileUrlSlugVerified", "1");
					sessionStorage.setItem("profileUrlSlugVerified", "1");
					setSuccessToast({
						visible: true,
						message: "설정 내용이 저장되었습니다."
					});
				}
				setSlugInitialized(true);
			} catch {}
		}, 400);
		return () => window.clearTimeout(handle);
	}, [urlSlug, profile?.username]);

	// blur 시 즉시 저장
	const saveSlugIfValid = () => {
		const slug = urlSlug.trim();
		if (!/^[a-z0-9_]{3,20}$/.test(slug)) return;
		const prev = localStorage.getItem("profileUrlSlug") || sessionStorage.getItem("profileUrlSlug") || "";
		if (slug !== prev) {
			try {
				localStorage.setItem("profileUrlSlug", slug);
				sessionStorage.setItem("profileUrlSlug", slug);
				localStorage.setItem("profileUrlSlugVerified", "1");
				sessionStorage.setItem("profileUrlSlugVerified", "1");
			} catch {}
			// 즉시 에러 해제 및 대기 중 검사 무효화
			setSlugError(null);
			slugReqSeqRef.current++;
			setSuccessToast({
				visible: true,
				message: "설정 내용이 저장되었습니다."
			});
		}
	};

	// 마우스 클릭 시(포커스 유지와 무관) 즉시 저장
	useEffect(() => {
		const handleMouseDown = () => {
			const currentName = userNameRef.current;
			if (currentName) checkAndSaveUserName(currentName).catch(() => {});
			// bio 저장
			checkAndSaveBio(bioRef.current).catch(() => {});
			// 로컬 저장 변경 시 배너
			try {
				let localChanged = false;
				const one = oneLineRef.current.trim();
				const prevOne = localStorage.getItem(scopedKey("profileOneLine")) || sessionStorage.getItem(scopedKey("profileOneLine")) || "";
				if (one !== prevOne) {
					localStorage.setItem(scopedKey("profileOneLine"), one);
					sessionStorage.setItem(scopedKey("profileOneLine"), one);
					localChanged = true;
				}
									// URL 슬러그 저장
					const slug = slugRef.current.trim();
					const prevSlug = localStorage.getItem("profileUrlSlug") || sessionStorage.getItem("profileUrlSlug") || "";
					if (slug && slug !== prevSlug && /^[a-z0-9_]{3,20}$/.test(slug)) {
						localStorage.setItem("profileUrlSlug", slug);
						sessionStorage.setItem("profileUrlSlug", slug);
						// 즉시 에러 해제 및 대기 중 검사 무효화
						setSlugError(null);
						slugReqSeqRef.current++;
						localStorage.setItem("profileUrlSlugVerified", "1");
						sessionStorage.setItem("profileUrlSlugVerified", "1");
						localChanged = true;
					}
				if (localChanged) {
					setSuccessToast({
						visible: true,
						message: "설정 내용이 저장되었습니다."
					});
					try { window.dispatchEvent(new Event("profile-one-line-updated")); } catch {}
				}
			} catch {}
		};
		document.addEventListener("mousedown", handleMouseDown, true);
		return () => document.removeEventListener("mousedown", handleMouseDown, true);
	}, [profile, email, slugError, checkAndSaveBio, checkAndSaveUserName, scopedKey]);

	// 입력 변경 핸들러들
	const onOneLineChange = (e: React.ChangeEvent<HTMLInputElement>) => setOneLineProfile(e.target.value.slice(0, MAX20));
	const onBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => setBio(e.target.value);
	const onSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => setUrlSlug(e.target.value);

	const onConfirmWorkFields = async (values: string[]) => {
		setWorkFields(values);
		try {
			localStorage.setItem("workFields", JSON.stringify(values));
			sessionStorage.setItem("workFields", JSON.stringify(values));
		} catch {}
		// 값이 없으면 서버 업데이트 생략
		if (values.length > 0) {
			const posId = mapWorkNameToId(values[0]);
			await persistProfilePartial({ positionId: posId });
		} else {
			// 로컬만 변경된 경우에도 사용자 피드백 제공
			setSuccessToast({
				visible: true,
				message: "설정 내용이 저장되었습니다."
			});
		}
		setShowWorkModal(false);
	};
	const onConfirmInterestFields = async (values: string[]) => {
		setInterestFields(values);
		try {
			localStorage.setItem("interestFields", JSON.stringify(values));
			sessionStorage.setItem("interestFields", JSON.stringify(values));
		} catch {}
		const ids = mapInterestNamesToIds(values);
		await persistProfilePartial({ interestIds: ids });
		setShowInterestModal(false);
	};
	const onConfirmSkillFields = async (values: string[]) => {
		setSkillFields(values);
		try {
			localStorage.setItem("skillFields", JSON.stringify(values));
			sessionStorage.setItem("skillFields", JSON.stringify(values));
		} catch {}
		await persistProfilePartial({ skills: values.join(", ") });
		setShowSkillModal(false);
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
			<div className="min-h-screen font-gmarket pt-5 bg-[#F5F7FA] text-black">
			<div className="mx-auto max-w-[1400px] px-4 md:px-6">
				<div className="flex gap-6">
					{/* 좌측 사이드 카드 */}
					<aside className="w-[320px] shrink-0">
						<Sidebar />
					</aside>

					{/* 우측 콘텐츠 */}
					<main className="flex-1 space-y-0">
						{/* 기본 정보 카드 */}
						<section className="bg-white border border-[#E5E7EB] rounded-xl p-6 pb-20 box-border w/full max-w-[1400px] mx-auto">
							<div className="text-[16px] font-medium text-[#111827] mb-6">기본 정보</div>

							{/* 프로필 + 업로드 */}
							<div className="flex items-center gap-6 mb-6">
								<div className="w-[120px] flex flex-col items-center">
									<div className="relative w-[100px] h-[100px] group">
										<div className="w-full h-full rounded-full bg-[#F3F4F6] text-black flex items-center justify-center text-[28px] overflow-hidden">
											{avatarUrl ? (
												<img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
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
									<button type="button" onClick={handleUploadClick} className="h-[36px] px-4 rounded-full border text-[13px] flex items-center gap-2 border-green-500 text-green-500 hover:bg-green-50 w-fit">
										<HiOutlineArrowUpTray className="w-4 h-4" />
										<span>프로필 사진 업로드</span>
									</button>
									<input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
									<p className="mt-3 text-[13px] text-[#6B7280]">10MB 이내의 이미지 파일을 업로드 해주세요.</p>
								</div>
							</div>

							{/* 닉네임 (서버 닉네임) */}
							<div className="mb-7">
								<FieldLabel>
									<span className="inline-flex items-center gap-1">
										닉네임 <span className="text-green-500">*</span>
									</span>
								</FieldLabel>
								<div className="relative">
															<input
							type="text"
							value={userName}
							onChange={(e)=>{ setUserName(e.target.value.slice(0, MAX20)); setUserNameError(null); }}
							onBlur={() => { const v = userNameRef.current.trim(); if (v) checkAndSaveUserName(v); }}
							className={`w-full h-[55px] py-0 leading-[55px] rounded-[10px] border px-3 outline-none text-[14px] tracking-[0.01em] focus:border-[#068334] focus:ring-2 focus:ring-[#068334]/10 ${(userInitialized && isUserNameEmpty) ? "border-[#DB2E2E]" : "border-[#E5E7EB]"}`}
						/>
									<Counter value={userName.length} />
								</div>
								{userInitialized && isUserNameEmpty && (
									<p className="mt-2 text-[12px] text-[#DB2E2E]">필수 항목입니다.</p>
								)}
								{userInitialized && userNameError ? (
									<p className="mt-2 text-[12px] text-[#DB2E2E]">{userNameError}</p>
								) : null}
							</div>

							{/* 사용자 이름 (읽기 전용) */}
							<div className="mb-7">
								<FieldLabel>사용자 이름</FieldLabel>
								<div className="relative">
									<input
										type="text"
										value={usernameDisplay}
										readOnly
										disabled
										className="w-full h-[55px] py-0 leading-[55px] rounded-[10px] border border-[#E5E7EB] px-3 outline-none text-[14px] tracking-[0.01em] bg-[#F9FAFB] text-[#6B7280]"
									/>
								</div>
							</div>

							{/* 샌드위치 URL (뒷부분 슬러그 편집) */}
							<div className="mb-7">
								<FieldLabel>샌드위치 URL</FieldLabel>
								<div className={`flex rounded-[10px] overflow-hidden h-[55px] border ${slugInitialized && slugError ? "border-[#DB2E2E]" : "border-[#E5E7EB]"}`}>
									<div className="px-4 flex items-center text-[14px] text-[#6B7280] bg-[#F3F4F6] border-r border-[#E5E7EB] whitespace-nowrap">sandwich.com/</div>
									<input
										type="text"
										value={urlSlug}
										onChange={onSlugChange}
										onBlur={async ()=>{
											saveSlugIfValid();
											const slug = urlSlug.trim();
											if (/^[a-z0-9_]{3,20}$/.test(slug)) {
												try {
													const res = await UserApi.checkUsername(slug);
													if (!res.exists || slug === (profile?.username || "")) {
														await UserApi.updateUsername(slug);
														const refreshed = await UserApi.getMe();
														setProfile(refreshed);
														try { localStorage.setItem("userUsername", slug); sessionStorage.setItem("userUsername", slug); } catch {}
														setSuccessToast({
															visible: true,
															message: "설정 내용이 저장되었습니다."
														});
													} else {
														setSlugError("이미 사용 중인 주소입니다.");
													}
												} catch {}
											}
										}}
										placeholder="URL 입력란"
										pattern="^[a-z0-9_]{3,20}$"
										title="소문자/숫자/언더스코어만 입력 가능합니다 (3~20자)"
										className={`flex-1 h-[55px] py-0 leading-[55px] px-3 outline-none text-[14px] tracking-[0.01em] bg-white`}
									/>
								</div>
								{slugInitialized && slugError && (
									<p className="mt-2 text-[12px] text-[#DB2E2E]">{slugError}</p>
								)}
							</div>

							{/* 한 줄 프로필 */}
							<div className="mb-7">
								<FieldLabel>한 줄 프로필</FieldLabel>
								<div className="relative">
									<input
										type="text"
										value={oneLineProfile}
										onChange={onOneLineChange}
										placeholder="띄어쓰기 포함 20자 이내로 입력해주세요."
										className="w-full h-[55px] py-0 leading-[55px] rounded-[10px] border border-[#E5E7EB] px-3 outline-none text-[14px] tracking-[0.01em] placeholder-[#ADADAD] focus:border-[#068334] focus:ring-2 focus:ring-[#068334]/10"
									/>
									<Counter value={oneLineProfile.length} />
								</div>
							</div>

							{/* 작업 분야 */}
							<div className="mb-2 flex items-center justify-between">
								<FieldLabel>작업 분야</FieldLabel>
								<button onClick={onOpenWorkModal} className="text-[13px] text-[#068334] hover:underline">작업 분야 설정</button>
							</div>
							<div className={`text-[13px] mb-7 ${workFields.length === 0 ? "text-[#ADADAD]" : "text-black"}`}>
								{workFields.length === 0 ? "선택된 작업 분야가 없습니다." : workFields.join(", ")}
							</div>

							{/* 관심 분야 */}
							<div className="mb-2 flex items-center justify-between">
								<FieldLabel>관심 분야</FieldLabel>
								<button onClick={onOpenInterestModal} className="text-[13px] text-[#068334] hover:underline">관심 분야 설정</button>
							</div>
							<div className={`text-[13px] mb-7 ${interestFields.length === 0 ? "text-[#ADADAD]" : "text-black"}`}>
								{interestFields.length === 0 ? "선택된 관심 분야가 없습니다." : interestFields.join(", ")}
							</div>

							{/* 지식/기술 */}
							<div className="mt-0 mb-2 flex items-center justify-between">
								<FieldLabel>지식/기술</FieldLabel>
								<button onClick={onOpenSkillModal} className="text-[13px] text-[#068334] hover:underline">지식/기술 설정</button>
							</div>
							<div className={`text-[13px] ${skillFields.length === 0 ? "text-[#ADADAD]" : "text-black"}`}>{skillFields.length === 0 ? "선택된 지식/기술이 없습니다." : skillFields.join(", ")}</div>

							<div className="mt-8 mb-3"><FieldLabel>소개</FieldLabel></div>
							<textarea
								value={bio}
								onChange={onBioChange}
								rows={5}
								placeholder="예) 프론트와 백엔드에 관심이 있는 개발자입니다."
								className="w-full rounded-[10px] border border-[#E5E7EB] p-3 outline-none text-[14px] placeholder-[#ADADAD] focus:border-[#068334] focus:ring-2 focus:ring-[#068334]/10"
							/>
						</section>

					</main>
				</div>

				{/* 작업 분야 모달 */}
				<WorkFieldModal open={showWorkModal} initial={workFields as any} onClose={()=>setShowWorkModal(false)} onConfirm={(vals)=>onConfirmWorkFields(vals as any)} />
				{/* 관심 분야 모달 */}
				<InterestFieldModal open={showInterestModal} initial={interestFields as any} onClose={()=>setShowInterestModal(false)} onConfirm={(vals)=>onConfirmInterestFields(vals as any)} />
				{/* 지식/기술 모달 */}
				<SkillFieldModal open={showSkillModal} initial={skillFields as any} onClose={()=>setShowSkillModal(false)} onConfirm={(vals)=>onConfirmSkillFields(vals as any)} />
			</div>
		</div>
		</>
	);
};

export default MyPageSettingPage;