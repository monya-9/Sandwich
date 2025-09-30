import api from "./axiosInstance";

export interface EducationPayload {
	schoolName: string;
	degree: string;
	startYear: number;
	startMonth: number;
	endYear?: number | null;
	endMonth?: number | null;
	description?: string;
	isRepresentative: boolean;
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
}; 