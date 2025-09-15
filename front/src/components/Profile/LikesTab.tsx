import React from "react";
import { Link } from "react-router-dom";

const LikesTab: React.FC = () => {
	return (
		<div className="min-h-[360px] flex flex-col items-center justify-center text-center">
			<div className="mt-6 text-[16px] md:text-[18px] text-black/80">아직 좋아요한 작업이 없습니다.</div>
			<Link to="/" className="mt-4 h-[42px] px-5 rounded-[21px] border border-black/20 text-[14px] flex items-center text-black bg-white">크리에이터를 발견하러 가기</Link>
		</div>
	);
};

export default LikesTab;
