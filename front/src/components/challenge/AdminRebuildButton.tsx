import React, { useState } from "react";
import { isAdmin } from "../../utils/authz";
import { rebuildLeaderboard } from "../../api/challengeApi";
import Toast from "../common/Toast";

export default function AdminRebuildButton({ challengeId, onAfterRebuild, className }: { challengeId: number; onAfterRebuild?: () => void; className?: string }) {
    const admin = isAdmin();
    const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({
        visible: false,
        message: '',
        type: 'info'
    });
    const [loading, setLoading] = useState(false);

    if (!admin) return null;

    const onClick = async () => {
        if (loading) return;
        setLoading(true);
        try {
            setToast({ visible: true, message: '리더보드 재집계를 시작합니다...', type: 'info' });
            await rebuildLeaderboard(challengeId);
            setToast({ visible: true, message: '리더보드 재집계가 완료되었습니다.', type: 'success' });
            if (onAfterRebuild) onAfterRebuild();
        } catch (e: any) {
            const msg = e?.response?.data?.message || '재집계 중 오류가 발생했습니다';
            setToast({ visible: true, message: msg, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                size="medium"
                autoClose={3000}
                closable={true}
                onClose={() => setToast(prev => ({ ...prev, visible: false }))}
            />
            <button
                onClick={onClick}
                className={(className ? className + " " : "") + "ml-2 inline-flex items-center gap-1 rounded-md bg-black text-white px-3 py-1.5 text-[12.5px] font-semibold hover:bg-neutral-800"}
            >
                {loading ? '재집계 중...' : '리더보드 재집계'}
            </button>
        </>
    );
}