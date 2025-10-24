// src/pages/challenge/ChallengeListPage.tsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { dummyChallenges, getDynamicChallenges, getPastChallenges } from "../../data/Challenge/dummyChallenges";
import ChallengeCard from "../../components/challenge/ChallengeCard";
import { StatusBadge, Countdown, SectionCard } from "../../components/challenge/common";
import WinnersSection from "../../components/challenge/WinnersSection";
import CodeWinnersSection from "../../components/challenge/CodeWinnersSection";
import { isAdmin } from "../../utils/authz";
import type { ChallengeCardData } from "../../components/challenge/ChallengeCard";
// 관리자 테이블/보상 로직은 전용 페이지로 이동됨

import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ChallengeListPage() {
	const navigate = useNavigate();
	const [challenges, setChallenges] = useState<ChallengeCardData[]>(dummyChallenges);
	const [pastChallenges, setPastChallenges] = useState<ChallengeCardData[]>([]);
	const [loading, setLoading] = useState(false);
	const [pastLoading, setPastLoading] = useState(false);
	const [autoRefreshing, setAutoRefreshing] = useState(false); // 🔥 자동 새로고침 상태
	const admin = isAdmin();
	const rolloverRef = useRef(false);
	
	// 지난 챌린지 캐러셀 상태
	const [pastChallengeIndex, setPastChallengeIndex] = useState(0);
	const itemsPerPage = 4;

	// 챌린지 데이터를 가져오는 함수
	const loadChallenges = React.useCallback(() => {
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

	// 현재 챌린지 데이터 가져오기 (초기 로드)
	useEffect(() => {
		loadChallenges();
	}, [loadChallenges]);

	// 페이지가 다시 활성화될 때 데이터 새로고침 (어드민에서 생성 후 돌아왔을 때)
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (!document.hidden) {
				console.log('🔄 페이지가 활성화되어 챌린지 데이터를 새로고침합니다.');
				loadChallenges();
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, [loadChallenges]);

	// 🔥 마감 시점에 정확히 자동 전환: 각 챌린지의 정확한 마감 시간에만 새로고침
	useEffect(() => {
		const timers: number[] = [];
		const now = Date.now();
		let hasExpiredChallenge = false;
		
		// 타이머를 설정하는 헬퍼 함수
		const setupTimer = (timeMs: number | undefined, label: string, challengeId: number, challengeType: string) => {
			if (!timeMs) return;
			
			const delay = timeMs - now;
			const timeDate = new Date(timeMs);
			
			if (delay <= 0) {
				console.log(`⏰ [TIMER] ${challengeType} 챌린지 ID ${challengeId} - ${label} 시간이 이미 지났습니다! (${timeDate.toLocaleString('ko-KR')})`);
				hasExpiredChallenge = true;
				return;
			}
			
			console.log(`⏱️ [TIMER] ${challengeType} 챌린지 ID ${challengeId} - ${label} 타이머 설정`);
			console.log(`   → ${label} 시간: ${timeDate.toLocaleString('ko-KR')}`);
			console.log(`   → 남은 시간: ${Math.floor(delay / 1000)}초 (${Math.floor(delay / 60000)}분)`);
			
			const t = window.setTimeout(async () => {
				console.log(`🔔 [TIMER] ${challengeType} 챌린지 ID ${challengeId} - ${label} 도달! 자동으로 새로고침합니다.`);
				
				if (rolloverRef.current) {
					console.log('⚠️ 이미 업데이트 중... 스킵');
					return;
				}
				
				rolloverRef.current = true;
				setAutoRefreshing(true); // 🔥 로딩 상태 표시
				
				try {
					// 사용자가 변화를 인지할 수 있도록 최소 1초 대기
					await new Promise(resolve => setTimeout(resolve, 1000));
					
					const [freshCurrent, freshPast] = await Promise.all([
						getDynamicChallenges(),
						getPastChallenges(),
					]);
					console.log(`✅ ${label} 자동 전환 완료!`);
					setChallenges(freshCurrent);
					setPastChallenges(freshPast);
				} catch (e) {
					console.error('❌ 자동 새로고침 실패:', e);
				} finally {
					// 부드러운 전환을 위해 약간의 딜레이 후 로딩 해제
					setTimeout(() => {
						setAutoRefreshing(false);
						rolloverRef.current = false;
					}, 500);
				}
			}, delay);
			
			timers.push(t);
		};
		
		challenges.forEach((c) => {
			if (c.type === 'CODE') {
				// 코드 챌린지: 마감 시간만 체크
				setupTimer(c.expireAtMs, '진행 종료 (마감)', c.id, 'CODE');
			} else if (c.type === 'PORTFOLIO') {
				// 포트폴리오 챌린지: 3단계 모두 체크
				console.log(`\n📋 [PORTFOLIO] 챌린지 ID ${c.id} 단계별 타이머 설정 중...`);
				
				// 1단계: 제출 종료 → 투표대기
				setupTimer(c.endAtMs, '제출 종료 (→ 투표대기)', c.id, 'PORTFOLIO');
				
				// 2단계: 투표 시작 → 투표중
				setupTimer(c.voteStartAtMs, '투표 시작 (→ 투표중)', c.id, 'PORTFOLIO');
				
				// 3단계: 투표 종료 → 지난 챌린지
				setupTimer(c.voteEndAtMs, '투표 종료 (→ 지난 챌린지)', c.id, 'PORTFOLIO');
				
				console.log(`✅ [PORTFOLIO] 챌린지 ID ${c.id} 모든 단계 타이머 설정 완료\n`);
			}
		});
		
		// 🔥 이미 마감된 챌린지가 있으면 즉시 새로고침
		if (hasExpiredChallenge && !rolloverRef.current) {
			console.log('🔄 이미 마감된 챌린지 발견! 즉시 새로고침합니다.');
			rolloverRef.current = true;
			setAutoRefreshing(true); // 🔥 로딩 상태 표시
			
			// 사용자 인지를 위한 최소 대기 시간
			Promise.all([
				new Promise(resolve => setTimeout(resolve, 1000)),
				getDynamicChallenges(),
				getPastChallenges()
			])
				.then(([_, freshCurrent, freshPast]) => {
					setChallenges(freshCurrent as any);
					setPastChallenges(freshPast as any);
					console.log('✅ 마감된 챌린지 제거 완료!');
				})
				.catch((e) => {
					console.error('❌ 즉시 새로고침 실패:', e);
				})
				.finally(() => {
					setTimeout(() => {
						setAutoRefreshing(false);
						rolloverRef.current = false;
					}, 500);
				});
		}
		
		return () => { 
			timers.forEach((t) => window.clearTimeout(t));
			if (timers.length > 0) {
				console.log(`🧹 타이머 ${timers.length}개 정리 완료`);
			}
		};
	}, [challenges]);

	// 지난 챌린지 데이터를 가져오는 함수
	const loadPastChallenges = React.useCallback(() => {
		setPastLoading(true);
		getPastChallenges()
			.then((pastData) => {
				setPastChallenges(pastData);
				setPastChallengeIndex(0); // 데이터 로드 시 인덱스 초기화
			})
			.catch((error) => {
				console.error('지난 챌린지 데이터 로딩 실패:', error);
			})
			.finally(() => {
				setPastLoading(false);
			});
	}, []);

	// 지난 챌린지 데이터 가져오기 (초기 로드)
	useEffect(() => {
		loadPastChallenges();
	}, [loadPastChallenges]);

	// 페이지가 다시 활성화될 때 지난 챌린지도 함께 새로고침
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (!document.hidden) {
				loadPastChallenges();
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, [loadPastChallenges]);
	
	// 지난 챌린지 캐러셀 핸들러
	const handlePrevPastChallenges = () => {
		setPastChallengeIndex(prev => Math.max(0, prev - itemsPerPage));
	};
	
	const handleNextPastChallenges = () => {
		setPastChallengeIndex(prev => Math.min(pastChallenges.length - itemsPerPage, prev + itemsPerPage));
	};
	
	// 현재 표시할 지난 챌린지
	const displayedPastChallenges = pastChallenges.slice(pastChallengeIndex, pastChallengeIndex + itemsPerPage);
	
	// 이전/다음 버튼 활성화 상태
	const canGoPrev = pastChallengeIndex > 0;
	const canGoNext = pastChallengeIndex + itemsPerPage < pastChallenges.length;

    // 보상 수령 기능 제거됨

	return (
		<div className="w-full bg-white dark:bg-neutral-950">
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

            {/* 보상 수령 기능 제거됨 */}

			{/* WinnersSection + Admin Actions */}
			<div className="mx-auto max-w-7xl px-4 md:px-6">
				<div className="flex items-center justify-between mt-6">
					<h2 className="sr-only">Winners</h2>
				</div>
			</div>
            <div className="relative">
                {/* TOP Winners 2단 그리드: 포트폴리오 | 코드 */}
                <div className="mx-auto max-w-screen-xl px-4 md:px-6 mt-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
                        <div className="w-full">
                            <WinnersSection />
                        </div>
                        <div className="w-full">
                            <CodeWinnersSection />
                        </div>
                    </div>
                </div>
				{admin && (
					<div className="mx-auto max-w-7xl px-4 md:px-6">
						<div className="mt-2 flex justify-end gap-2">
							<button
								className="rounded-md bg-black text-white px-3 py-2 text-sm"
								onClick={() => navigate("/admin/challenges/new")}
							>
								챌린지 생성
							</button>
							<button
								className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-50"
								onClick={() => navigate('/admin/challenges')}
							>
								챌린지/보상 테이블
							</button>
						</div>
					</div>
				)}
			</div>

			<main className="mx-auto max-w-screen-xl px-4 py-6 md:px-6 md:py-10">
				{(loading || autoRefreshing) ? (
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

				{/* 지난 챌린지 - 제목만 */}
				<h2 className="text-2xl font-bold mb-4 text-left ml-[15px] text-black dark:text-white">지난 챌린지</h2>

				{/* 캐러셀 카드 틀만 감싸기 (타이틀 X, 보더 O) */}
				<SectionCard bordered className="mt-2 overflow-visible">
					<div className="relative">
						{/* ⬅️ 왼쪽 버튼: 카드 밖으로 살짝 */}
						<button
							onClick={handlePrevPastChallenges}
							className={`
								absolute left-[-10px] md:left-[-14px] top-1/2 -translate-y-1/2
								rounded-full border p-2 shadow-sm transition-colors z-10
								${!canGoPrev
									? 'border-neutral-200 bg-neutral-50 text-neutral-300 cursor-not-allowed dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-neutral-700' 
									: 'border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700/60 dark:text-neutral-200'
								}
							`}
							aria-label="이전"
							disabled={!canGoPrev}
						>
							<ChevronLeft className="h-5 w-5" />
						</button>

						{/* 캐러셀 그리드: 타이틀 라인과 정렬(ml[15px] ↔ pl[15px]) / 4열 */}
						<div className="grid grid-cols-1 gap-4 pl-[15px] pr-[15px] sm:grid-cols-2 lg:grid-cols-4">
							{pastLoading ? (
								// 로딩 중일 때 스켈레톤
								[0, 1, 2, 3].map((i) => (
									<div
										key={i}
								className="h-[180px] rounded-2xl border border-neutral-200 bg-neutral-50/60 dark:border-neutral-800 dark:bg-neutral-800/40 shadow-[inset_0_1px_0_rgba(0,0,0,0.03)] animate-pulse"
									/>
								))
							) : displayedPastChallenges.length > 0 ? (
								// 실제 지난 챌린지 데이터
								displayedPastChallenges.map((challenge) => (
									<div
										key={challenge.id}
								className="group h-[180px] rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
										onClick={() => navigate(`/challenge/${challenge.type.toLowerCase()}/${challenge.id}`)}
									>
										<div className="flex flex-col justify-between h-full">
											<div className="flex-1 overflow-hidden min-h-0">
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
														challenge.type === 'CODE' 
													? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
													: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
													}`}>
														{challenge.type === 'CODE' ? '코드' : '포트폴리오'}
													</span>
                                                {/* 상태 배지: 지난 챌린지는 모두 종료 처리 */}
											<span className="ml-1 inline-flex items-center rounded-full border px-2 py-1 text-[12px] font-medium border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300 flex-shrink-0">
                                                    종료
                                                </span>
												</div>
											<h4 className="font-semibold text-sm text-neutral-800 dark:text-neutral-200 mb-2 line-clamp-2">
													{challenge.subtitle}
												</h4>
											<div className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-3">
													{challenge.description}
												</div>
										</div>
										<div className="flex items-center justify-between mt-2 flex-shrink-0 text-xs">
											<span className="text-neutral-500 dark:text-neutral-400">
												✅ 종료된 챌린지
											</span>
											<span className="text-neutral-500 dark:text-neutral-400">
												{challenge.ctaLabel}
											</span>
										</div>
									</div>
								</div>
							))) : (
								// 데이터가 없을 때
								<div className="col-span-full flex items-center justify-center py-8 text-neutral-500">
									<p className="text-sm">아직 지난 챌린지가 없습니다.</p>
								</div>
							)}
						</div>

						{/* ➡️ 오른쪽 버튼: 카드 밖으로 살짝 */}
						<button
							onClick={handleNextPastChallenges}
							className={`
								absolute right-[-10px] md:right-[-14px] top-1/2 -translate-y-1/2
								rounded-full border p-2 shadow-sm transition-colors z-10
								${!canGoNext
									? 'border-neutral-200 bg-neutral-50 text-neutral-300 cursor-not-allowed dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-neutral-700' 
									: 'border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700/60 dark:text-neutral-200'
								}
							`}
							aria-label="다음"
							disabled={!canGoNext}
						>
							<ChevronRight className="h-5 w-5" />
						</button>
					</div>
				</SectionCard>
			</main>

			{/* ----- Admin tables removed; moved to dedicated page ----- */}

            {/* 보상 수령 기능 제거됨 */}
		</div>
	);
}
