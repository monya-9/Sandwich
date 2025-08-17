import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/common/Header/Header";

export default function AppLayout() {
    return (
        <div className="min-h-dvh bg-white">
            {/* 공통 헤더 (fixed) */}
            <Header />

            {/* ✅ 헤더와 동일 높이 스페이서: h-16 md:h-20 */}
            <div className="h-16 md:h-20" />

            {/* ✅ 모든 페이지 공통 컨테이너/여백 (페이지별 바깥 래퍼는 제거 권장) */}
            <main className="mx-auto w-full">
                <Outlet />
            </main>
        </div>
    );
}
