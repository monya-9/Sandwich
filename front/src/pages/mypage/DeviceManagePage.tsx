import React, { useEffect, useMemo, useState } from "react";
import ConfirmModal from "../../components/common/ConfirmModal";
import {
    listTrustedDevices,
    revokeAllMyDevices,
    revokeCurrentDevice,
    revokeDeviceById,
    UserDeviceDTO,
} from "../../api/security";
import { clearAllUserData } from "../../utils/tokenStorage";

export default function DeviceManagePage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [devices, setDevices] = useState<UserDeviceDTO[]>([]);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmKind, setConfirmKind] = useState<"row" | "current" | "all">("row");
    const [targetId, setTargetId] = useState<number | null>(null);

    async function load() {
        try {
            setLoading(true);
            setError(null);
            const rows = await listTrustedDevices();
            setDevices(rows);
        } catch (e: any) {
            setError(e?.message || "목록 조회 실패");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    function askRevokeCurrent() {
        setConfirmKind("current");
        setTargetId(null);
        setConfirmOpen(true);
    }

    function askRevokeAllMine() {
        setConfirmKind("all");
        setTargetId(null);
        setConfirmOpen(true);
    }

    function askRevokeRow(id: number) {
        setConfirmKind("row");
        setTargetId(id);
        setConfirmOpen(true);
    }

    async function handleConfirm() {
        try {
            if (confirmKind === "current") {
                await revokeCurrentDevice();
                clearAllUserData();
                window.location.href = "/login";
                return;
            }
            if (confirmKind === "all") {
                await revokeAllMyDevices();
                clearAllUserData();
                window.location.href = "/login";
                return;
            }
            if (confirmKind === "row" && targetId != null) {
                await revokeDeviceById(targetId);
                await load();
            }
        } finally {
            setConfirmOpen(false);
        }
    }

    const rows = useMemo(() => devices, [devices]);

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <h1 className="text-3xl font-semibold mb-3 text-center">보안 ▸ 디바이스 관리</h1>
            <p className="text-gray-600 mb-7 text-center text-[15px]">내 신뢰된 디바이스를 조회하고 무효화할 수 있습니다.</p>

            <div className="border rounded-lg p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-lg">내 신뢰된 디바이스</h2>
                    <div className="flex gap-2">
                        <button onClick={askRevokeCurrent} className="px-4 py-2 text-sm rounded bg-orange-500 text-white">
                            현재 디바이스 해지
                        </button>
                        <button onClick={askRevokeAllMine} className="px-4 py-2 text-sm rounded bg-red-600 text-white">
                            모두 해지
                        </button>
                    </div>
                </div>
                {loading && <div className="text-sm text-gray-500">불러오는 중…</div>}
                {error && <div className="text-sm text-red-500">{error}</div>}

                <div className="overflow-x-auto">
                    <table className="min-w-full text-[15px]">
                        <thead>
                            <tr className="border-b bg-gray-50">
                                <th className="text-left p-3">브라우저/기기명</th>
                                <th className="text-left p-3">최근 IP</th>
                                <th className="text-left p-3">만료일</th>
                                <th className="text-right p-3">작업</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((d) => (
                                <tr key={d.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3 whitespace-nowrap">{d.deviceName}</td>
                                    <td className="p-3 whitespace-nowrap">{d.lastIp}</td>
                                    <td className="p-3 whitespace-nowrap">{new Date(d.trustUntil).toLocaleString()}</td>
                                    <td className="p-3 text-right">
                                        <button
                                            onClick={() => askRevokeRow(d.id)}
                                            className="px-3 py-1.5 text-xs rounded border border-red-500 text-red-600 hover:bg-red-50"
                                        >
                                            해지
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {rows.length === 0 && !loading && (
                                <tr>
                                    <td className="p-4 text-center text-gray-500" colSpan={4}>신뢰된 디바이스가 없습니다.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmModal
                visible={confirmOpen}
                title="확인"
                message={
                    confirmKind === "current"
                        ? "현재 이 브라우저 세션을 즉시 무효화하고 로그아웃할까요?"
                        : confirmKind === "all"
                        ? "내 모든 신뢰 디바이스를 무효화하고 로그아웃할까요?"
                        : "선택한 디바이스를 무효화할까요? 다음 로그인부터 OTP가 필요합니다."
                }
                confirmText="확인"
                cancelText="취소"
                confirmButtonColor={confirmKind === "row" ? "red" : "blue"}
                onConfirm={handleConfirm}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    );
}


