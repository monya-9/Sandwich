// src/components/challenge/common/SubmissionCard.tsx
import React from "react";
import { Link } from "react-router-dom";
import { Heart, Eye, MessageSquare } from "lucide-react";
import { SectionCard } from "./index";

export interface SubmissionCardData {
    id: number;
    authorInitial: string;
    authorName: string;
    authorRole: string;
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
}

export function SubmissionCard({ submission, onLike, href, actionText = "평가하러 가기 →" }: SubmissionCardProps) {
    return (
        <Link to={href} className="block">
            <SectionCard bordered className="!p-0 hover:shadow-md transition-shadow bg-white dark:bg-neutral-900/60 border-neutral-200 dark:border-neutral-700">
                {/* 작성자 정보 - 썸네일 위에 */}
                <div className="p-4 pb-2">
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-[12px] font-bold text-neutral-900 dark:text-neutral-100">
                            {submission.authorInitial}
                        </div>
                        <div className="leading-tight">
                            <div className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-100">
                                {submission.authorName}{submission.teamName ? ` · ${submission.teamName}` : ""}
                            </div>
                            <div className="text-[11px] text-neutral-600 dark:text-neutral-400">{submission.authorRole}</div>
                        </div>
                    </div>
                </div>

                {/* 썸네일 이미지 - 직각 모서리, 크기 축소 */}
                {submission.coverUrl && (
                    <div className="aspect-[4/3] overflow-hidden mx-4 mb-3 rounded-lg">
                        <img 
                            src={submission.coverUrl} 
                            alt={submission.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}
                
                <div className="px-4 pb-4">
                    <div className="mb-1 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">{submission.title}</div>
                    
                    {/* 기술 스택 표시 */}
                    {submission.language && (
                        <div className="mb-1">
                            <span className="inline-block px-2 py-0.5 text-[10px] bg-emerald-50 text-emerald-700 rounded-full">
                                {submission.language}
                            </span>
                        </div>
                    )}
                    
                    <p className="mb-3 text-[12px] leading-5 text-neutral-800 dark:text-neutral-200 line-clamp-3">
                        {submission.summary || submission.desc}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-neutral-700 dark:text-neutral-300">
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
                        <span className="text-[11px] font-semibold text-neutral-900 dark:text-neutral-100">{actionText}</span>
                    </div>
                </div>
            </SectionCard>
        </Link>
    );
}
