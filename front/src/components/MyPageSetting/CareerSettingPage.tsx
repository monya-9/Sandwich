import React, { useMemo, useState, useContext, useRef, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import { HiOutlineArrowUpTray } from "react-icons/hi2";
import Sidebar from "./Sidebar";
import CareerForm from "./CareerForm";
import ProjectForm from "./ProjectForm";
import AwardForm from "./AwardForm";
import EducationForm from "./EducationForm";
import { CareerApi } from "../../api/careerApi";
import CareerCard, { CareerItem } from "./CareerCard";
import ProjectCard, { ProjectItem } from "./ProjectCard";
import { CareerProjectApi } from "../../api/careerProjectApi";
import AwardCard, { AwardItem } from "./AwardCard";
import EducationCard, { EducationItem } from "./EducationCard";
import { AwardApi } from "../../api/awardApi";
import { EducationApi } from "../../api/educationApi";

const EmojiBadge: React.FC<{ children: string }> = ({ children }) => (
	<span className="inline-flex items-center justify-center text-[18px] leading-none align-middle">
		{children}
	</span>
);

const sortRepFirst = <T extends { isRepresentative?: boolean; id?: number }>(arr: T[]): T[] => {
	return [...arr].sort((a, b) => {
		const repDiff = (b.isRepresentative ? 1 : 0) - (a.isRepresentative ? 1 : 0);
		if (repDiff !== 0) return repDiff;
		const idA = typeof a.id === "number" ? a.id! : 0;
		const idB = typeof b.id === "number" ? b.id! : 0;
		return idB - idA;
	});
};

const CareerSettingPage: React.FC = () => {
	const [showCareerForm, setShowCareerForm] = useState(false);
	const [showEducationForm, setShowEducationForm] = useState(false);
	const [showProjectForm, setShowProjectForm] = useState(false);
	const [showAwardForm, setShowAwardForm] = useState(false);
	const [careers, setCareers] = useState<CareerItem[]>([]);
	const [projects, setProjects] = useState<ProjectItem[]>([]);
	const [awards, setAwards] = useState<AwardItem[]>([]);
	const [educations, setEducations] = useState<EducationItem[]>([]);
	const [editingCareer, setEditingCareer] = useState<CareerItem | null>(null);
	const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
	const [editingAward, setEditingAward] = useState<AwardItem | null>(null);
	const [editingEducation, setEditingEducation] = useState<EducationItem | null>(null);
	const closedMinHeightPx = 160;

	const loadCareers = async () => {
		try {
			const res = await CareerApi.list();
			const list: any[] = res.data?.data || res.data || [];
			setCareers(sortRepFirst(list) as CareerItem[]);
		} catch (e) {}
	};

	const loadProjects = async () => {
		try {
			const res = await CareerProjectApi.list();
			const list: any[] = res.data?.data || res.data || [];
			setProjects(sortRepFirst(list) as ProjectItem[]);
		} catch (e) {}
	};

	const loadAwards = async () => {
		try {
			const res = await AwardApi.list();
			const list: any[] = res.data?.data || res.data || [];
			setAwards(sortRepFirst(list) as AwardItem[]);
		} catch (e) {}
	};

	const loadEducations = async () => {
		try {
			const res = await EducationApi.list();
			const list: any[] = res.data?.data || res.data || [];
			setEducations(sortRepFirst(list) as EducationItem[]);
		} catch (e) {}
	};

	useEffect(() => {
		loadCareers();
		loadProjects();
		loadAwards();
		loadEducations();
	}, []);

	const handleCareerDone = () => {
		setShowCareerForm(false);
		setEditingCareer(null);
		loadCareers();
	};
	const handleProjectDone = () => {
		setShowProjectForm(false);
		setEditingProject(null);
		loadProjects();
	};
	const handleAwardDone = () => {
		setShowAwardForm(false);
		setEditingAward(null);
		loadAwards();
	};
	const handleEducationDone = () => {
		setShowEducationForm(false);
		setEditingEducation(null);
		loadEducations();
	};

	return (
		<div className="min-h-screen font-gmarket pt-5 bg-[#F5F7FA] text-black">
			<div className="mx-auto max-w-[1400px] px-4 md:px-6">
				<div className="flex gap-6">
					{/* 좌측 사이드바 */}
					<aside className="w-[320px] shrink-0">
						<Sidebar />
					</aside>
					<main className="flex-1 space-y-6">
						{/* 경력 */}
						<section className={`bg-white border border-[#E5E7EB] rounded-xl p-6 pb-20 box-border w-full max-w-[1400px] mx-auto`} style={{minHeight: showCareerForm ? undefined : closedMinHeightPx}}>
							<div className="flex items-center justify-between mb-4">
								<div className="flex items-center">
									<EmojiBadge>💼</EmojiBadge>
									<div className="ml-[5px] text-[16px] font-medium text-[#111827]">경력</div>
								</div>
								{!showCareerForm && !editingCareer ? (
									<button onClick={() => { setEditingCareer(null); setShowCareerForm(true); }} className="text-[14px] text-green-500 hover:underline">+ 경력 정보 추가</button>
								) : null}
							</div>
							{showCareerForm || editingCareer ? (
								<CareerForm onCancel={()=>{ setShowCareerForm(false); setEditingCareer(null); }} onDone={handleCareerDone} initial={editingCareer || undefined} editingId={editingCareer?.id} />
							) : (
								careers.length === 0 ? (
									<div className="text-[14px] text-[#6B7280]">작성된 경력정보가 없습니다.</div>
								) : (
									<div className="divide-y divide-[#E5E7EB]">
										{careers.map(c => (
											<CareerCard key={c.id} item={c} onUpdated={loadCareers} onEdit={(it)=>{ setEditingCareer(it); setShowCareerForm(true); }} />
										))}
									</div>
								)
							)}
						</section>

						{/* 프로젝트 */}
						<section className={`bg-white border border-[#E5E7EB] rounded-xl p-6 pb-20 box-border w-full max-w-[1400px] mx-auto`} style={{minHeight: showProjectForm ? undefined : closedMinHeightPx}}>
							<div className="flex items-center justify-between mb-4">
								<div className="flex items-center">
									<EmojiBadge>🧩</EmojiBadge>
									<div className="ml-[5px] text-[16px] font-medium text-[#111827]">프로젝트</div>
								</div>
								{!showProjectForm && !editingProject ? (
									<button onClick={() => { setEditingProject(null); setShowProjectForm(true); }} className="text-[14px] text-green-500 hover:underline">+ 프로젝트 추가</button>
								) : null}
							</div>
							{showProjectForm || editingProject ? (
								<ProjectForm onCancel={()=>{ setShowProjectForm(false); setEditingProject(null); }} onDone={handleProjectDone} initial={editingProject || undefined} editingId={(editingProject as any)?.id} />
							) : (
								projects.length === 0 ? (
									<div className="text-[14px] text-[#6B7280]">등록된 프로젝트가 없습니다.</div>
								) : (
									<div className="divide-y divide-[#E5E7EB]">
										{projects.map(p => (
											<ProjectCard key={p.id} item={p} onUpdated={loadProjects} onEdit={(it)=>{ setEditingProject(it); setShowProjectForm(true); }} />
										))}
									</div>
								)
							)}
						</section>

						{/* 수상 */}
						<section className={`bg-white border border-[#E5E7EB] rounded-xl p-6 pb-20 box-border w-full max-w-[1400px] mx-auto`} style={{minHeight: showAwardForm ? undefined : closedMinHeightPx}}>
							<div className="flex items-center justify-between mb-4">
								<div className="flex items-center">
									<EmojiBadge>🏆</EmojiBadge>
									<div className="ml-[5px] text-[16px] font-medium text-[#111827]">수상</div>
								</div>
								{!showAwardForm && !editingAward ? (
									<button onClick={() => { setEditingAward(null); setShowAwardForm(true); }} className="text-[14px] text-green-500 hover:underline">+ 수상 내역 추가</button>
								) : null}
							</div>
							{showAwardForm || editingAward ? (
								<AwardForm onCancel={()=>{ setShowAwardForm(false); setEditingAward(null); }} onDone={handleAwardDone} initial={editingAward || undefined} editingId={editingAward?.id} />
							) : (
								awards.length === 0 ? (
									<div className="text-[14px] text-[#6B7280]">작성된 수상 내역이 없습니다.</div>
								) : (
									<div className="divide-y divide-[#E5E7EB] space-y-6">
										{awards.map(a => (
											<AwardCard key={a.id} item={a} onUpdated={loadAwards} onEdit={(it)=>{ setEditingAward(it); setShowAwardForm(true); }} />
										))}
									</div>
								)
							)}
						</section>

						{/* 학력 (맨 아래) */}
						<section className={`bg-white border border-[#E5E7EB] rounded-xl p-6 pb-20 box-border w-full max-w-[1400px] mx-auto`} style={{minHeight: showEducationForm ? undefined : closedMinHeightPx}}>
							<div className="flex items-center justify-between mb-4">
								<div className="flex items-center">
									<EmojiBadge>🎓</EmojiBadge>
									<div className="ml-[5px] text-[16px] font-medium text-[#111827]">학력</div>
								</div>
								{!showEducationForm && !editingEducation ? (
									<button onClick={() => { setEditingEducation(null); setShowEducationForm(true); }} className="text-[14px] text-green-500 hover:underline">+ 학력 정보 추가</button>
								) : null}
							</div>
							{showEducationForm || editingEducation ? (
								<EducationForm onCancel={()=>{ setShowEducationForm(false); setEditingEducation(null); }} onDone={handleEducationDone} initial={editingEducation || undefined} editingId={editingEducation?.id} />
							) : (
								educations.length === 0 ? (
									<div className="text-[14px] text-[#6B7280]">작성된 학력 정보가 없습니다.</div>
								) : (
									<div className="divide-y divide-[#E5E7EB] space-y-6">
										{educations.map(e => (
											<EducationCard key={e.id} item={e} onUpdated={loadEducations} onEdit={(it)=>{ setEditingEducation(it); setShowEducationForm(true); }} />
										))}
									</div>
								)
							)}
						</section>
					</main>
				</div>
			</div>
		</div>
	);
};

export default CareerSettingPage; 