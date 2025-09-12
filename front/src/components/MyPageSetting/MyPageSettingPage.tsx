import React, { useMemo, useState, useContext, useRef, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import { HiOutlineArrowUpTray, HiCheckCircle } from "react-icons/hi2";
import Sidebar from "./Sidebar";
import { UserApi, UserProfileResponse } from "../../api/userApi";
import WorkFieldModal from "./WorkFieldModal";
import InterestFieldModal from "./InterestFieldModal";
import SkillFieldModal from "./SkillFieldModal";
import { positionMap, interestMap } from "../../constants/position";

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
	const scopedKey = (key: string) => (email ? `${key}:${email}` : key);
	const initialLetter = useMemo(() => {
		if (!email || email.length === 0) return "H";
		const ch = email.trim()[0];
		return ch ? ch.toUpperCase() : "H";
	}, [email]);

	const [userName, setUserName] = useState("");
	const [urlSlug, setUrlSlug] = useState("");
	const [oneLineProfile, setOneLineProfile] = useState("");
	const [nickname, setNickname] = useState(""); // 커뮤니티 닉네임(로컬 저장)
	const [bio, setBio] = useState("");
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// 서버 프로필 상태
	const [profile, setProfile] = useState<UserProfileResponse | null>(null);

	// 배너/검증 상태
	const [showSavedBanner, setShowSavedBanner] = useState(false);
	const [userNameError, setUserNameError] = useState<string | null>(null);
	const userReqSeqRef = useRef(0); // 최신 요청 시퀀스

	// 최신 값 Refs
	const userNameRef = useRef("");
	useEffect(() => { userNameRef.current = userName; }, [userName]);
	const communityNickRef = useRef("");
	useEffect(() => { communityNickRef.current = nickname; }, [nickname]);
	const bioRef = useRef("");
	useEffect(() => { bioRef.current = bio; }, [bio]);
	const slugRef = useRef("");
	useEffect(() => { slugRef.current = urlSlug; }, [urlSlug]);
	const oneLineRef = useRef("");
	useEffect(() => { oneLineRef.current = oneLineProfile; }, [oneLineProfile]);

	// 필수 항목 입력 상태
	const isUserNameEmpty = userName.trim().length === 0;
	const isCommunityEmpty = nickname.trim().length === 0;

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

	// 초기 프로필 로드 + 로컬 초기값 세팅
	useEffect(() => {
		(async () => {
			try {
				const me = await UserApi.getMe();
				setProfile(me);
				setUserName(me.nickname || "");
				setBio(me.bio || "");
				setAvatarUrl(me.profileImage || null);
				// 서버 저장값으로 작업/관심/기술 초기화
				const serverWork = me.position?.name ? [me.position.name] : [];
				setWorkFields(serverWork);
				try { localStorage.setItem("workFields", JSON.stringify(serverWork)); sessionStorage.setItem("workFields", JSON.stringify(serverWork)); } catch {}
				const serverInterests = Array.isArray(me.interests) ? me.interests.map((i)=>i.name) : [];
				setInterestFields(serverInterests);
				try { localStorage.setItem("interestFields", JSON.stringify(serverInterests)); sessionStorage.setItem("interestFields", JSON.stringify(serverInterests)); } catch {}
				const serverSkills = (me.skills || "").split(",").map(s=>s.trim()).filter(Boolean);
				setSkillFields(serverSkills);
				try { localStorage.setItem("skillFields", JSON.stringify(serverSkills)); sessionStorage.setItem("skillFields", JSON.stringify(serverSkills)); } catch {}
				// 커뮤니티 닉네임/한 줄 프로필을 사용자별 스코프로 초기화
				const storedComm = localStorage.getItem(scopedKey("communityNickname")) || sessionStorage.getItem(scopedKey("communityNickname"));
				setNickname((storedComm || me.nickname || "").slice(0, MAX20));
				setUrlSlug((localStorage.getItem("profileUrlSlug") || sessionStorage.getItem("profileUrlSlug") || "").slice(0, MAX20));
				setOneLineProfile((localStorage.getItem(scopedKey("profileOneLine")) || sessionStorage.getItem(scopedKey("profileOneLine")) || "").slice(0, MAX20));
			} catch {}
		})();
	}, [email]);

	const onOpenWorkModal = () => setShowWorkModal(true);
	const onOpenSkillModal = () => setShowSkillModal(true);
	const onOpenInterestModal = () => setShowInterestModal(true);

	const handleUploadClick = () => fileInputRef.current?.click();
	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			alert("이미지 파일만 업로드할 수 있습니다.");
			e.target.value = "";
			return;
		}
		if (file.size > MAX_FILE_MB * 1024 * 1024) {
			alert(`파일 용량은 ${MAX_FILE_MB}MB 이하여야 합니다.`);
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
			alert("이미지 업로드에 실패했습니다. 잠시 후 다시 시도해주세요.");
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
	const persistProfilePartial = async (partial: Partial<{ nickname: string; bio: string; skills: string; github: string; linkedin: string; profileImageUrl: string | null; positionId: number; interestIds: number[] }>) => {
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
		setShowSavedBanner(true);
		window.setTimeout(() => setShowSavedBanner(false), 3000);
		return true;
	};

	// 사용자 이름 검사 + 저장 (항상 DB로 검사, 최신 요청만 반영)
	const checkAndSaveUserName = async (value: string) => {
		const trimmed = value.trim();
		if (!trimmed) return false;
		const mySeq = ++userReqSeqRef.current;
		const res = await UserApi.checkNickname(trimmed);
		if (mySeq !== userReqSeqRef.current) return false;
		if (res.exists && profile && trimmed !== (profile.nickname || "")) {
			setUserNameError("이미 사용 중인 닉네임입니다.");
			return false;
		}
		if (profile && trimmed === (profile.nickname || "")) { setUserNameError(null); return false; }
		const ok = await persistProfilePartial({ nickname: trimmed });
		if (ok && mySeq === userReqSeqRef.current) {
			setUserNameError(null);
			try { localStorage.setItem("userNickname", trimmed); sessionStorage.setItem("userNickname", trimmed); } catch {}
			window.dispatchEvent(new Event("user-nickname-updated"));
		}
		return ok;
	};

	// bio 저장(값이 달라졌을 때만)
	const checkAndSaveBio = async (value: string) => {
		const trimmed = value.trim();
		if (!profile) return false;
		if ((profile.bio || "") === trimmed) return false;
		return persistProfilePartial({ bio: trimmed });
	};

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
				const comm = communityNickRef.current.trim();
				const prevComm = localStorage.getItem(scopedKey("communityNickname")) || sessionStorage.getItem(scopedKey("communityNickname")) || "";
				if (comm !== prevComm) {
					localStorage.setItem(scopedKey("communityNickname"), comm);
					sessionStorage.setItem(scopedKey("communityNickname"), comm);
					localChanged = true;
				}
				const slug = slugRef.current.trim();
				const prevSlug = localStorage.getItem("profileUrlSlug") || sessionStorage.getItem("profileUrlSlug") || "";
				if (slug !== prevSlug) {
					localStorage.setItem("profileUrlSlug", slug);
					sessionStorage.setItem("profileUrlSlug", slug);
					localChanged = true;
				}
				const one = oneLineRef.current.trim();
				const prevOne = localStorage.getItem(scopedKey("profileOneLine")) || sessionStorage.getItem(scopedKey("profileOneLine")) || "";
				if (one !== prevOne) {
					localStorage.setItem(scopedKey("profileOneLine"), one);
					sessionStorage.setItem(scopedKey("profileOneLine"), one);
					localChanged = true;
				}
				if (localChanged) {
					setShowSavedBanner(true);
					window.setTimeout(() => setShowSavedBanner(false), 3000);
				}
			} catch {}
		};
		document.addEventListener("mousedown", handleMouseDown, true);
		return () => document.removeEventListener("mousedown", handleMouseDown, true);
	}, [profile, email]);

	// 입력 변경 핸들러들
	const onNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => setNickname(e.target.value.slice(0, MAX20));
	const onSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => setUrlSlug(e.target.value.slice(0, MAX20));
	const onOneLineChange = (e: React.ChangeEvent<HTMLInputElement>) => setOneLineProfile(e.target.value.slice(0, MAX20));
	const onBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => setBio(e.target.value);

	const onConfirmWorkFields = async (values: string[]) => {
		setWorkFields(values);
		try {
			localStorage.setItem("workFields", JSON.stringify(values));
			sessionStorage.setItem("workFields", JSON.stringify(values));
		} catch {}
		const posId = mapWorkNameToId(values[0]);
		await persistProfilePartial({ positionId: posId });
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
		<div className="min-h-screen font-gmarket pt-5 bg-[#F5F7FA] text-black">
			<div className="mx-auto max-w-[1400px] px-4 md:px-6">
				{/* 저장 배너 */}
				{showSavedBanner && (
					<div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 rounded-full bg-black text-white text-[13px] px-3 py-1.5 shadow-lg flex items-center gap-2">
						<HiCheckCircle className="text-[#22C55E] w-4 h-4" />
						설정 내용이 저장되었습니다.
					</div>
				)}
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
											×
										</button>
									)}
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

							{/* 사용자 이름 (서버 닉네임) */}
							<div className="mb-7">
								<FieldLabel>
									<span className="inline-flex items-center gap-1">
										사용자 이름 <span className="text-green-500">*</span>
									</span>
								</FieldLabel>
								<div className="relative">
									<input
										type="text"
										value={userName}
										onChange={(e)=>{ setUserName(e.target.value.slice(0, MAX20)); setUserNameError(null); }}
										className={`w-full h-[55px] py-0 leading-[55px] rounded-[10px] border px-3 outline-none text-[14px] tracking-[0.01em] focus:border-[#068334] focus:ring-2 focus:ring-[#068334]/10 ${isUserNameEmpty ? "border-[#DB2E2E]" : "border-[#E5E7EB]"}`}
									/>
									<Counter value={userName.length} />
								</div>
								{isUserNameEmpty && (
									<p className="mt-2 text-[12px] text-[#DB2E2E]">필수 항목입니다.</p>
								)}
								{userNameError ? (
									<p className="mt-2 text-[12px] text-[#DB2E2E]">{userNameError}</p>
								) : null}
							</div>

							{/* 샌드위치 URL */}
							<div className="mb-7">
								<FieldLabel>샌드위치 URL</FieldLabel>
								<div className="flex rounded-[10px] border border-[#E5E7EB] overflow-hidden h-[55px]">
									<div className="px-4 flex items-center text-[14px] text-[#6B7280] bg-[#F3F4F6] border-r border-[#E5E7EB] whitespace-nowrap">sandwich.com/</div>
									<input
										type="text"
										value={urlSlug}
										onChange={onSlugChange}
										className="flex-1 h-[55px] py-0 leading-[55px] px-3 outline-none text-[14px] tracking-[0.01em] focus:border-[#068334] focus:ring-2 focus:ring-[#068334]/10"
									/>
								</div>
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

							{/* 커뮤니티 닉네임 (가입 닉네임 기본값, 로컬 저장) */}
							<div className="mb-7">
								<FieldLabel>커뮤니티 닉네임</FieldLabel>
								<div className="relative">
									<input
										type="text"
										value={nickname}
										onChange={onNicknameChange}
										className={`w-full h-[55px] py-0 leading-[55px] rounded-[10px] border px-3 outline-none text-[14px] tracking-[0.01em] focus:border-[#068334] focus:ring-2 focus:ring-[#068334]/10 ${isCommunityEmpty ? "border-[#DB2E2E]" : "border-[#E5E7EB]"}`}
									/>
									{isCommunityEmpty && (
										<p className="mt-2 text-[12px] text-[#DB2E2E]">필수 항목입니다.</p>
									)}
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
	);
};

export default MyPageSettingPage;