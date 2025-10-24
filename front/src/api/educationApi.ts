import api from "./axiosInstance";

export type EducationLevel = "HIGH_SCHOOL" | "UNIVERSITY" | "GRADUATE" | "BOOTCAMP" | "OTHER";
export type EducationStatus = "ENROLLED" | "GRADUATED" | "LEAVE" | "DROPPED";

export interface EducationPayload {
	schoolName: string;
	degree?: string; // 고등학교는 degree가 없을 수 있음
	level: EducationLevel;
	status: EducationStatus;
	startYear: number;
	startMonth: number;
	endYear?: number | null;
	endMonth?: number | null;
	description?: string;
	isRepresentative: boolean;
}

export interface MajorItem {
	id: number;
	name: string;
}

export const EducationApi = {
	create(payload: EducationPayload) {
		return api.post("/educations", payload);
	},
	update(id: number, payload: EducationPayload) {
		return api.put(`/educations/${id}`, payload);
	},
	remove(id: number) {
		return api.delete(`/educations/${id}`);
	},
	list() {
		return api.get("/educations");
	},
	setRepresentative(id: number) {
		return api.patch(`/educations/${id}/representative`);
	},
	// 전공 관련 API
	getMajors(educationId: number) {
		return api.get<MajorItem[]>(`/educations/${educationId}/majors`);
	},
	addMajor(educationId: number, name: string) {
		return api.post<MajorItem>(`/educations/${educationId}/majors`, { name });
	},
	removeMajor(majorId: number) {
		return api.delete(`/educations/majors/${majorId}`);
	},
}; 