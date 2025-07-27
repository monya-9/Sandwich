import React from "react";
import Header from "../Main/Header";

export default function ProjectForm() {
  return (
    <div className="min-h-screen bg-white font-gmarket">
      {/* 헤더 */}
      <Header />

      {/* 메인 컨텐츠 영역 */}
      <div className="flex justify-center items-start px-6 py-12">
        {/* 등록 메인 */}
        <div className="flex w-[1400px] gap-8">
          {/* 왼쪽: 프로젝트 등록/콘텐츠 영역 */}
          <section className="w-[1000px] min-h-[829px] border border-[#ADADAD] rounded-[10px] flex flex-col items-center pt-16">
            <div className="text-[#ADADAD] text-[24px] mb-10">
              컨텐츠를 선택하여 업로드를 시작하세요.
            </div>
            <div className="flex gap-[56px] mt-10">
              {/* 이미지 */}
              <div className="flex flex-col items-center">
                <div className="w-[140px] h-[140px] border border-[#ADADAD] rounded-full flex items-center justify-center mb-4">
                  <img src="/img_icon.png" alt="이미지" className="w-[64px] h-[64px]" />
                </div>
                <span className="text-[24px] text-black">이미지</span>
              </div>
              {/* 텍스트 */}
              <div className="flex flex-col items-center">
                <div className="w-[140px] h-[140px] border border-[#ADADAD] rounded-full flex items-center justify-center mb-4">
                  <img src="/txt_icon.png" alt="텍스트" className="w-[64px] h-[64px]" />
                </div>
                <span className="text-[24px] text-black">텍스트</span>
              </div>
              {/* 동영상 */}
              <div className="flex flex-col items-center">
                <div className="w-[140px] h-[140px] border border-[#ADADAD] rounded-full flex items-center justify-center mb-4">
                  <img src="/video_icon.png" alt="동영상" className="w-[64px] h-[64px]" />
                </div>
                <span className="text-[24px] text-black">동영상</span>
              </div>
            </div>
          </section>

          {/* 오른쪽: 옵션/버튼 */}
          <aside className="w-[357px]">
            <div className="border border-[#ADADAD] rounded-[10px] p-6 flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4 mb-2">
                <button className="flex flex-col items-center gap-1">
                  <img src="/img_icon.png" alt="이미지 추가" className="w-[50px] h-[50px]" />
                  <span className="text-[20px]">이미지 추가</span>
                </button>
                <button className="flex flex-col items-center gap-1">
                  <img src="/txt_icon.png" alt="텍스트 추가" className="w-[50px] h-[50px]" />
                  <span className="text-[20px]">텍스트 추가</span>
                </button>
                <button className="flex flex-col items-center gap-1">
                  <img src="/video_icon.png" alt="동영상 추가" className="w-[50px] h-[50px]" />
                  <span className="text-[20px]">동영상 추가</span>
                </button>
                <button className="flex flex-col items-center gap-1">
                  <span className="text-[20px] text-center leading-6">
                    컨텐츠 재정렬<br />및 삭제
                  </span>
                </button>
              </div>
              {/* 배경색상 */}
              <div>
                <label className="block text-[#ADADAD] text-[20px] mb-1">배경색상 설정</label>
                <input
                  type="text"
                  className="w-[95px] border border-[#ADADAD] rounded px-2 py-1 text-black"
                  defaultValue="#d47878ff"
                />
              </div>
              {/* 콘텐츠 간격 */}
              <div>
                <label className="block text-[#ADADAD] text-[20px] mb-1">콘텐츠 간격 설정</label>
                <div className="flex items-center gap-3">
                  <input type="range" min={0} max={30} defaultValue={10} className="w-[215px] accent-black" />
                  <span className="text-[15px]">10px</span>
                </div>
              </div>
              {/* 다음 버튼 */}
              <button className="bg-black rounded-[30px] w-full h-[82px] text-white text-[24px] mt-4">다음</button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
