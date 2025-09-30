import React from "react";
import { sendProjectProposal, type ProjectPayload } from "../../../../api/message.presets";
import Toast from "../../Toast";

type Props = {
    targetUserId: number;
    onSent?: () => void;
};

const ProjectProposalForm: React.FC<Props> = ({ targetUserId, onSent }) => {
    const [form, setForm] = React.useState<ProjectPayload>({
        title: "",
        contact: "",
        budget: "",
        description: "",
    });
    const [loading, setLoading] = React.useState(false);
    const [errorToast, setErrorToast] = React.useState<{ visible: boolean; message: string }>({
        visible: false,
        message: ''
    });
    const [successToast, setSuccessToast] = React.useState<{ visible: boolean; message: string }>({
        visible: false,
        message: ''
    });

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.currentTarget;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim()) {
            setErrorToast({
                visible: true,
                message: "제목을 입력해 주세요."
            });
            return;
        }
        setLoading(true);
        try {
            await sendProjectProposal(targetUserId, form);
            onSent?.();
            setSuccessToast({
                visible: true,
                message: "프로젝트 제안을 보냈어요."
            });
            setForm({ title: "", contact: "", budget: "", description: "" });
        } catch (err: any) {
            setErrorToast({
                visible: true,
                message: err?.response?.data?.message || "전송에 실패했어요."
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Toast
                visible={errorToast.visible}
                message={errorToast.message}
                type="error"
                size="medium"
                autoClose={3000}
                closable={true}
                onClose={() => setErrorToast(prev => ({ ...prev, visible: false }))}
            />
            <Toast
                visible={successToast.visible}
                message={successToast.message}
                type="success"
                size="medium"
                autoClose={3000}
                closable={true}
                onClose={() => setSuccessToast(prev => ({ ...prev, visible: false }))}
            />
            <form onSubmit={submit} className="space-y-3">
            <input name="title" value={form.title} onChange={onChange} placeholder="프로젝트 제목" className="w-full border rounded px-3 py-2" />
            <input name="contact" value={form.contact} onChange={onChange} placeholder="연락처" className="w-full border rounded px-3 py-2" />
            <input name="budget" value={String(form.budget)} onChange={onChange} placeholder="예산" className="w-full border rounded px-3 py-2" />
            <textarea name="description" value={form.description} onChange={onChange} placeholder="프로젝트 내용" className="w-full border rounded px-3 py-2 h-28" />
            <button type="submit" disabled={loading} className="px-4 py-2 bg-gray-900 text-white rounded">
                {loading ? "전송 중..." : "프로젝트 제안 보내기"}
            </button>
        </form>
        </>
    );
};

export default ProjectProposalForm;
