import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
    const navigate = useNavigate();
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
        <div className="min-h-screen bg-[#F5F7FA] dark:bg-[var(--bg)] text-black dark:text-white">
            <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
                {/* 모바일 헤더 */}
                <div className="lg:hidden grid grid-cols-[40px_1fr_40px] items-center mb-4">
                    <button
                        type="button"
                        aria-label="뒤로가기"
                        onClick={() => navigate("/mypage")}
                        className="justify-self-start px-2 py-1 -ml-2 text-[30px] leading-none text-[#111827] dark:text-white"
                    >
                        ‹
                    </button>
                    <div className="justify-self-center text-[16px] font-medium text-center">보안 ▸ 디바이스 관리</div>
                    <span />
                </div>

                <div className="hidden lg:grid grid-cols-[40px_1fr_40px] items-center mb-5">
                    <button
                        type="button"
                        aria-label="뒤로가기"
                        onClick={() => navigate(-1)}
                        className="justify-self-start px-2 py-1 -ml-2 text-[34px] leading-none text-[#111827] dark:text-white"
                    >
                        ‹
                    </button>
                    <div className="text-center">
                        <h1 className="text-3xl font-semibold">보안 ▸ 디바이스 관리</h1>
                        <p className="text-gray-600 dark:text-white/70 text-[15px] mt-1">내 신뢰된 디바이스를 조회하고 무효화할 수 있습니다.</p>
                    </div>
                    <span />
                </div>
                <div className="lg:hidden text-center text-sm text-[#6B7280] dark:text-white/70 mb-4">
                    내 신뢰된 디바이스를 조회하고 무효화할 수 있습니다.
                </div>

                <div className="bg-white dark:bg-[var(--surface)] border border-[#E5E7EB] dark:border-[var(--border-color)] rounded-xl p-5 sm:p-6 shadow">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                        <h2 className="font-semibold text-lg text-[#111827] dark:text-white">내 신뢰된 디바이스</h2>
                        <div className="flex gap-2">
                            <button onClick={askRevokeCurrent} className="px-4 py-2 text-sm rounded bg-orange-500 text-white">
                                현재 디바이스 해지
                            </button>
                            <button onClick={askRevokeAllMine} className="px-4 py-2 text-sm rounded bg-red-600 text-white">
                                모두 해지
                            </button>
                        </div>
                    </div>
                    {loading && <div className="text-sm text-gray-500 dark:text-white/60">불러오는 중…</div>}
                    {error && <div className="text-sm text-red-500">{error}</div>}

                    <div className="hidden sm:block overflow-x-auto">
                        <table className="min-w-full text-[15px]">
                            <thead>
                                <tr className="border-b bg-gray-50 dark:bg-white/5">
                                    <th className="text-left p-3">브라우저/기기명</th>
                                    <th className="text-left p-3">최근 IP</th>
                                    <th className="text-left p-3">만료일</th>
                                    <th className="text-right p-3">작업</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((d) => (
                                    <tr key={d.id} className="border-b border-[#E5E7EB] dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5">
                                        <td className="p-3 whitespace-nowrap">{d.deviceName}</td>
                                        <td className="p-3 whitespace-nowrap">{d.lastIp}</td>
                                        <td className="p-3 whitespace-nowrap">{new Date(d.trustUntil).toLocaleString()}</td>
                                        <td className="p-3 text-right">
                                            <button
                                                onClick={() => askRevokeRow(d.id)}
                                                className="px-3 py-1.5 text-xs rounded border border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                                            >
                                                해지
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {rows.length === 0 && !loading && (
                                    <tr>
                                        <td className="p-4 text-center text-gray-500 dark:text-white/60" colSpan={4}>신뢰된 디바이스가 없습니다.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="sm:hidden space-y-3">
                        {rows.map((d) => (
                            <div key={d.id} className="rounded-xl border border-[#E5E7EB] dark:border-white/15 p-4 bg-[#F9FAFB] dark:bg-white/5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="text-xs uppercase tracking-wide text-[#6B7280]">브라우저/기기명</div>
                                        <div className="text-base font-medium">{d.deviceName}</div>
                                    </div>
                                    <button
                                        onClick={() => askRevokeRow(d.id)}
                                        className="px-3 py-1.5 text-xs rounded-full border border-red-500 text-red-500 bg-white dark:bg-transparent"
                                    >
                                        해지
                                    </button>
                                </div>
                                <div className="mt-3 text-sm text-[#6B7280] space-y-1">
                                    <div className="flex justify-between">
                                        <span>최근 IP</span>
                                        <span className="text-[#111827] dark:text-white font-medium">{d.lastIp}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>만료일</span>
                                        <span className="text-[#111827] dark:text-white font-medium">{new Date(d.trustUntil).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {rows.length === 0 && !loading && (
                            <div className="rounded-xl border border-dashed border-[#E5E7EB] dark:border-white/20 p-4 text-center text-sm text-[#6B7280] dark:text-white/60">
                                신뢰된 디바이스가 없습니다.
                            </div>
                        )}
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
        </div>
    );
}


