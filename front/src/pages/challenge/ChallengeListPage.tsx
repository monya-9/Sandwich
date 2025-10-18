// src/pages/challenge/ChallengeListPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { dummyChallenges, getDynamicChallenges } from "../../data/Challenge/dummyChallenges";
import ChallengeCard from "../../components/challenge/ChallengeCard";
import { StatusBadge, Countdown, SectionCard } from "../../components/challenge/common";
import WinnersSection from "../../components/challenge/WinnersSection";
import { isAdmin } from "../../utils/authz";
import type { ChallengeCardData } from "../../components/challenge/ChallengeCard";

import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ChallengeListPage() {
    const navigate = useNavigate();
    const [challenges, setChallenges] = useState<ChallengeCardData[]>(dummyChallenges);
    const [loading, setLoading] = useState(false);
    const admin = isAdmin();

    // AI API에서 동적으로 챌린지 데이터 가져오기
    useEffect(() => {
        setLoading(true);
        getDynamicChallenges()
            .then((dynamicChallenges) => {
                setChallenges(dynamicChallenges);
            })
            .catch((error) => {
                console.error('챌린지 데이터 로딩 실패:', error);
                // 에러 시 기본 더미 데이터 유지
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

  // 자동 새로고침: 일정 주기로 최신 데이터 재요청 + 탭 포커스 시 갱신
  useEffect(() => {
    let disposed = false;

    async function refreshOnce() {
      try {
        const next = await getDynamicChallenges();
        if (!disposed) setChallenges((prev) => {
          // 간단 비교: id/type/subtitle만 비교하여 변경 시에만 교체
          const key = (it: any) => `${it?.id}|${it?.type}|${it?.subtitle}`;
          const a = prev?.map(key).join(',');
          const b = next?.map(key).join(',');
          return a === b ? prev : next;
        });
      } catch (e) {
        // ignore
      }
    }

    const interval = window.setInterval(refreshOnce, 30000); // 30초마다 갱신
    const onFocus = () => refreshOnce();
    window.addEventListener('focus', onFocus);
    return () => {
      disposed = true;
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

    return (
        <div className="w-full bg-white">
            {/* 오렌지 공지 배너 */}
            <div>
                <div className="mx-auto max-w-screen-xl px-4 py-4 md:px-6">
                    <div className="rounded-xl bg-[#FFA31A] px-5 py-4 text-white md:px-6 md:py-5">
                        <p className="text-[14px] font-semibold">매주 주어질 주제로 코드 / 매달 주어지는 포트폴리오 챌린지!</p>
                        <p className="mt-1 text-[13px] leading-6 opacity-95">
                            개발자라면 누구나 참여 가능, 개인/팀 모두 환영해요.<br className="hidden md:block" />
                            코드 챌린지는 AI 자동 채점으로 공정하게, 포트폴리오 챌린지는 투표로 결정! 1~3등은 크레딧 보상과 전용 뱃지, 참가자 전원도 크레딧 지급!<br className="hidden md:block" />
                            코드 챌린지는 중복 제출·수정 가능, 포트폴리오 챌린지는 팀 or 개인으로 1회 출전 가능!<br className="hidden md:block" />
                            이번 주제 확인하고 지금 바로 참여해 보세요!
                        </p>
                    </div>
                </div>
            </div>

            {/* WinnersSection + Admin Actions */}
            <div className="mx-auto max-w-screen-xl px-4 md:px-6">
                <div className="flex items-center justify-between mt-6">
                    <h2 className="sr-only">Winners</h2>
                </div>
            </div>
            <div className="relative">
                <WinnersSection />
                {admin && (
                    <div className="mx-auto max-w-screen-xl px-4 md:px-6">
                        <div className="mt-2 flex justify-end">
                            <button
                                className="rounded-md bg-black text-white px-3 py-2 text-sm"
                                onClick={() => navigate("/admin/challenges/new")}
                            >
                                챌린지 생성
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <main className="mx-auto max-w-screen-xl px-4 py-6 md:px-6 md:py-10">
                {loading ? (
                    /* 로딩 상태 - 전체 화면 */
                    <div className="flex items-center justify-center py-16">
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-3 text-neutral-600 mb-4">
                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-emerald-500"></div>
                                <span className="text-lg font-medium">AI 챌린지 정보를 불러오는 중...</span>
                            </div>
                            <p className="text-sm text-neutral-500">잠시만 기다려주세요</p>
                        </div>
                    </div>
                ) : (
                    /* 로딩 완료 - 챌린지 목록 표시 */
                    challenges.map((item) => (
                        <ChallengeCard key={item.id} item={item} />
                    ))
                )}

                {/* 지난 대결 보기 - 제목만 */}
                <h2 className="text-2xl font-bold mb-4 text-left ml-[15px]">지난 대결 보기</h2>

                {/* 캐러셀 카드 틀만 감싸기 (타이틀 X, 보더 O) */}
                <SectionCard bordered className="mt-2 overflow-visible">
                    <div className="relative">
                        {/* ⬅️ 왼쪽 버튼: 카드 밖으로 살짝 */}
                        <button
                            className="
        absolute left-[-10px] md:left-[-14px] top-1/2 -translate-y-1/2
        rounded-full border border-neutral-300 bg-white p-2 shadow-sm hover:bg-neutral-50
      "
                            aria-label="이전"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>

                        {/* 캐러셀 그리드: 타이틀 라인과 정렬(ml[15px] ↔ pl[15px]) / 4열 */}
                        <div className="grid grid-cols-1 gap-4 pl-[15px] pr-[15px] sm:grid-cols-2 lg:grid-cols-4">
                            {[0, 1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="h-[160px] rounded-2xl border border-neutral-200 bg-neutral-50/60 shadow-[inset_0_1px_0_rgba(0,0,0,0.03)]"
                                />
                            ))}
                        </div>

                        {/* ➡️ 오른쪽 버튼: 카드 밖으로 살짝 */}
                        <button
                            className="
        absolute right-[-10px] md:right-[-14px] top-1/2 -translate-y-1/2
        rounded-full border border-neutral-300 bg-white p-2 shadow-sm hover:bg-neutral-50
      "
                            aria-label="다음"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </SectionCard>
            </main>
        </div>
    );
}
