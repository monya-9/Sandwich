import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { SectionCard } from "../../components/challenge/common";
import { ChevronLeft, Heart, Eye, MessageSquare } from "lucide-react";
import { getChallengeDetail } from "../../data/Challenge/challengeDetailDummy";
import {
    getCodeSubmissions,
    getCodeComments,
    addCodeComment,
    incViewCode,
} from "../../data/Challenge/submissionsDummy";
import type { CodeChallengeDetail } from "../../data/Challenge/challengeDetailDummy";

export default function CodeSubmissionDetailPage() {
    const { id: idStr, submissionId: sidStr } = useParams();
    const id = Number(idStr || 1);
    const sid = Number(sidStr);
    const nav = useNavigate();

    const detail = useMemo(() => getChallengeDetail(id) as CodeChallengeDetail, [id]);
    const [item, setItem] = useState(() => getCodeSubmissions(id).find((x) => x.id === sid));
    const [comments, setComments] = useState(() => getCodeComments(sid));
    const [text, setText] = useState("");

    useEffect(() => {
        // 조회수 증가
        incViewCode(id, sid);
        setItem(getCodeSubmissions(id).find((x) => x.id === sid));
    }, [id, sid]);

    if (!item) return <div className="p-6 text-[13.5px]">제출물을 찾을 수 없습니다.</div>;

    const headerText = `샌드위치 코드 챌린지: 🧮 ${detail.title.replace(/^코드 챌린지:\s*/, "")}`;

    const submitComment = () => {
        const v = text.trim();
        if (!v) return;
        addCodeComment(sid, v);
        setComments(getCodeComments(sid));
        setItem(getCodeSubmissions(id).find((x) => x.id === sid)); // 댓글 수 갱신
        setText("");
    };

    return (
        <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-10">
            <div className="mb-4 flex items-center gap-2">
                <button
                    onClick={() => nav(`/challenge/code/${id}/submissions`)}
                    className="mr-1 inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100"
                    aria-label="뒤로가기"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <h1 className="text-[22px] font-extrabold tracking-[-0.01em] md:text-[24px]">{headerText}</h1>
            </div>

            <SectionCard className="!px-5 !py-5">
                {/* 작성자 */}
                <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-[13px] font-bold">
                        {item.authorInitial}
                    </div>
                    <div className="leading-tight">
                        <div className="text-[13px] font-semibold text-neutral-900">{item.authorName}</div>
                        <div className="text-[12.5px] text-neutral-600">{item.authorRole}</div>
                    </div>
                </div>

                <div className="mb-2 text-[16px] font-bold">{item.title}</div>

                <p className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-5 text-[13.5px] leading-7 whitespace-pre-wrap">
                    {item.desc}
                    {item.snippet ? `\n\n--- 코드 참고 ---\n${item.snippet}` : ""}
                </p>

                {/* 메트릭 */}
                <div className="mt-4 flex items-center gap-4 text-[12.5px] text-neutral-700">
                    <span className="inline-flex items-center gap-1"><Heart className="h-4 w-4" /> {item.likes}</span>
                    <span className="inline-flex items-center gap-1"><Eye className="h-4 w-4" /> {item.views}</span>
                    <span className="inline-flex items-center gap-1"><MessageSquare className="h-4 w-4" /> {item.comments}</span>
                </div>
            </SectionCard>

            {/* 댓글 */}
            <SectionCard className="!px-5 !py-5 mt-6">
                <h2 className="mb-3 text-[15px] font-bold">댓글 {comments.length}</h2>

                <div className="space-y-4">
                    {comments.map((c) => (
                        <div key={c.id} className="rounded-2xl border p-4">
                            <div className="mb-1 flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-[12.5px] font-bold">
                                    {c.authorInitial}
                                </div>
                                <div className="leading-tight">
                                    <div className="text-[13px] font-semibold text-neutral-900">{c.authorName}</div>
                                    {c.authorRole && <div className="text-[12px] text-neutral-500">{c.authorRole}</div>}
                                </div>
                            </div>
                            <div className="whitespace-pre-wrap text-[13.5px] leading-7 text-neutral-800">{c.content}</div>
                            <div className="mt-1 text-xs text-neutral-500">{c.createdAt}</div>
                        </div>
                    ))}
                </div>

                {/* 입력 */}
                <div className="mt-5 rounded-2xl border p-4">
          <textarea
              className="h-24 w-full resize-none rounded-xl border bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
              placeholder="댓글을 작성해보세요."
              value={text}
              onChange={(e) => setText(e.target.value)}
          />
                    <div className="mt-2 flex justify-end">
                        <button
                            onClick={submitComment}
                            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
                        >
                            등록하기
                        </button>
                    </div>
                </div>
            </SectionCard>

            <div className="mt-6 flex justify-end">
                <Link to={`/challenge/code/${id}/submissions`} className="text-[13px] font-semibold underline">
                    목록으로
                </Link>
            </div>
        </div>
    );
}
