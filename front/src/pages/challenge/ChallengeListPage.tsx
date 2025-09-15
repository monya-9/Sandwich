// src/pages/challenge/ChallengeListPage.tsx
import React from "react";
import { dummyChallenges } from "../../data/Challenge/dummyChallenges";
import ChallengeCard from "../../components/challenge/ChallengeCard";
import { StatusBadge, Countdown, SectionCard } from "../../components/challenge/common";
import WinnersSection from "../../components/challenge/WinnersSection";


import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ChallengeListPage() {
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

            {/* WinnersSection */}
            <WinnersSection />

            <main className="mx-auto max-w-screen-xl px-4 py-6 md:px-6 md:py-10">
                {dummyChallenges.map((item) => (
                    <ChallengeCard key={item.id} item={item} />
                ))}

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
