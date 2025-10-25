import React from "react";
import { Link } from "react-router-dom";
import Modal from "./Modal";

type Props = { open: boolean; onClose: () => void };

export default function LoginRequiredModal({ open, onClose }: Props) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            widthClass="w-[300px] sm:w-[320px]"
            // 카드 전체 패딩 10px + 상단 아이콘 공간
            paddingClass="p-[10px] pt-8"
            heightClass="min-h-[350px]"
        >
            {/* 상단 👋 */}
            <div className="pointer-events-none absolute left-1/2 top-[-22px] -translate-x-1/2 text-[50px] leading-none text-white">
                👋
            </div>

            {/* 섹션 간 세로 간격 확실히: space-y-3 (12px) */}
            <div className="flex h-full flex-col items-center text-center space-y-3">
                {/* 타이틀 + 본문 : 좌우 패딩 정확히 10px */}
                <div className="w-full px-[10px]">
                    <h3 className="mb-2 whitespace-pre-line font-[700] text-[18px] leading-[22px] text-black dark:text-white pt-7 ">
                        로그인하고{"\n"}샌드위치 시작하기
                    </h3>
                    <p className="mx-auto w-[260px] text-[13px] leading-[19px] text-black dark:text-gray-400 pt-7">
                        샌드위치에는 다양한 창작자들이 활동하고 있습니다. 로그인하고 당신의 창작 활동을 시작해보세요!
                    </p>
                </div>

                {/* 버튼 블록 : 좌우 패딩 10px + 위아래 여백 구분 */}
                <div className="w-full px-[10px] pt-5 ">
                    <Link
                        to="/login"
                        className="inline-flex h-[35px] w-full max-w-[280px] items-center justify-center rounded-full bg-black dark:bg-white text-[15px] font-bold text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 transition"
                    >
                        로그인 하러가기
                    </Link>

                    {/* 로그인 버튼과 붙게, 그러나 블록 전체에는 padding 10px 유지 */}
                    <div className="mt-2 text-[12.5px] leading-[18px] text-[#5B5959] dark:text-gray-400">아직 회원이 아닌가요? <Link to="/join" className="text-[#068334] dark:text-white underline">회원가입</Link></div>
                </div>
            </div>
        </Modal>
    );
}
