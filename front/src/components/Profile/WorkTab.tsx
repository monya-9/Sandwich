import React from "react";
import { Link } from "react-router-dom";

const WorkTab: React.FC = () => {
	return (
		<div className="min-h-[360px] flex flex-col items-center justify-center text-center">
			<div className="mt-6 text-[16px] md:text-[18px] text-black/90">작업 시작이 어렵고 막막하신가요?</div>
			<div className="mt-2 text-[14px] md:text-[15px] text-black/70 leading-relaxed">
				커뮤니티에서 다른 창작자와 디자이너들에게 조언을 구하고
				<br />
				노트폴리오에서 즐거운 창작 생활을 시작해 보세요!
			</div>
			<div className="mt-6 flex items-center gap-3">
				<Link to="/community" className="h-[44px] px-5 rounded-[22px] bg-[#068334] text-white text-[14px] flex items-center">커뮤니티 바로가기</Link>
				<Link to="/project/sample" className="h-[44px] px-5 rounded-[22px] border border-black/20 text-[14px] flex items-center text-black">새로운 작업 업로드</Link>
			</div>
		</div>
	);
};

export default WorkTab;
