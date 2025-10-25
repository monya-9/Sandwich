// src/components/challenge/ChallengeCard.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAdmin } from "../../utils/authz";
import { deleteChallenge } from "../../api/challengeApi";
import ConfirmModal from "../common/ConfirmModal";

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
    /** 마감 기준 시간(코드:endAt, 포트폴리오:voteEndAt|endAt) – 메인 자동 이동 스케줄링용 */
    expireAtMs?: number;
    /** 🔥 포트폴리오 챌린지 중간 단계 전환용 시간 정보 */
    endAtMs?: number;           // 제출 종료 시간 (진행중 → 투표대기)
    voteStartAtMs?: number;     // 투표 시작 시간 (투표대기 → 투표중)
    voteEndAtMs?: number;       // 투표 종료 시간 (투표중 → 종료)
    /** 상태 배지 텍스트 (선택) */
    statusBadge?: string;
    /** 상태 배지 스타일 클래스 (선택) */
    statusBadgeClass?: string;
};

const detailHref = (type: "CODE" | "PORTFOLIO", id: number) =>
    type === "CODE" ? `/challenge/code/${id}` : `/challenge/portfolio/${id}`;

export default function ChallengeCard({ item }: { item: ChallengeCardData }) {
    const href = item.ctaHref ?? detailHref(item.type, item.id);
    const admin = isAdmin();
    const navigate = useNavigate();
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [forceDeleteModalOpen, setForceDeleteModalOpen] = useState(false);

    return (
        <section className="mb-8">
            {/* 제목 */}
            <h3 className="text-2xl font-extrabold mb-4 text-left ml-[15px] text-black dark:text-white flex items-center gap-2">
                <span>{item.title}</span>
                {item.statusBadge && (
                    <span
                        className={`inline-flex items-center rounded-full border px-2 py-1 text-[12px] font-medium ${
                            item.statusBadgeClass || 'border-neutral-300 text-neutral-600'
                        }`}
                    >
                        {item.statusBadge}
                    </span>
                )}
            </h3>

            {/* 카드 본문 */}
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900/60 p-5 md:p-7">
                <div className="mb-1 flex items-center justify-between">
                    <p className="text-[15px] font-semibold text-black dark:text-neutral-100">{item.subtitle}</p>
                    {admin && item.adminEditHref && (
                        <div className="flex gap-2">
                            <Link
                                to={item.adminEditHref}
                                className="inline-flex items-center gap-1 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-[13px] font-semibold text-black dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-700/60"
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
                <div className="text-[13.5px] leading-6 text-neutral-800 dark:text-neutral-200">
                    {item.description}
                </div>

                {/* Summary 표시 */}
                {item.summary && (
                    <div className="mt-4 p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg">
                        <div className="font-medium text-neutral-700 dark:text-neutral-200 mb-2 text-sm">📋 문제 설명</div>
                        <div className="text-[13px] leading-6 text-neutral-700 dark:text-neutral-300 whitespace-pre-line">
                            {item.summary}
                        </div>
                    </div>
                )}

                {/* 시작일 정보 - 문제 설명 박스 아래 */}
                {item.startDate && (
                    <div className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
                        📅 시작일: {item.startDate}
                    </div>
                )}


                <div className="mt-3 flex justify-end gap-2">
                    {href === "#" ? (
                        <button
                            disabled
                            className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 text-[13px] font-semibold text-neutral-400 dark:text-neutral-500 cursor-not-allowed"
                        >
                            {item.ctaLabel}
                        </button>
                    ) : (
                        <Link
                            to={href}
                            className="inline-flex items-center gap-1 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-[13px] font-semibold text-black dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-700/60"
                        >
                            {item.ctaLabel} →
                        </Link>
                    )}
                </div>
            </div>
            {/* 삭제 확인 모달 */}
            <ConfirmModal
                visible={deleteOpen}
                title="챌린지 삭제"
                message={`삭제 후 되돌릴 수 없습니다.\n관련 데이터에 영향이 있을 수 있습니다.\n\n정말로 이 챌린지를 삭제하시겠습니까?`}
                confirmText="삭제"
                cancelText="취소"
                confirmButtonColor="red"
                onConfirm={async () => {
                    try {
                        // 1. 먼저 일반 삭제 시도 (force 없이)
                        await deleteChallenge(item.id);
                        setDeleteOpen(false);
                        navigate(0);
                    } catch (e: any) {
                        // eslint-disable-next-line no-console
                        console.error('delete challenge failed', e);
                        // 2. HAS_DEPENDENCIES 에러인 경우, 강제 삭제 확인 모달 표시
                        if (e.response?.data?.code === 'HAS_DEPENDENCIES') {
                            setDeleteOpen(false);
                            setForceDeleteModalOpen(true);
                        } else {
                            setDeleteOpen(false);
                            alert(e.response?.data?.message || '삭제 중 오류가 발생했습니다.');
                        }
                    }
                }}
                onCancel={() => setDeleteOpen(false)}
            />
            
            {/* 강제 삭제 확인 모달 */}
            <ConfirmModal
                visible={forceDeleteModalOpen}
                title="⚠️ 챌린지 강제 삭제"
                message={`이 챌린지에는 제출물이 존재합니다.\n강제 삭제 시 모든 제출물이 함께 삭제됩니다.\n\n정말 강제 삭제하시겠습니까?`}
                confirmText="강제 삭제"
                cancelText="취소"
                confirmButtonColor="red"
                onConfirm={async () => {
                    try {
                        await deleteChallenge(item.id, { force: true });
                        setForceDeleteModalOpen(false);
                        navigate(0);
                    } catch (e2: any) {
                        setForceDeleteModalOpen(false);
                        alert(e2.response?.data?.message || '삭제 중 오류가 발생했습니다.');
                    }
                }}
                onCancel={() => {
                    setForceDeleteModalOpen(false);
                }}
            />
        </section>
    );
}
