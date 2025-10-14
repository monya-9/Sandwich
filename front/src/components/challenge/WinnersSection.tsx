import React from "react";
import { SectionCard } from "./common";
import { Medal } from "lucide-react";
import { codeWinners, portfolioWinners, WinnerEntry } from "../../data/Challenge/winnersDummy";

/** 메달 색상 */
const rankColor = (rank: 1 | 2 | 3) =>
    rank === 1 ? "text-amber-500" : rank === 2 ? "text-slate-400" : "text-orange-500";

/** 1·2·3등 카드(포디움 바 완전 제거) */
function WinnerCard({ data }: { data: WinnerEntry }) {
    return (
        <div className="flex flex-col items-center gap-2">
            <Medal className={`h-6 w-6 ${rankColor(data.rank)}`} />

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-[var(--avatar-bg)] text-[13px] font-bold text-neutral-900 dark:text-white">
                {data.userInitial}
            </div>

            <div className="text-center leading-tight">
                <div className="text-[13px] font-semibold text-neutral-900 dark:text-white">{data.name}</div>
                {data.teamName && <div className="text-[12px] text-neutral-500 dark:text-white/70">{data.teamName}</div>}
            </div>

            <div className="rounded-xl bg-neutral-900/90 px-3 py-1 text-[12px] font-semibold text-white shadow-sm">
                {data.credits.toLocaleString()} 크레딧
            </div>
        </div>
    );
}

/** 박스 본문(제목은 카드 밖으로 빼고, 카드 높이 동일화) */
function WinnersBox({ items }: { items: WinnerEntry[] }) {
    // 가운데 1등 보이도록 2-1-3 순서
    const byOrder: WinnerEntry[] = [
        items.find((w) => w.rank === 2)!,
        items.find((w) => w.rank === 1)!,
        items.find((w) => w.rank === 3)!,
    ];

    return (
        <SectionCard
            bordered
            // ⚡️ 두 박스 높이 동일 고정 (내용과 무관하게 동일)
            className="!px-5 !py-5 h-full min-h-[220px]"
        >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                {byOrder.map((w) => (
                    <WinnerCard key={w.rank} data={w} />
                ))}
            </div>
        </SectionCard>
    );
}

/** 섹션 래퍼: 제목은 카드 바깥 + 두 카드 동일 높이 보장 */
export default function WinnersSection() {
    return (
        <div className="mx-auto mt-5 max-w-screen-xl px-4 md:px-6">
            <div className="grid gap-4 md:grid-cols-2 items-stretch">
                {/* 왼쪽: 코드 */}
                <div className="flex flex-col">
                    <h3 className="mb-3 text-[16px] font-extrabold tracking-[-0.01em]">
                        지난 코드 챌린지 TOP Winners
                    </h3>
                    {/* SectionCard가 h-full이라 동일 높이로 스트레치 */}
                    <div className="flex-1">
                        <WinnersBox items={codeWinners} />
                    </div>
                </div>

                {/* 오른쪽: 포트폴리오 */}
                <div className="flex flex-col">
                    <h3 className="mb-3 text-[16px] font-extrabold tracking-[-0.01em]">
                        지난 포트폴리오 챌린지 TOP Winners
                    </h3>
                    <div className="flex-1">
                        <WinnersBox items={portfolioWinners} />
                    </div>
                </div>
            </div>
        </div>
    );
}
