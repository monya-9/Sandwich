// src/components/challenge/ChallengeCard.tsx
import React from "react";
import { Link } from "react-router-dom";

export type ChallengeCardData = {
    id: number;
    type: "CODE" | "PORTFOLIO";
    title: string;          // ← 이 제목은 카드 바깥으로!
    subtitle: string;
    description: React.ReactNode;
    ctaLabel: string;
    /** 선택: 명시하면 이 링크 우선, 없으면 타입별 디테일 경로로 이동 */
    ctaHref?: string;
};

const detailHref = (type: "CODE" | "PORTFOLIO", id: number) =>
    type === "CODE" ? `/challenge/code/${id}` : `/challenge/portfolio/${id}`;

export default function ChallengeCard({ item }: { item: ChallengeCardData }) {
    const href = item.ctaHref ?? detailHref(item.type, item.id);

    return (
        <section className="mb-8">
            {/* 제목은 카드 밖 */}
            <h3 className="text-2xl font-extrabold mb-4 text-left ml-[15px]">
                {item.title}
            </h3>

            {/* 카드 본문 */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 md:p-7">
                <p className="text-[15px] font-semibold mb-1">{item.subtitle}</p>
                <div className="text-[13.5px] leading-6 text-neutral-800">
                    {item.description}
                </div>

                <div className="mt-3 flex justify-end">
                    <Link
                        to={href}
                        className="inline-flex items-center gap-1 rounded-xl border border-neutral-300 bg-white px-3 py-1.5 text-[13px] font-semibold hover:bg-neutral-50"
                    >
                        {item.ctaLabel} →
                    </Link>
                </div>
            </div>
        </section>
    );
}
