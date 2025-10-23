import React, { useMemo, useState } from "react";
import { adminRevokeAllDevicesByUser } from "../../api/security";

export default function SecurityDeviceManagePage() {
    const [adminUserId, setAdminUserId] = useState<string>("");
    const [adminResult, setAdminResult] = useState<string>("");
    const [submitting, setSubmitting] = useState(false);

    async function onAdminRevokeAll() {
        const id = parseInt(adminUserId, 10);
        if (!id || Number.isNaN(id)) {
            setAdminResult("유효한 사용자 ID를 입력하세요.");
            return;
        }
        try {
            setSubmitting(true);
            setAdminResult("");
            const res = await adminRevokeAllDevicesByUser(id);
            setAdminResult(`revoked: ${res.revoked}`);
        } catch (e: any) {
            setAdminResult(e?.message || "관리자 무효화 실패");
        } finally {
            setSubmitting(false);
        }
    }

    const resultTone = useMemo(() => {
        if (!adminResult) return "";
        return adminResult.startsWith("revoked") ? "success" : "error";
    }, [adminResult]);

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <h1 className="text-3xl font-semibold mb-2 text-center">보안 ▸ 사용자 관리</h1>
            <p className="text-gray-600 mb-7 text-center text-[15px]">관리자: 특정 사용자 모든 신뢰 디바이스 무효화</p>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                <div className="mb-5">
                    <h2 className="font-semibold text-xl">관리자 ▸ 특정 사용자 전체 무효화</h2>
                </div>

                <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-600 whitespace-nowrap">User ID</label>
                    <input
                        value={adminUserId}
                        onChange={(e) => setAdminUserId(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="예: 30"
                        className="w-[320px] border rounded-lg px-3 py-2 text-sm bg-white text-black focus:outline-none focus:ring-2 focus:ring-black/20"
                        inputMode="numeric"
                    />
                    <button
                        onClick={onAdminRevokeAll}
                        disabled={submitting}
                        className={`px-5 h-[40px] rounded-lg text-sm text-white transition-colors ${submitting ? "bg-gray-400" : "bg-black hover:bg-black/80"}`}
                    >
                        {submitting ? "처리 중…" : "해당 유저 모두 해지"}
                    </button>
                </div>
                <p className="text-xs text-gray-400 mt-3">전체 해지할 대상 사용자의 내부 ID를 입력하세요.</p>

                {adminResult && (
                    <div
                        className={`mt-4 text-sm px-3 py-2 rounded-lg inline-block ${
                            resultTone === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                    >
                        {adminResult}
                    </div>
                )}

                <p className="text-xs text-gray-500 mt-4">권한이 없는 토큰으로 호출 시 403, 해당 사용자의 활성 디바이스 수만큼 revoked 수가 반환됩니다.</p>
            </div>
        </div>
    );
}


