import React from "react";
import { sendJobOffer, type JobOfferPayload } from "../../../../api/message.presets";
import Toast from "../../Toast";

type Props = {
    targetUserId: number;
    onSent?: () => void;
};

const JobOfferForm: React.FC<Props> = ({ targetUserId, onSent }) => {
    const [form, setForm] = React.useState<JobOfferPayload>({
        companyName: "",
        salary: "",
        location: "",
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
        if (!form.companyName.trim()) {
            setErrorToast({
                visible: true,
                message: "회사 이름을 입력해 주세요."
            });
            return;
        }
        setLoading(true);
        try {
            await sendJobOffer(targetUserId, form);
            onSent?.();
            setSuccessToast({
                visible: true,
                message: "채용 제안을 보냈어요."
            });
            setForm({ companyName: "", salary: "", location: "", description: "" });
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
            <input name="companyName" value={form.companyName} onChange={onChange} placeholder="회사 이름" className="w-full border rounded px-3 py-2" />
            <input name="salary" value={form.salary} onChange={onChange} placeholder="연봉 (예: 4,000 - 6,000만원)" className="w-full border rounded px-3 py-2" />
            <input name="location" value={form.location} onChange={onChange} placeholder="근무 위치" className="w-full border rounded px-3 py-2" />
            <textarea name="description" value={form.description} onChange={onChange} placeholder="내용" className="w-full border rounded px-3 py-2 h-28" />
            <button type="submit" disabled={loading} className="px-4 py-2 bg-gray-900 text-white rounded">
                {loading ? "전송 중..." : "채용 제안 보내기"}
            </button>
        </form>
        </>
    );
};

export default JobOfferForm;
