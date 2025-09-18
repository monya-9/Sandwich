import React from "react";
import { FiPlus } from "react-icons/fi";

const CollectionsTab: React.FC = () => {
	return (
		<div className="min-h-[360px] flex items-start justify-center text-center">
			<div className="w-full">
				<div className="mt-6 w-full rounded-[8px] border border-dashed border-[#D1D5DB] bg-[#F8FAFB] px-6 py-8 text-black/80">
					<div className="flex flex-col items-center gap-2">
						<div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#E8F7EE]">
							<FiPlus className="text-[#068334]" />
						</div>
						<div className="text-[14px] md:text-[15px] font-medium">컬렉션 폴더 추가</div>
						<div className="text-[12px] md:text-[13px] text-black/60">마음에 드는 작업을 개인별로 분류하여 저장해보세요.</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default CollectionsTab;
