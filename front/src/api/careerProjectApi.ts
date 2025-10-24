import api from "./axiosInstance";

export interface CareerProjectPayload {
	title: string;
	techStack?: string;
	role: string;
	startYear: number;
	startMonth: number;
	endYear?: number | null;
	endMonth?: number | null;
	description?: string;
	isRepresentative: boolean;
}

export const CareerProjectApi = {
	create(payload: CareerProjectPayload) {
		return api.post("/career-projects", payload);
	},
	update(id: number, payload: CareerProjectPayload) {
		return api.put(`/career-projects/${id}`, payload);
	},
	remove(id: number) {
		return api.delete(`/career-projects/${id}`);
	},
	list() {
		return api.get("/career-projects");
	},
	setRepresentative(id: number) {
햣		return api.patch(`/career-projects/${id}/representative`);
	},
}; 