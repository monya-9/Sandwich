import React, { useEffect, useState } from "react";
import { FiPlus } from "react-icons/fi";
import { UserApi, type UserProfileResponse, type RepresentativeCareer } from "../../api/userApi";
import { Link } from "react-router-dom";
import { HiCheckCircle } from "react-icons/hi2";
import WorkTab from "./WorkTab";
import LikesTab from "./LikesTab";
import CollectionsTab from "./CollectionsTab";
import DraftsTab from "./DraftsTab";
import { CareerProjectApi } from "../../api/careerProjectApi";
import { CareerApi } from "../../api/careerApi";
import { EducationApi } from "../../api/educationApi";
import { AwardApi } from "../../api/awardApi";

export default function ProfilePage() {
  const [me, setMe] = useState<UserProfileResponse | null>(null);
  const [showTip, setShowTip] = useState(true);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [allowProjectOffers, setAllowProjectOffers] = useState(true);
  const [allowJobOffers, setAllowJobOffers] = useState(true);
  const [showOfferSavedBanner, setShowOfferSavedBanner] = useState(false);
  const [activeTab, setActiveTab] = useState<"work" | "like" | "collection" | "draft">("work");
  const [repCareers, setRepCareers] = useState<RepresentativeCareer[]>([]);

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
          const top = e.degree ? `${e.schoolName}(${e.degree})` : e.schoolName;
          rep.push({ type: "EDUCATION", title: top, subtitle: major, description: e.description });
        });

        // AWARD: 상단 제목, 하단 발급기관
        (awardsRes || []).filter((a: any) => a.isRepresentative && !isPrivate("award", a.id)).forEach((a: any) => {
          rep.push({ type: "AWARD", title: a.title, subtitle: a.issuer, description: a.description });
        });

        // PROJECT: 상단 "프로젝트", 하단 역할
        (projectsRes || []).filter((p: any) => (p as any).isRepresentative && !isPrivate("project", p.id)).forEach((p: any) => {
          rep.push({ type: "PROJECT", title: "프로젝트", subtitle: p.role, description: p.description });
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

  // 닉네임 저장 이벤트 수신: 헤더와 동일하게 즉시 반영
  useEffect(() => {
    const onNickUpdated = async () => {
      try {
        const data = await UserApi.getMe();
        setMe(data);
      } catch {}
    };
    const onOneLineUpdated = () => {
      try {
        const storedEmail = (localStorage.getItem("userEmail") || sessionStorage.getItem("userEmail") || "");
        const scopedKey = storedEmail ? `profileOneLine:${storedEmail}` : "profileOneLine";
        const v = (localStorage.getItem(scopedKey) || sessionStorage.getItem(scopedKey) || "").trim();
        if (v) setShowTip(false);
        setMe((prev)=> (prev ? ({ ...prev, profileName: v } as any) : prev));
      } catch {}
    };
    window.addEventListener("user-nickname-updated", onNickUpdated as any);
    window.addEventListener("profile-one-line-updated", onOneLineUpdated as any);
    return () => {
      window.removeEventListener("user-nickname-updated", onNickUpdated as any);
      window.removeEventListener("profile-one-line-updated", onOneLineUpdated as any);
    };
  }, []);

  const displayName = (me?.nickname && me.nickname.trim()) || (localStorage.getItem("userNickname") || sessionStorage.getItem("userNickname") || "").trim() || me?.username || "사용자";
  const profileUrlSlug = me?.username || (localStorage.getItem("userUsername") || sessionStorage.getItem("userUsername") || "");
  const profileImageUrl = me?.profileImage || "";
  const initial = (() => {
    const src = (me?.email || "").trim();
    const ch = src ? src[0] : "";
    return ch ? ch.toUpperCase() : "N";
  })();
  const storedProfileName =
    (typeof window !== "undefined" && (localStorage.getItem("userProfileName") || sessionStorage.getItem("userProfileName"))) || "";
  // Read one-line profile from scoped storage key used in settings page
  const storedEmail = (typeof window !== "undefined" && (localStorage.getItem("userEmail") || sessionStorage.getItem("userEmail"))) || "";
  const scopedKey = storedEmail ? `profileOneLine:${storedEmail}` : "profileOneLine";
  let oneLineScoped = "";
  try {
    oneLineScoped = localStorage.getItem(scopedKey) || sessionStorage.getItem(scopedKey) || "";
    if (!oneLineScoped) {
      // Fallback: scan prefixed keys if scope mismatch
      for (let i = 0; i < (localStorage?.length || 0); i++) {
        const k = localStorage.key(i) || "";
        if (k.startsWith("profileOneLine:")) { oneLineScoped = localStorage.getItem(k) || ""; if (oneLineScoped) break; }
      }
      if (!oneLineScoped) {
        for (let i = 0; i < (sessionStorage?.length || 0); i++) {
          const k = sessionStorage.key(i) || "";
          if (k.startsWith("profileOneLine:")) { oneLineScoped = sessionStorage.getItem(k) || ""; if (oneLineScoped) break; }
        }
      }
    }
  } catch {}
  const rawOneLiner = (me as any)?.profileName || storedProfileName || oneLineScoped || "";
  const oneLiner = rawOneLiner && rawOneLiner.trim ? rawOneLiner.trim() : rawOneLiner;
  const bioText = (me?.bio || "").trim();

  const iconForType = (t: RepresentativeCareer["type"]) => {
    if (t === "CAREER") return "💼";
    if (t === "PROJECT") return "🧩";
    if (t === "AWARD") return "🏅";
    return "🎓";
  };

  return (
    <div className="w-full flex justify-center">
      <div className="w-full min-h-screen bg-white font-gmarket px-4 md:px-8 xl:px-14 pb-20">
        {showOfferSavedBanner && (
          <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 rounded-full bg-black text-white text-[13px] px-3 py-1.5 shadow-lg flex items-center gap-2">
            <HiCheckCircle className="text-[#22C55E] w-4 h-4" />
            의뢰&구직 상태가 저장되었습니다.
          </div>
        )}
        {/* 배너 (네모, 헤더 하단 초록 라인까지 끌어올림, 가로 전체 확장) */}
        <div className="relative -mt-20 -mx-4 md:-mx-8 xl:-mx-14 bg-[#2F3436] h-[300px] md:h-[360px] w-auto rounded-none">
          <div className="absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center text-center">
            <div className="w-11 h-11 md:w-12 md:h-12 rounded-full border-2 border-white flex items-center justify-center overflow-hidden bg-transparent">
              {/* 배경 이미지 업로드 아이콘 */}
              <FiPlus className="text-white text-[22px] md:text-[26px]" />
            </div>
            <div className="mt-2 text-white text-[18px] md:text-[22px] font-semibold leading-tight tracking-tight">배경 이미지 업로드</div>
            <div className="mt-1 text-white/80 text-xs md:text-sm">권장 사이즈 : 2560 x 376 px</div>
          </div>
        </div>

        {/* 본문 레이아웃: 좌측 슬림 패널 + 우측 콘텐츠 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-[minmax(300px,420px)_1fr] gap-8 items-start">
          {/* 좌측 프로필 카드 */}
          <aside
            className="relative z-10 -mt-32 md:-mt-44 lg:-mt-56 xl:-mt-64 border border-[#ADADAD] rounded-[12px] p-6 md:p-8 bg-white overflow-hidden min-h-[1000px] flex flex-col"
          >
            {/* 아바타 */}
            <div className="flex justify-center">
              <div className="w-[120px] h-[120px] rounded-full bg-[#F3F4F6] flex items-center justify-center text-black text-3xl overflow-hidden">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="profile" className="w-full h-full object-cover" />
                ) : (
                  <span>N</span>
                )}
              </div>
            </div>

            {/* 이름/URL/소개 */}
            <div className="mt-5 text-center text-[22px] md:text-[24px] text-black">{displayName}</div>
            {!!oneLiner && (
              <div className="mt-1 text-center text-[16px] md:text-[16px] text-black/80">{oneLiner}</div>
            )}
            <div className="mt-2 text-center text-[13px] md:text-[14px] text-black/70 underline break-all">
              {profileUrlSlug ? `sandwich.com/${profileUrlSlug}` : "sandwich.com"}
            </div>

            {/* 버튼 */}
            <div className="mt-6 space-y-3">
              <Link to="/mypage" className="w-full h-[46px] md:h-[48px] rounded-[30px] bg-[#068334] text-white text-[16px] md:text-[18px] flex items-center justify-center">
                프로필 편집
              </Link>
              <button onClick={() => setShowOfferModal(true)} className="w-full h-[46px] md:h-[48px] rounded-[30px] border border-[#068334] text-[#068334] text-[16px] md:text-[18px]">
                의뢰&구직 상태 설정
              </button>
            </div>

            {/* 소개: 값이 있을 때만 표시 */}
            {bioText && (
              <div className="mt-6 text-[14px] md:text-[16px]">
                <div className="text-black/90">소개</div>
                <div className="mt-2 text-black/80 whitespace-pre-line">{bioText}</div>
              </div>
            )}

            {/* 간격만 살짝 */}
            <div className="mt-20" />

            {/* 커리어: 대표 항목 표시 */}
            <div className="mt-2 text-[14px] md:text-[16px]">
              <div className="flex items-center justify-between">
                <div className="text-black/90">커리어</div>
                {repCareers.length > 0 ? (
                  <Link to="/profile/careers" className="text-[12px] text-black/50 hover:underline">자세히 보기 &gt;</Link>
                ) : null}
              </div>

              <div className="mt-4 space-y-4">
                {repCareers.length > 0 ? (
                  repCareers.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="text-[18px]" aria-hidden>{iconForType(item.type)}</span>
                      <div className="flex-1">
                        <div className="text-[14px] text-black font-medium">{item.title}</div>
                        {!!item.subtitle && <div className="text-[13px] text-black/60">{item.subtitle}</div>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="mt-4 w-full flex justify-center">
                    <div className="inline-flex items-center gap-1 text-black/60">
                      <span>설정된 대표 커리어가 없습니다.</span>
                      <span className="text-black/40" aria-hidden>ⓘ</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 간격만 살짝 */}
            <div className="mt-20" />


            {/* 활동 정보 - 첫번째 사진 스타일 (숫자 위, 라벨 아래, 간격 작게) */}
            <div className="mt-4 text-[14px] md:text-[16px]">
              <div className="text-black/90">활동 정보</div>

                {/* 간격만 살짝 */}
              <div className="mt-5" />

              <div className="mt-2 grid grid-cols-3 gap-6 text-[14px]">
                <div className="flex flex-col gap-1">
                  <div className="text-[14px]">0</div>
                  <div className="text-[14px] text-black/60">작업 보기</div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-[14px]">0</div>
                  <div className="text-[14px] text-black/60">좋아요 받음</div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-[14px]">0</div>
                  <div className="text-[14px] text-black/60">컬렉션 저장됨</div>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-6 text-[14px]">
                <div className="flex flex-col gap-1">
                  <div className="text-[14px]">0</div>
                  <div className="text-[14px] text-black/60">팔로잉</div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-[14px]">{me?.followerCount ?? 0}</div>
                  <div className="text-[14px] text-black/60">팔로워</div>
                </div>
                <div />
              </div>
            </div>
          </aside>

          {/* 우측 콘텐츠 */}
          <section>
            {/* 탭 영역: 회색 선 + 활성 탭 진하게 */}
            <div className="text-[15px] md:text-[16px] border-b border-[#E5E7EB]">
              <div className="flex items-center gap-6">
                <Link to="/profile/work" onClick={()=>setActiveTab("work")} className={`pb-3 ${activeTab==="work" ? "font-semibold text-black" : "text-black/60"}`}>작업</Link>
                <Link to="/profile/likes" onClick={()=>setActiveTab("like")} className={`pb-3 ${activeTab==="like" ? "font-semibold text-black" : "text-black/60"}`}>좋아요</Link>
                <Link to="/profile/collections" onClick={()=>setActiveTab("collection")} className={`pb-3 ${activeTab==="collection" ? "font-semibold text-black" : "text-black/60"}`}>컬렉션</Link>
                <Link to="/profile/drafts" onClick={()=>setActiveTab("draft")} className={`pb-3 ${activeTab==="draft" ? "font-semibold text-black" : "text-black/60"}`}>임시저장</Link>
              </div>
            </div>

            {/* 탭 컨텐츠 */}
            {activeTab === "work" && <WorkTab />}
            {activeTab === "like" && <LikesTab />}
            {activeTab === "collection" && <CollectionsTab />}
            {activeTab === "draft" && <DraftsTab />}
          </section>
        </div>
      </div>

      {/* 의뢰&구직 상태 설정 모달 */}
      {showOfferModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-[520px] bg-white rounded-[12px] p-6 relative min-h-[400px] flex flex-col">
            <button aria-label="close" className="absolute right-3 top-3 text-black/60 hover:text-black w-8 h-8 text-[25px] flex items-center justify-center" onClick={() => setShowOfferModal(false)}>✕</button>
            <div className="text-[16px] md:text-[18px] font-semibold">의뢰&구직 상태 설정</div>
            <p className="mt-6 text-[14px] md:text-[15px] text-black/80 leading-relaxed">
              프로젝트 의뢰나 구직 제안 받기를 설정하시면 더 많은 기회를 얻을 수 있어요.
            </p>

            <div className="mt-10 space-y-4">
              {/* 프로젝트 의뢰 및 프리랜서 제안 받기 */}
              <div className={`rounded-[12px] border p-4 ${allowProjectOffers ? "border-[#98E1C8] bg-[#E8F7EE]" : "border-[#E5E7EB] bg-white"}`}>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setAllowProjectOffers((v) => !v)}
                    aria-pressed={allowProjectOffers}
                    className={`relative inline-flex w-[44px] h-[24px] rounded-full transition-colors ${allowProjectOffers ? "bg-[#068334]" : "bg-[#E5E7EB]"}`}
                  >
                    <span className={`absolute top-1/2 -translate-y-1/2 w-[20px] h-[20px] rounded-full bg-white shadow ring-1 ring-black/10 transition-transform ${allowProjectOffers ? "translate-x-[22px]" : "translate-x-[2px]"}`} />
                  </button>
                  <div className="text-[15px] md:text-[16px] text-black/80">프로젝트 의뢰 및 프리랜서 제안 받기</div>
                </div>
              </div>

              {/* 채용 제안 받기 */}
              <div className={`rounded-[12px] border p-4 ${allowJobOffers ? "border-[#98E1C8] bg-[#E8F7EE]" : "border-[#E5E7EB] bg-white"}`}>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setAllowJobOffers((v) => !v)}
                    aria-pressed={allowJobOffers}
                    className={`relative inline-flex w-[44px] h-[24px] rounded-full transition-colors ${allowJobOffers ? "bg-[#068334]" : "bg-[#E5E7EB]"}`}
                  >
                    <span className={`absolute top-1/2 -translate-y-1/2 w-[20px] h-[20px] rounded-full bg-white shadow ring-1 ring-black/10 transition-transform ${allowJobOffers ? "translate-x-[22px]" : "translate-x-[2px]"}`} />
                  </button>
                  <div className="text-[15px] md:text-[16px] text-black/80">채용 제안 받기</div>
                </div>
              </div>
            </div>

            <div className="mt-auto">
              <hr className="border-gray-200 my-4 -mx-6" />
              <div className="mt-2 flex justify-end gap-2">
                <button onClick={() => setShowOfferModal(false)} className="h-[36px] px-4 rounded-[18px] border border-black/20 text-[13px]">취소</button>
                <button onClick={() => { setShowOfferModal(false); setShowOfferSavedBanner(true); window.setTimeout(() => setShowOfferSavedBanner(false), 3000); }} className="h-[36px] px-4 rounded-[18px] bg-[#068334] text-white text-[13px]">완료</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}