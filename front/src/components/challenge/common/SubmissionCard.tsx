// src/components/challenge/common/SubmissionCard.tsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Eye, MessageSquare } from "lucide-react";

export interface SubmissionCardData {
    id: number;
    authorId?: number; // 사용자 ID 추가
    authorInitial: string;
    authorName: string;
    authorRole: string;
    authorProfileImageUrl?: string; // 프로필 이미지 URL 추가
    teamName?: string;
    title: string;
    summary?: string;  // 포트폴리오용
    desc?: string;     // 코드 챌린지용
    coverUrl?: string; // 커버 이미지
    language?: string; // 기술 스택/언어
    images?: string[]; // 추가 이미지들
    likes: number;
    views: number;
    comments: number;
    liked: boolean;
}

interface SubmissionCardProps {
    submission: SubmissionCardData;
    onLike: (e: React.MouseEvent, id: number) => void;
    href: string;
    actionText?: string;
    challengeType?: 'portfolio' | 'code'; // 챌린지 타입 추가
}

export function SubmissionCard({ submission, onLike, href, actionText = "평가하러 가기 →", challengeType = 'portfolio' }: SubmissionCardProps) {
    const navigate = useNavigate();
    
    // 사용자 프로필로 이동하는 핸들러
    const handleAuthorClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (submission.authorId) {
            navigate(`/users/${submission.authorId}`);
        }
    };
    
    return (
        <div className="h-full rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow hover:shadow-md transition-shadow bg-white dark:bg-neutral-900/60 flex flex-col overflow-hidden">
                {/* 작성자 정보 - 썸네일 위에 */}
                <div className="p-4 pb-2 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        {/* 아바타 - 클릭 가능 */}
                        <div 
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-[12px] font-bold text-neutral-900 dark:text-neutral-100 cursor-pointer hover:opacity-80 transition-opacity overflow-hidden"
                            onClick={handleAuthorClick}
                        >
                            {submission.authorProfileImageUrl ? (
                                <img 
                                    src={submission.authorProfileImageUrl}
                                    alt={submission.authorName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        target.parentElement!.innerHTML = `<span class="text-[12px] font-bold">${submission.authorInitial}</span>`;
                                    }}
                                />
                            ) : (
                                <span>{submission.authorInitial}</span>
                            )}
                        </div>
                        {/* 사용자명 & 직책 */}
                        <div className="leading-tight">
                            <div className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-100">
                                <span 
                                    className="cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={handleAuthorClick}
                                >
                                    {submission.authorName}{submission.teamName ? ` · ${submission.teamName}` : ""}
                                </span>
                            </div>
                            <div className="text-[11px] text-neutral-600 dark:text-neutral-400">{submission.authorRole}</div>
                        </div>
                    </div>
                </div>

                {/* 썸네일 이미지 - 포트폴리오만 표시 */}
                {challengeType === 'portfolio' && (
                    <div className="aspect-[4/3] overflow-hidden mx-4 mb-3 rounded-lg flex-shrink-0 bg-neutral-100 dark:bg-neutral-800">
                        {submission.coverUrl ? (
                            <img 
                                src={submission.coverUrl} 
                                alt={submission.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400 dark:text-neutral-600">
                                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        )}
                    </div>
                )}
                
                <div className="px-4 pb-4 flex-1 flex flex-col min-h-0">
                    <div className="mb-1 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-2 min-h-[2.6em] break-words flex-shrink-0">{submission.title}</div>
                    
                    {/* 기술 스택 표시 - 공간 고정 */}
                    <div className="mb-1 min-h-[20px] flex-shrink-0">
                    {submission.language && (
                            <span className="inline-block px-2 py-0.5 text-[10px] bg-emerald-50 text-emerald-700 rounded-full break-words">
                                {submission.language}
                            </span>
                        )}
                        </div>
                    
                    <p className="mb-2 text-[12px] leading-5 text-neutral-800 dark:text-neutral-200 break-words line-clamp-3 flex-1 overflow-hidden">
                        {submission.summary || submission.desc}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-neutral-700 dark:text-neutral-300 mt-auto flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => onLike(e, submission.id)}
                                className={`inline-flex items-center gap-1 ${submission.liked ? "text-rose-500" : "hover:text-neutral-900 dark:hover:text-neutral-50"}`}
                            >
                                <Heart className="h-3 w-3" fill={submission.liked ? "currentColor" : "none"} />
                                {submission.likes}
                            </button>
                            <span className="inline-flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {submission.views}
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {submission.comments}
                            </span>
                        </div>
                        <Link 
                            to={href} 
                            className="text-[11px] font-semibold text-neutral-900 dark:text-neutral-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                            {actionText}
                        </Link>
                    </div>
                </div>
        </div>
    );
}
