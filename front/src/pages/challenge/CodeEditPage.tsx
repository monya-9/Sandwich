import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchChallengeSubmissionDetail, updateChallengeSubmission } from "../../api/submissionApi";
import { SectionCard, CTAButton } from "../../components/challenge/common";
import Toast from "../../components/common/Toast";

type Form = {
    title: string;
    repoUrl: string;
    language: "node" | "python";
    entrypoint: string;
    note: string;
};

export default function CodeEditPage() {
    const { submissionId: sidStr, id: cidStr } = useParams();
    const submissionId = Number(sidStr);
    const challengeId = Number(cidStr);
    const nav = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successToast, setSuccessToast] = useState<{ visible: boolean; message: string }>({
        visible: false,
        message: ''
    });
    const [form, setForm] = useState<Form>({ title: "", repoUrl: "", language: "node", entrypoint: "npm start", note: "" });

    useEffect(() => {
        (async () => {
            try {
                const detail = await fetchChallengeSubmissionDetail(challengeId, submissionId);
                setForm({
                    title: detail.title ?? "",
                    repoUrl: detail.repoUrl ?? "",
                    language: (detail.language as "node" | "python") ?? "node",
                    entrypoint: detail.entrypoint ?? "npm start",
                    note: detail.note ?? "",
                });
            } finally {
                setLoading(false);
            }
        })();
    }, [submissionId]);

    const canSave = !!form.title.trim() && /^https?:\/\//.test(form.repoUrl) && !!form.entrypoint.trim();

    const onSave = async () => {
        if (!canSave || saving) return;
        setSaving(true);
        try {
            await updateChallengeSubmission(challengeId, submissionId, {
                title: form.title.trim(),
                repoUrl: form.repoUrl.trim(),
                desc: form.note?.trim() || "",
                code: {
                    language: form.language,
                    entrypoint: form.entrypoint.trim(),
                    commitSha: "a1b2c3d4e5f6" // 임시 hex 값
                }
            });
            setSuccessToast({
                visible: true,
                message: "수정되었습니다."
            });
            nav(`/challenge/code/${challengeId}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-6 text-[13.5px]">불러오는 중…</div>;

    return (
        <>
            <Toast
                visible={successToast.visible}
                message={successToast.message}
                type="success"
                size="medium"
                autoClose={3000}
                closable={true}
                onClose={() => setSuccessToast(prev => ({ ...prev, visible: false }))}
            />
            <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6 md:py-10">
            <h1 className="mb-4 text-[20px] font-extrabold tracking-[-0.01em] md:text-[22px]">코드 제출 수정</h1>
            <SectionCard className="!px-5 !py-5">
                <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-[13px] font-semibold text-neutral-800">제목</label>
                        <input
                            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[13.5px]"
                            value={form.title}
                            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[13px] font-semibold text-neutral-800">리포지토리</label>
                        <input
                            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[13.5px]"
                            value={form.repoUrl}
                            onChange={(e) => setForm((f) => ({ ...f, repoUrl: e.target.value }))}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-[13px] font-semibold text-neutral-800">언어</label>
                            <select
                                className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[13.5px]"
                                value={form.language}
                                onChange={(e) => setForm((f) => ({ ...f, language: e.target.value as "node" | "python" }))}
                            >
                                <option value="node">Node.js</option>
                                <option value="python">Python 3</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[13px] font-semibold text-neutral-800">엔트리포인트</label>
                            <input
                                className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[13.5px]"
                                value={form.entrypoint}
                                onChange={(e) => setForm((f) => ({ ...f, entrypoint: e.target.value }))}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[13px] font-semibold text-neutral-800">비고</label>
                        <textarea
                            rows={3}
                            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[13.5px]"
                            value={form.note}
                            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                        />
                    </div>

                    <div className="flex justify-end">
                        <CTAButton as="button" onClick={onSave} disabled={!canSave || saving}>
                            {saving ? "저장 중…" : "저장하기"}
                        </CTAButton>
                    </div>
                </div>
            </SectionCard>
        </div>
        </>
    );
}
