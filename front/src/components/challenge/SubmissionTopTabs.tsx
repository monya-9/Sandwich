import React from "react";
import { Link } from "react-router-dom";

export default function SubmissionTopTabs({
                                              active,
                                              codeHref,
                                              portfolioHref,
                                          }: {
    active: "code" | "portfolio";
    codeHref: string;
    portfolioHref: string;
}) {
    const base = "rounded-full px-3 py-1.5 text-[13px] border border-neutral-300 bg-white"; // ✅ hover 제거
    const activeCls = "bg-emerald-600 text-white border-emerald-600";
    return (
        <div className="mb-3 flex gap-2">
            <Link to={codeHref} className={`${base} ${active === "code" ? activeCls : ""}`}>
                코드 챌린지
            </Link>
            <Link to={portfolioHref} className={`${base} ${active === "portfolio" ? activeCls : ""}`}>
                포트폴리오 챌린지
            </Link>
        </div>
    );
}
