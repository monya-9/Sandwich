import React, { useEffect, useState, useContext } from "react";
import { FiPlus } from "react-icons/fi";
import { UserApi, type UserProfileResponse, type RepresentativeCareer } from "../../api/userApi";
import { Link, useLocation } from "react-router-dom";
import WorkTab from "./WorkTab";
import LikesTab from "./LikesTab";
import CollectionsTab from "./CollectionsTab";
import DraftsTab from "./DraftsTab";
import CreditWallet from "./CreditWallet";
import { CareerProjectApi } from "../../api/careerProjectApi";
import { CareerApi } from "../../api/careerApi";
import { EducationApi } from "../../api/educationApi";
import { AwardApi } from "../../api/awardApi";
import { AuthContext } from "../../context/AuthContext";
import { fetchUserProjects, fetchProjectsMeta } from "../../api/projects";
import api from "../../api/axiosInstance";
import FollowListModal from "./FollowListModal";
import ConfirmModal from "../common/ConfirmModal";

export default function ProfilePage() {
  const { email, nickname } = useContext(AuthContext);
  const [me, setMe] = useState<UserProfileResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"work" | "like" | "collection" | "draft">("work");
  const [repCareers, setRepCareers] = useState<RepresentativeCareer[]>([]);
  const location = useLocation();
  
  // 활동 통계
  const [workCount, setWorkCount] = useState(0);
  const [likesReceived, setLikesReceived] = useState(0);
  const [collectionsCount, setCollectionsCount] = useState(0);
  
  // 팔로우 모달
  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [followModalType, setFollowModalType] = useState<"followers" | "following">("followers");
  const [myUserId, setMyUserId] = useState(0);
  
  // 배경 이미지 업로드
  const [uploadingCover, setUploadingCover] = useState(false);
  const [hoveringCover, setHoveringCover] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  useEffect(() => {
    const path = location.pathname;
    if (path.endsWith("/likes")) setActiveTab("like");
    else if (path.endsWith("/collections")) setActiveTab("collection");
    // else if (path.endsWith("/drafts")) setActiveTab("draft"); // 임시저장 기능 준비중
    else setActiveTab("work");
  }, [location.pathname]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await UserApi.getMe();
        if (mounted) setMe(data);
      } catch (e) {
        console.error("Failed to load profile", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // 대표 커리어 로드 (전체 목록에서 대표 + 비공개 제외)
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [careersRes, educationsRes, awardsRes, projectsRes] = await Promise.all([
          (CareerApi.list() as any).then((r: any) => r.data).catch(() => []),
          (EducationApi.list() as any).then((r: any) => r.data).catch(() => []),
          (AwardApi.list() as any).then((r: any) => r.data).catch(() => []),
          (CareerProjectApi.list() as any).then((r: any) => r.data).catch(() => []),
        ]);

        const isPrivate = (prefix: string, id: number) => {
          try { return localStorage.getItem(`privacy:${prefix}:${id}`) === "1"; } catch { return false; }
        };

        const MAJOR_PREFIX = "__MAJOR__:";

        const rep: RepresentativeCareer[] = [];

        // CAREER: 상단 회사, 하단 역할
        (careersRes || []).filter((c: any) => c.isRepresentative && !isPrivate("career", c.id)).forEach((c: any) => {
          rep.push({ type: "CAREER", title: c.companyName, subtitle: c.role, description: c.description });
        });

        // EDUCATION: 상단 학교(학위), 하단 전공
        (educationsRes || []).filter((e: any) => e.isRepresentative && !isPrivate("education", e.id)).forEach((e: any) => {
          let major = "";
          const raw = e.description || "";
          if (raw) {
            for (const line of String(raw).split("\n")) {
              if (line.startsWith(MAJOR_PREFIX)) major = line.slice(MAJOR_PREFIX.length).trim();
            }
          }
          const top = e.level === "HIGH_SCHOOL" 
            ? "고등학교"
            : e.degree ? `${e.schoolName}(${e.degree})` : e.schoolName;
          rep.push({ type: "EDUCATION", title: top, subtitle: major, description: e.description });
        });

        // AWARD: 상단 제목, 하단 발급기관
        (awardsRes || []).filter((a: any) => a.isRepresentative && !isPrivate("award", a.id)).forEach((a: any) => {
          rep.push({ type: "AWARD", title: a.title, subtitle: a.issuer, description: a.description });
        });

        // PROJECT: 상단 프로젝트 제목, 하단 역할
        (projectsRes || []).filter((p: any) => (p as any).isRepresentative && !isPrivate("project", p.id)).forEach((p: any) => {
          rep.push({ type: "PROJECT", title: p.title, subtitle: p.role, description: p.description });
        });

        if (mounted) setRepCareers(rep);
      } catch {
        if (mounted) setRepCareers([]);
      }
    };

    load();

    const onPrivacyChanged = () => load();
    window.addEventListener("privacy-changed", onPrivacyChanged as any);
    return () => {
      mounted = false;
      window.removeEventListener("privacy-changed", onPrivacyChanged as any);
    };
  }, []);

  // 닉네임/슬러그 저장 이벤트 수신: 즉시 반영
  useEffect(() => {
    const onUserUpdated = async () => {
      try {
        const data = await UserApi.getMe();
        setMe(data);
      } catch {}
    };
    window.addEventListener("user-username-updated", onUserUpdated as any);
    window.addEventListener("user-nickname-updated", onUserUpdated as any);
    return () => {
      window.removeEventListener("user-username-updated", onUserUpdated as any);
      window.removeEventListener("user-nickname-updated", onUserUpdated as any);
    };
  }, []);

  // 활동 통계 로드
  useEffect(() => {
    let mounted = true;
    
    const loadStats = async () => {
      try {
        // 내 ID 가져오기
        let myId = 0;
        try {
          myId = Number(localStorage.getItem("userId") || sessionStorage.getItem("userId") || '0');
        } catch {}
        if (!myId) {
          try {
            const meData = (await api.get<{ id: number }>("/users/me")).data;
            myId = meData?.id || 0;
          } catch {
            myId = 0;
          }
        }
        if (!myId || !mounted) return;
        
        if (mounted) setMyUserId(myId);

        // 1. 작업 개수 가져오기
        try {
          const projectsRes = await fetchUserProjects(myId, 0, 100);
          if (mounted) {
            const totalProjects = projectsRes.totalElements || projectsRes.content?.length || 0;
            setWorkCount(totalProjects);
            
            // 2. 좋아요 받은 수 계산
            const projects = projectsRes.content || [];
            if (projects.length > 0) {
              const projectIds = projects.map((p: any) => p.id).filter(Boolean);
              try {
                const metaRes = await fetchProjectsMeta(projectIds);
                const totalLikes = Object.values(metaRes || {}).reduce((sum: number, meta: any) => sum + (meta?.likes || 0), 0);
                if (mounted) setLikesReceived(totalLikes);
              } catch {
                // 메타 정보를 가져올 수 없으면 프로젝트의 likes 필드 합산
                const totalLikes = projects.reduce((sum: number, p: any) => sum + (p?.likes || 0), 0);
                if (mounted) setLikesReceived(totalLikes);
              }
            }
          }
        } catch (e) {
          console.error("작업 통계 로드 실패:", e);
        }

        // 3. 내 프로젝트가 다른 사람 컬렉션에 저장된 횟수 가져오기
        try {
          const { data } = await api.get('/profiles/me/collection-count');
          if (mounted) {
            setCollectionsCount(data?.savedCount || 0);
          }
        } catch (e) {
          console.error("컬렉션 저장 횟수 로드 실패:", e);
        }
      } catch (e) {
        console.error("통계 로드 실패:", e);
      }
    };

    loadStats();
    
    return () => {
      mounted = false;
    };
  }, []);

  // ✅ AuthContext의 nickname을 우선 사용 (깜빡임 방지)
  const displayName = (me?.nickname && me.nickname.trim()) || nickname || me?.username || "사용자";
  // 계정별 스코프 키를 우선 사용해 새로고침 후에도 동기화 유지
  const userEmailScoped = email || "";
  const usernameScopedKey = userEmailScoped ? `userUsername:${userEmailScoped}` : "userUsername";
  const scopedUsernameLocal = (typeof window !== "undefined" && (localStorage.getItem(usernameScopedKey) || sessionStorage.getItem(usernameScopedKey))) || "";
  const profileUrlScopedKey = userEmailScoped ? `profileUrlSlug:${userEmailScoped}` : "profileUrlSlug";
  const scopedProfileUrl = (typeof window !== "undefined" && (localStorage.getItem(profileUrlScopedKey) || sessionStorage.getItem(profileUrlScopedKey))) || "";
  // ✅ profileSlug 우선 사용, 없으면 기존 로직 유지
  const profileUrlSlug = me?.profileSlug || scopedProfileUrl || scopedUsernameLocal || me?.username || (localStorage.getItem("userUsername") || sessionStorage.getItem("userUsername") || "");
  const profileImageUrl = me?.profileImage || "";
  const initial = (() => {
    const src = (me?.email || "").trim();
    const ch = src ? src[0] : "";
    return ch ? ch.toUpperCase() : "N";
  })();
  // 한줄 프로필은 현재 로그인 스코프 키에서만 읽는다. 없으면 표시하지 않음.
  const storedEmail = (typeof window !== "undefined" && (localStorage.getItem("userEmail") || sessionStorage.getItem("userEmail"))) || "";
  const scopedKey = storedEmail ? `profileOneLine:${storedEmail}` : "profileOneLine";
  let oneLineScoped = "";
  try {
    oneLineScoped = localStorage.getItem(scopedKey) || sessionStorage.getItem(scopedKey) || "";
  } catch {}
  const rawOneLiner = (me as any)?.profileName || oneLineScoped || "";
  const oneLiner = rawOneLiner && rawOneLiner.trim ? rawOneLiner.trim() : rawOneLiner;
  const bioText = (me?.bio || "").trim();

  const iconForType = (t: RepresentativeCareer["type"]) => {
    if (t === "CAREER") return "💼";
    if (t === "PROJECT") return "🧩";
    if (t === "AWARD") return "🏅";
    return "🎓";
  };

  // 배경 이미지 업로드 핸들러
  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingCover(true);
      // 이미지 업로드
      const url = await UserApi.uploadImage(file);
      
      // 서버에 배경 이미지 URL 저장
      await api.patch("/users/profile/cover", { url });
      
      // 로컬 상태 업데이트
      if (me) {
        setMe({ ...me, coverImage: url });
      }
    } catch (error) {
      console.error("배경 이미지 업로드 실패:", error);
      alert("배경 이미지 업로드에 실패했습니다.");
    } finally {
      setUploadingCover(false);
      // input value 초기화 (같은 파일 재선택 가능하도록)
      e.target.value = "";
    }
  };

  // 배경 이미지 제거 핸들러
  const handleCoverImageRemove = async () => {
    try {
      setUploadingCover(true);
      setShowRemoveModal(false);
      // 서버에 null 저장하여 제거
      await api.patch("/users/profile/cover", { url: null });
      
      // 로컬 상태를 undefined로 업데이트 (완전히 제거)
      if (me) {
        setMe({ ...me, coverImage: undefined });
      }
    } catch (error) {
      console.error("배경 이미지 제거 실패:", error);
      alert("배경 이미지 제거에 실패했습니다.");
    } finally {
      setUploadingCover(false);
    }
  };

  return (
    <div className="w-full flex justify-center">
      <div className="w-full min-h-screen bg-white dark:bg-[var(--bg)] font-gmarket px-4 md:px-8 xl:px-14 pb-20 text-black dark:text-white">
        {/* 배너 (네모, 헤더 하단 초록 라인까지 끌어올림, 가로 전체 확장) */}
        <div 
          className="relative -mt-20 -mx-4 md:-mx-8 xl:-mx-14 bg-[#2F3436] dark:bg-[#14181B] h-[300px] md:h-[360px] w-auto rounded-none border-b border-black/10 dark:border-white/10"
          style={me?.coverImage && typeof me.coverImage === 'string' && me.coverImage.trim() !== "" ? {
            backgroundImage: `url(${me.coverImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          } : {}}
          onMouseEnter={() => setHoveringCover(true)}
          onMouseLeave={() => setHoveringCover(false)}
        >
          <input
            type="file"
            id="cover-upload"
            accept="image/*"
            className="hidden"
            onChange={handleCoverImageUpload}
            disabled={uploadingCover}
          />
          
          {/* 배경 이미지가 없을 때: 기본 업로드 UI */}
          {(!me?.coverImage || (typeof me.coverImage === 'string' && me.coverImage.trim() === "")) && (
            <label
              htmlFor="cover-upload"
              className="absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center text-center cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="w-11 h-11 md:w-12 md:h-12 rounded-full ring-2 ring-white border border-transparent flex items-center justify-center overflow-hidden bg-black/30 backdrop-blur-sm">
                {uploadingCover ? (
                  <div className="text-white text-sm">...</div>
                ) : (
                  <FiPlus className="text-white text-[22px] md:text-[26px]" />
                )}
              </div>
              <div className="mt-2 text-white text-[18px] md:text-[22px] font-semibold leading-tight tracking-tight">
                배경 이미지 업로드
              </div>
              <div className="mt-1 text-white/80 text-xs md:text-sm">권장 사이즈 : 2560 x 360 px</div>
            </label>
          )}
          
          {/* 배경 이미지가 있을 때: 호버 시 변경/제거 버튼 */}
          {me?.coverImage && typeof me.coverImage === 'string' && me.coverImage.trim() !== "" && hoveringCover && !uploadingCover && (
            <div className="absolute inset-0 bg-black/60 flex items-end justify-center pb-16 md:pb-20 transition-all">
              <div className="flex flex-col items-center text-center">
                <div className="text-white text-[18px] md:text-[22px] font-semibold">배경 이미지 변경</div>
                <div className="mt-1 text-white/80 text-xs md:text-sm">권장 사이즈 : 2560 x 360 px</div>
                <div className="flex gap-3 mt-4">
                  <label
                    htmlFor="cover-upload"
                    className="px-6 py-2.5 bg-[#068334] text-white rounded-full text-[14px] md:text-[16px] font-semibold cursor-pointer hover:bg-[#057028] transition-colors"
                  >
                    변경하기
                  </label>
                  <button
                    onClick={() => setShowRemoveModal(true)}
                    className="px-6 py-2.5 bg-white text-[#068334] rounded-full text-[14px] md:text-[16px] font-semibold hover:bg-gray-100 transition-colors"
                  >
                    제거하기
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* 업로드 중 */}
          {uploadingCover && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-white text-[18px] md:text-[22px]">처리 중...</div>
            </div>
          )}
        </div>

        {/* 본문 레이아웃: 좌측 슬림 패널 + 우측 콘텐츠 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-[minmax(300px,420px)_1fr] gap-8 items-start">
          {/* 좌측 프로필 카드 */}
          <aside
            className="relative z-10 -mt-32 md:-mt-44 lg:-mt-56 xl:-mt-64 border border-[#ADADAD] dark:border-[var(--border-color)] rounded-[12px] p-6 md:p-8 bg-white dark:bg-[var(--surface)] overflow-hidden min-h-[1000px] flex flex-col"
          >
            {/* 아바타 */}
            <div className="flex justify-center">
              <div className="w-[120px] h-[120px] rounded-full bg-[#F3F4F6] dark:bg-[var(--avatar-bg)] flex items-center justify-center text-black dark:text-white text-3xl overflow-hidden">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{initial}</span>
                )}
              </div>
            </div>

            {/* 이름/URL/소개 */}
            <div className="mt-5 text-center text-[22px] md:text-[24px] text-black dark:text-white">{displayName}</div>
            {!!oneLiner && (
              <div className="mt-1 text-center text-[16px] md:text-[16px] text-black/80 dark:text-white/80">{oneLiner}</div>
            )}
            <div className="mt-2 text-center text-[13px] md:text-[14px] text-black/70 dark:text-white/70 underline break-all">
              {profileUrlSlug ? `sandwich-dev.com/${profileUrlSlug}` : "sandwich-dev.com"}
            </div>

            {/* 버튼 */}
            <div className="mt-6 space-y-3">
              <Link to="/mypage" className="w-full h-[46px] md:h-[48px] rounded-[30px] bg-[#068334] text-white text-[16px] md:text-[18px] flex items-center justify-center">
                프로필 편집
              </Link>
            </div>

            {/* 소개: 값이 있을 때만 표시 */}
            {bioText && (
              <div className="mt-6 text-[14px] md:text-[16px]">
                <div className="text-black/90 dark:text-white">소개</div>
                <div className="mt-2 text-black/80 dark:text-white/80 whitespace-pre-line">{bioText}</div>
              </div>
            )}

            {/* 간격만 살짝 */}
            <div className="mt-20" />

            {/* 크레딧 지갑 */}
            <CreditWallet />

            {/* 커리어: 대표 항목 표시 */}
            <div className="mt-2 text-[14px] md:text-[16px]">
              <div className="flex items-center justify-between">
                <div className="text-black/90 dark:text-white">커리어</div>
                {repCareers.length > 0 ? (
                  <Link to="/profile/careers" className="text-[12px] text-black/50 dark:text-white/60 hover:underline">자세히 보기 &gt;</Link>
                ) : null}
              </div>

              <div className="mt-4 space-y-4">
                {repCareers.length > 0 ? (
                  repCareers.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="text-[18px]" aria-hidden>{iconForType(item.type)}</span>
                      <div className="flex-1">
                        <div className="text-[14px] text-black dark:text-white font-medium">{item.title}</div>
                        {!!item.subtitle && <div className="text-[13px] text-black/60 dark:text-white/60">{item.subtitle}</div>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="mt-4 w-full flex justify-center">
                    <div className="inline-flex items-center gap-1 text-black/60 dark:text-white/60">
                      <span>설정된 대표 커리어가 없습니다.</span>
                      <span className="text-black/40 dark:text-white/40" aria-hidden>ⓘ</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 간격만 살짝 */}
            <div className="mt-20" />


            {/* 활동 정보 - 첫번째 사진 스타일 (숫자 위, 라벨 아래, 간격 작게) */}
            <div className="mt-4 text-[14px] md:text-[16px]">
              <div className="text-black/90 dark:text-white">활동 정보</div>

                {/* 간격만 살짝 */}
              <div className="mt-5" />

              <div className="mt-2 grid grid-cols-3 gap-6 text-[14px]">
                <div className="flex flex-col gap-1">
                  <div className="text-[14px]">{workCount}</div>
                  <div className="text-[14px] text-black/60 dark:text-white/60">작업 보기</div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-[14px]">{likesReceived}</div>
                  <div className="text-[14px] text-black/60 dark:text-white/60">좋아요 받음</div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-[14px]">{collectionsCount}</div>
                  <div className="text-[14px] text-black/60 dark:text-white/60">컬렉션 저장됨</div>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-6 text-[14px]">
                <button 
                  onClick={() => { setFollowModalType("following"); setFollowModalOpen(true); }}
                  className="flex flex-col gap-1 cursor-pointer hover:opacity-70 transition-opacity text-left"
                >
                  <div className="text-[14px]">{me?.followingCount ?? 0}</div>
                  <div className="text-[14px] text-black/60 dark:text-white/60">팔로잉</div>
                </button>
                <button 
                  onClick={() => { setFollowModalType("followers"); setFollowModalOpen(true); }}
                  className="flex flex-col gap-1 cursor-pointer hover:opacity-70 transition-opacity text-left"
                >
                  <div className="text-[14px]">{me?.followerCount ?? 0}</div>
                  <div className="text-[14px] text-black/60 dark:text-white/60">팔로워</div>
                </button>
                <div />
              </div>
            </div>
          </aside>

          {/* 우측 콘텐츠 */}
          <section>
            {/* 탭 영역: 회색 선 + 활성 탭 진하게 */}
            <div className="text-[15px] md:text-[16px] border-b border-[#E5E7EB] dark:border-[var(--border-color)]">
              <div className="flex items-center gap-6">
                <Link to="/profile/work" onClick={()=>setActiveTab("work")} className={`pb-3 ${activeTab==="work" ? "font-semibold text-black dark:text-white" : "text-black/60 dark:text-white/60"}`}>작업</Link>
                <Link to="/profile/likes" onClick={()=>setActiveTab("like")} className={`pb-3 ${activeTab==="like" ? "font-semibold text-black dark:text-white" : "text-black/60 dark:text-white/60"}`}>좋아요</Link>
                <Link to="/profile/collections" onClick={()=>setActiveTab("collection")} className={`pb-3 ${activeTab==="collection" ? "font-semibold text-black dark:text-white" : "text-black/60 dark:text-white/60"}`}>컬렉션</Link>
                {/* 임시저장 기능 준비중 */}
                {/* <Link to="/profile/drafts" onClick={()=>setActiveTab("draft")} className={`pb-3 ${activeTab==="draft" ? "font-semibold text-black dark:text-white" : "text-black/60 dark:text-white/60"}`}>임시저장</Link> */}
              </div>
            </div>

            {/* 탭 컨텐츠 */}
            {activeTab === "work" && <WorkTab />}
            {activeTab === "like" && <LikesTab />}
            {activeTab === "collection" && <CollectionsTab />}
            {/* {activeTab === "draft" && <DraftsTab />} */}
          </section>
        </div>
      </div>

      {/* 팔로워/팔로잉 목록 모달 */}
      <FollowListModal
        isOpen={followModalOpen}
        onClose={() => setFollowModalOpen(false)}
        userId={myUserId}
        type={followModalType}
      />

      {/* 배경 이미지 제거 확인 모달 */}
      <ConfirmModal
        visible={showRemoveModal}
        title="배경 이미지 제거"
        message="배경 이미지를 제거하시겠습니까?&#10;이 작업은 되돌릴 수 없습니다."
        confirmText="제거하기"
        cancelText="취소"
        confirmButtonColor="red"
        onConfirm={handleCoverImageRemove}
        onCancel={() => setShowRemoveModal(false)}
      />
    </div>
  );
}