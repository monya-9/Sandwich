import React from "react";
import Header from "../Main/Header";

export default function ProjectForm() {
  return (
    <div className="relative w-[1440px] min-h-screen mx-auto bg-white font-gmarket">
      {/* 헤더 */}
      <Header />

      {/* 메인 컨텐츠 */}
      <div className="flex justify-start gap-[28px] px-[30px] pt-[40px]">
        {/* 왼쪽 콘텐츠 */}
        <section className="w-[1000px] h-[829px] border border-[#ADADAD] rounded-[10px] flex flex-col items-center pt-[80px]">
          <div className="text-[#ADADAD] text-[24px] mb-[40px]">
            컨텐츠를 선택하여 업로드를 시작하세요.
          </div>
          <div className="flex justify-center gap-[56px]">
            {/* 이미지 */}
            <div className="flex flex-col items-center">
              <div className="w-[140px] h-[140px] border border-[#ADADAD] rounded-full flex items-center justify-center mb-[16px]">
                <img src="/img_icon.png" alt="이미지" className="w-[64px] h-[64px]" />
              </div>
              <span className="text-[24px] text-black">이미지</span>
            </div>
            {/* 텍스트 */}
            <div className="flex flex-col items-center">
              <div className="w-[140px] h-[140px] border border-[#ADADAD] rounded-full flex items-center justify-center mb-[16px]">
                <img src="/txt_icon.png" alt="텍스트" className="w-[64px] h-[64px]" />
              </div>
              <span className="text-[24px] text-black">텍스트</span>
            </div>
            {/* 동영상 */}
            <div className="flex flex-col items-center">
              <div className="w-[140px] h-[140px] border border-[#ADADAD] rounded-full flex items-center justify-center mb-[16px]">
                <img src="/video_icon.png" alt="동영상" className="w-[64px] h-[64px]" />
              </div>
              <span className="text-[24px] text-black">동영상</span>
            </div>
          </div>
        </section>

        {/* 오른쪽 설정 영역 */}
        <aside className="w-[357px] flex flex-col gap-[30px] mt-[0px]">
          {/* 콘텐츠 추가 및 정렬 */}
          <div className="border border-[#ADADAD] rounded-[10px] p-[24px]">
            <div className="grid grid-cols-2 gap-y-[32px] gap-x-[24px] mb-[20px]">
              <button className="flex flex-col items-center gap-[6px]">
                <img src="/img_icon.png" alt="이미지 추가" className="w-[50px] h-[50px]" />
                <span className="text-[20px]">이미지 추가</span>
              </button>
              <button className="flex flex-col items-center gap-[6px]">
                <img src="/txt_icon.png" alt="텍스트 추가" className="w-[50px] h-[50px]" />
                <span className="text-[20px]">텍스트 추가</span>
              </button>
              <button className="flex flex-col items-center gap-[6px]">
                <img src="/video_icon.png" alt="동영상 추가" className="w-[50px] h-[50px]" />
                <span className="text-[20px]">동영상 추가</span>
              </button>
              <button className="flex flex-col items-center gap-[6px]">
                <span className="text-[20px] text-center leading-6">
                  컨텐츠 재정렬<br />및 삭제
                </span>
              </button>
            </div>
          </div>

          {/* 배경색 및 간격 */}
          <div className="border border-[#ADADAD] rounded-[10px] p-[24px]">
            <label className="block text-[#ADADAD] text-[20px] mb-1">배경색상 설정</label>
            <input
              type="text"
              className="w-[95px] border border-[#ADADAD] rounded px-2 py-1 text-black mb-[24px]"
              defaultValue="#FFFFFF"
            />

            <label className="block text-[#ADADAD] text-[20px] mb-1">콘텐츠 간격 설정</label>
            <div className="flex items-center gap-3">
              <input type="range" min={0} max={30} defaultValue={10} className="w-[215px] accent-black" />
              <span className="text-[15px]">10px</span>
            </div>
          </div>

          {/* 다음 버튼 */}
          <button className="bg-black rounded-[30px] w-[357px] h-[82px] text-white text-[24px]">
            다음
          </button>
        </aside>
      </div>
    </div>
  );
}
