import React from "react";
import { FiPlus } from "react-icons/fi";
import { dummyProjects } from "../../data/dummyProjects";
import { resolveCover, swapJpgPng } from "../../utils/getProjectCover";

const CollectionsTab: React.FC = () => {
	// 작업 탭(앞 2개)과 겹치지 않도록 다른 더미를 선택
	const usedByWork = new Set(dummyProjects.slice(0, 2).map(p => p.id));
	const alt = dummyProjects.find(p => !usedByWork.has(p.id)) ?? dummyProjects[0];
	const exampleCollections = [
		{ id: "col-1", name: "나의 UI/UX 영감", projectIds: [alt.id] },
	];

	return (
		<div className="min-h-[360px] flex items-start justify-center text-center">
			<div className="w-full">
				{/* 상단 안내 박스 */}
				<div className="mt-6 w-full rounded-[8px] border border-dashed border-[#D1D5DB] bg-[#F8FAFB] px-6 py-8 text-black/80">
					<div className="flex flex-col items-center gap-2">
						<div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#E8F7EE]">
							<FiPlus className="text-[#068334]" />
						</div>
						<div className="text-[14px] md:text-[15px] font-medium">컬렉션 폴더 추가</div>
						<div className="text-[12px] md:text-[13px] text-black/60">마음에 드는 작업을 개인별로 분류하여 저장해보세요.</div>
					</div>
				</div>

				{/* 컬렉션 리스트 */}
				<div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-left">
					{exampleCollections.map((col) => {
						const thumbs = col.projectIds.slice(0, 1); // 대표 썸네일 1장
						return (
							<div key={col.id} className="rounded-xl border border-black/10 p-3">
								<div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-gray-200">
									{thumbs.map((pid) => {
										const p = dummyProjects.find(d => d.id === pid)!;
										let src = resolveCover(p);
										const onError: React.ReactEventHandler<HTMLImageElement> = (e) => {
											const img = e.currentTarget as HTMLImageElement;
											img.onerror = null as any;
											img.src = swapJpgPng(img.src);
										};
										return <img key={pid} src={src} onError={onError} alt="thumb" className="w-full h-full object-cover" />;
									})}
								</div>
								<div className="px-1 pt-3">
									<div className="text-[15px] font-medium">{col.name}</div>
									<div className="text-[12px] text-black/50">총 {col.projectIds.length}개의 작업  |  공개 컬렉션</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default CollectionsTab;
