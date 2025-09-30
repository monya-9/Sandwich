import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axiosInstance";
import PublicWorkGrid from "../components/Profile/PublicWorkGrid";
import PublicLikesGrid from "../components/Profile/PublicLikesGrid";
import PublicCollectionsGrid from "../components/Profile/PublicCollectionsGrid";
import SuggestAction from "../components/OtherProject/ActionBar/SuggestAction";
import Toast from "../components/common/Toast";

// 공개 프로필 응답 타입(백엔드에 email 추가됨)
 type PublicProfile = {
  id: number;
  nickname: string | null;
  username?: string | null;
  email?: string | null;
  position?: string | null;
  interests?: string[] | null;
  profileImage?: string | null;
  followerCount?: number;
};

export default function UserPublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const userId = id ? Number(id) : 0;
  const navigate = useNavigate();

  const [data, setData] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<"work" | "like" | "collection">("work");
  const [toast, setToast] = useState<{ type: "success" | "info" | "error"; message: string } | null>(null);
  const [followBtnHover, setFollowBtnHover] = useState(false);

  const myId = Number((typeof window !== 'undefined' && (localStorage.getItem('userId') || sessionStorage.getItem('userId'))) || '0');
  const isSelf = myId > 0 && myId === userId;

  // 자신 프로필의 공개 경로로 들어오면 내 프로필로 리다이렉트
  useEffect(() => {
    if (isSelf) {
      navigate('/profile', { replace: true });
    }
  }, [isSelf, navigate]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get<PublicProfile>(`/users/${userId}`);
        if (!alive) return;
        setData(data);
      } catch (e) {
        if (!alive) return;
        setError("프로필을 불러오지 못했습니다.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [userId]);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
        if (!token || !userId || isSelf) return setIsFollowing(false);
        const r = await api.get<{ isFollowing: boolean }>(`/users/${userId}/follow-status`);
        setIsFollowing(Boolean((r as any).data?.isFollowing));
      } catch {
        setIsFollowing(false);
      }
    })();
  }, [userId, isSelf]);

  const toggleFollow = async () => {
    const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
    if (!token) return navigate("/login");
    if (!userId || isSelf) return;
    try {
      if (isFollowing) {
        await api.delete(`/users/${userId}/unfollow`);
        setIsFollowing(false);
        setToast({ type: "info", message: "팔로우를 취소했습니다." });
      } else {
        await api.post(`/users/${userId}/follow`);
        setIsFollowing(true);
        setToast({ type: "success", message: "사용자를 팔로우했습니다." });
      }
    } catch {
      setToast({ type: "error", message: "처리 중 오류가 발생했습니다." });
    }
  };

  const suggest = () => {
    const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
    if (!token) return navigate("/login");
    // other-project의 SuggestAction 모달을 열도록 이벤트 발행
    window.dispatchEvent(new Event("suggest:open"));
  };

  if (!id || userId <= 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-lg">잘못된 사용자입니다.</div>
        <button className="mt-4 underline" onClick={() => navigate(-1)}>뒤로가기</button>
      </div>
    );
  }

  const displayName = (data?.nickname || data?.username || "사용자").trim();
  const profileUrl = data?.username ? `sandwich.com/${data.username}` : `sandwich.com/user/${userId}`;

  return (
    <div className="w-full flex justify-center">
      <div className="w-full min-h-screen bg-white font-gmarket px-4 md:px-8 xl:px-14 pb-20">
        {toast && (
          <Toast
            visible={true}
            message={toast.message}
            type={toast.type}
            size="medium"
            autoClose={2500}
            closable={true}
            onClose={() => setToast(null)}
          />
        )}
        {/* 배경: 업로드 UI 제거, 읽기 전용 배너 */}
        <div className="relative -mt-20 -mx-4 md:-mx-8 xl:-mx-14 bg-[#2F3436] h-[300px] md:h-[360px] w-auto rounded-none" />

        {/* 본문 레이아웃 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-[minmax(300px,420px)_1fr] gap-8 items-start">
          {/* 좌측 카드 */}
          <aside className="relative z-10 -mt-32 md:-mt-44 lg:-mt-56 xl:-mt-64 border border-[#ADADAD] rounded-[12px] p-6 md:p-8 bg-white overflow-hidden min-h-[1000px] flex flex-col">
            {/* 아바타 */}
            <div className="flex justify-center">
              <div className="w-[120px] h-[120px] rounded-full bg-[#F3F4F6] flex items-center justify-center text-black text-3xl overflow-hidden">
                {data?.profileImage ? (
                  <img src={data.profileImage} alt="profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{(((data?.email || "")[0] || "").toUpperCase() || displayName.slice(0,1).toUpperCase())}</span>
                )}
              </div>
            </div>
            {/* 이름/URL */}
            <div className="mt-5 text-center text-[22px] md:text-[24px] text-black">{displayName}</div>
            <div className="mt-2 text-center text-[13px] md:text-[14px] text-black/70 underline break-all">{profileUrl}</div>

            {/* 버튼: 팔로우 / 제안하기 */}
            <div className="mt-6 space-y-3">
              {!isSelf && (
                <button
                  onClick={toggleFollow}
                  onMouseEnter={() => setFollowBtnHover(true)}
                  onMouseLeave={() => setFollowBtnHover(false)}
                  className={`w-full h-[46px] md:h-[48px] rounded-[30px] flex items-center justify-center gap-2 ${
                    isFollowing
                      ? (followBtnHover
                        ? "bg-[#F6323E] text-white border-2 border-[#F6323E]"
                        : "bg-white border-2 border-black text-black")
                      : "bg-white border-2 border-black text-black"
                  } text-[16px] md:text-[18px]`}
                >
                  {isFollowing ? (
                    followBtnHover ? null : (
                      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                        <polyline points="20 6 9 17 4 12" fill="none" stroke="currentColor" strokeWidth="3" />
                      </svg>
                    )
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="3" fill="none" />
                    </svg>
                  )}
                  <span>{isFollowing ? (followBtnHover ? "팔로우 취소" : "팔로잉") : "팔로우"}</span>
                </button>
              )}

              <button
                onClick={suggest}
                className="w-full h-[46px] md:h-[48px] rounded-[30px] bg-[#068334] hover:bg-[#05702C] text-white text-[16px] md:text-[18px] flex items-center justify-center gap-2"
              >
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4a2 2 0 00-2 2v14l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"/></svg>
                <span>제안하기</span>
              </button>
            </div>

            {/* 소개/커리어 */}
            <div className="mt-20" />
            <div className="mt-2 text-[14px] md:text-[16px]">
              <div className="text-black/90">커리어</div>
              {/* 공개 API가 없으므로 우선 메시지 표시. 추후 공개 API 연결 시 목록으로 교체 */}
              <div className="mt-4 text-center text-black/60">설정된 대표 커리어가 없습니다.</div>
            </div>

            {/* 활동 정보 */}
            <div className="mt-20" />
            <div className="mt-4 text-[14px] md:text-[16px]">
              <div className="text-black/90">활동 정보</div>
              <div className="mt-5" />
              <div className="mt-2 grid grid-cols-3 gap-6 text-[14px]">
                <div className="flex flex-col gap-1"><div className="text-[14px]">0</div><div className="text-[14px] text-black/60">작업 보기</div></div>
                <div className="flex flex-col gap-1"><div className="text-[14px]">0</div><div className="text-[14px] text-black/60">좋아요 받음</div></div>
                <div className="flex flex-col gap-1"><div className="text-[14px]">0</div><div className="text-[14px] text-black/60">컬렉션 저장됨</div></div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-6 text-[14px]">
                <div className="flex flex-col gap-1"><div className="text-[14px]">0</div><div className="text-[14px] text-black/60">팔로잉</div></div>
                <div className="flex flex-col gap-1"><div className="text-[14px]">{data?.followerCount ?? 0}</div><div className="text-[14px] text-black/60">팔로워</div></div>
                <div />
              </div>
            </div>
          </aside>

          {/* 우측: 탭 */}
          <section>
            <div className="text-[15px] md:text-[16px] border-b border-[#E5E7EB]">
              <div className="flex items-center gap-6">
                <button className={`pb-3 ${activeTab==="work" ? "font-semibold text-black" : "text-black/60"}`} onClick={() => setActiveTab("work")}>작업</button>
                <button className={`pb-3 ${activeTab==="like" ? "font-semibold text-black" : "text-black/60"}`} onClick={() => setActiveTab("like")}>좋아요</button>
                <button className={`pb-3 ${activeTab==="collection" ? "font-semibold text-black" : "text-black/60"}`} onClick={() => setActiveTab("collection")}>컬렉션</button>
              </div>
            </div>

            {activeTab === "work" && <PublicWorkGrid userId={userId} />}
            {activeTab === "like" && <PublicLikesGrid />}
            {activeTab === "collection" && <PublicCollectionsGrid />}

            {/* 모달 이벤트 수신 전용: 화면에 표시하지 않음 */}
            <div className="hidden"><SuggestAction targetUserId={userId} /></div>
          </section>
        </div>
      </div>
    </div>
  );
} 