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
            <SectionCard bordered className="!p-0 hover:shadow-md transition-shadow">
                <div className="p-5">
                    <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-[13px] font-bold">
                            {submission.authorInitial}
                        </div>
                        <div className="leading-tight">
                            <div className="text-[12.5px] font-semibold text-neutral-900">
                                {submission.authorName}{submission.teamName ? ` · ${submission.teamName}` : ""}
                            </div>
                            <div className="text-[12.5px] text-neutral-600">{submission.authorRole}</div>
                        </div>
                    </div>

                    <div className="mb-1 text-[14px] font-semibold">{submission.title}</div>
                    <p className="min-h-[72px] text-[13px] leading-6 text-neutral-800">
                        {submission.summary || submission.desc}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[12.5px] text-neutral-700">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={(e) => onLike(e, submission.id)}
                                className={`inline-flex items-center gap-1 ${submission.liked ? "text-rose-600" : "hover:text-neutral-900"}`}
                            >
                                <Heart className="h-4 w-4" fill={submission.liked ? "currentColor" : "none"} />
                                {submission.likes}
                            </button>
                            <span className="inline-flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                {submission.views}
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                {submission.comments}
                            </span>
                        </div>
                        <span className="text-[12.5px] font-semibold">{actionText}</span>
                    </div>
                </div>
            </SectionCard>
        </Link>
    );
}
