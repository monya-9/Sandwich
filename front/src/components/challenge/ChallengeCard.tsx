// src/components/challenge/ChallengeCard.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAdmin } from "../../utils/authz";
import { deleteChallenge } from "../../api/challengeApi";

export type ChallengeCardData = {
    id: number;
    type: "CODE" | "PORTFOLIO";
    title: string;          // ← 이 제목은 카드 바깥으로!
    subtitle: string;
    description: React.ReactNode;
    ctaLabel: string;
    /** 선택: 명시하면 이 링크 우선, 없으면 타입별 디테일 경로로 이동 */
    ctaHref?: string;
    /** 관리자 전용 수정 링크(있을 때만 표시) */
    adminEditHref?: string;
    /** 선택: 챌린지 목록으로 이동 */
    listHref?: string;
    // 🔥 새로 추가
    summary?: string;       // ruleJson에서 파싱한 요약
    must?: string[];        // ruleJson에서 파싱한 필수 조건들
    startDate?: string;     // 시작일 정보
};

const detailHref = (type: "CODE" | "PORTFOLIO", id: number) =>
    type === "CODE" ? `/challenge/code/${id}` : `/challenge/portfolio/${id}`;

export default function ChallengeCard({ item }: { item: ChallengeCardData }) {
    const href = item.ctaHref ?? detailHref(item.type, item.id);
    const admin = isAdmin();
    const navigate = useNavigate();
    const [deleteOpen, setDeleteOpen] = useState(false);

    return (
        <section className="mb-8">
            {/* 제목 */}
            <h3 className="text-2xl font-extrabold mb-4 text-left ml-[15px] text-black dark:text-white">
                {item.title}
            </h3>

            {/* 카드 본문 */}
            <div className="rounded-2xl border border-neutral-200 dark:border-[var(--border-color)] bg-white dark:bg-[var(--surface)] p-5 md:p-7">
                <div className="mb-1 flex items-center justify-between">
                    <p className="text-[15px] font-semibold text-black dark:text-white">{item.subtitle}</p>
                    {admin && item.adminEditHref && (
                        <div className="flex gap-2">
                            <Link
                                to={item.adminEditHref}
                                className="inline-flex items-center gap-1 rounded-xl border border-neutral-300 dark:border-[var(--border-color)] bg-white dark:bg-[var(--surface)] px-3 py-1.5 text-[13px] font-semibold text-black dark:text-white hover:bg-neutral-50 dark:hover:bg-white/10"
                            >
                                챌린지 수정
                            </Link>
                            <button
                                onClick={() => setDeleteOpen(true)}
                                className="inline-flex items-center gap-1 rounded-xl border border-red-300 bg-white px-3 py-1.5 text-[13px] font-semibold text-red-600 hover:bg-red-50"
                            >
                                챌린지 삭제
                            </button>
                        </div>
                    )}
                </div>
                <div className="text-[13.5px] leading-6 text-neutral-800 dark:text-[var(--text-secondary)]">
                    {item.description}
                </div>

                {/* Summary 표시 */}
                {item.summary && (
                    <div className="mt-4 p-3 bg-neutral-50 rounded-lg">
                        <div className="font-medium text-neutral-700 mb-2 text-sm">📋 문제 설명</div>
                        <div className="text-xs leading-relaxed text-neutral-600">
                            {item.summary.length > 200 
                                ? `${item.summary.substring(0, 200)}...`
                                : item.summary
                            }
                        </div>
                    </div>
                )}

                {/* 시작일 정보 - 문제 설명 박스 아래 */}
                {item.startDate && (
                    <div className="mt-3 text-xs text-neutral-500">
                        📅 시작일: {item.startDate}
                    </div>
                )}


                <div className="mt-3 flex justify-end gap-2">
                    <Link
                        to={href}
                        className="inline-flex items-center gap-1 rounded-xl border border-neutral-300 dark:border-[var(--border-color)] bg-white dark:bg-[var(--surface)] px-3 py-1.5 text-[13px] font-semibold text-black dark:text-white hover:bg-neutral-50 dark:hover:bg-white/10"
                    >
                        {item.ctaLabel} →
                    </Link>
                </div>
            </div>
            {/* 삭제 확인 모달 */}
            {deleteOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-sm rounded-lg bg-white p-5">
                        <div className="mb-3 text-[15px] font-bold text-red-600">챌린지 삭제</div>
                        <ul className="mb-4 list-disc pl-5 text-[13.5px] leading-6 text-neutral-800">
                            <li>삭제 후 되돌릴 수 없습니다.</li>
                            <li>관련 데이터에 영향이 있을 수 있습니다.</li>
                        </ul>
                        <div className="mb-5 text-[13.5px]">정말로 이 챌린지를 삭제하시겠습니까?</div>
                        <div className="flex justify-end gap-2">
                            <button className="rounded-md border px-3 py-1.5 text-[13px]" onClick={() => setDeleteOpen(false)}>취소</button>
                            <button
                                className="rounded-md bg-red-600 px-3 py-1.5 text-[13px] font-semibold text-white"
                                onClick={async () => {
                                    try {
                                        await deleteChallenge(item.id, { force: true });
                                        setDeleteOpen(false);
                                        navigate(0);
                                    } catch (e) {
                                        // eslint-disable-next-line no-console
                                        console.error('delete challenge failed', e);
                                        setDeleteOpen(false);
                                        alert('삭제 중 오류가 발생했습니다.');
                                    }
                                }}
                            >
                                삭제
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
