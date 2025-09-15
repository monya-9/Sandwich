import api from "./axiosInstance";

export interface CareerPayload {
	role: string;
	companyName: string;
	startYear: number;
	startMonth: number;
	endYear?: number | null;
	endMonth?: number | null;
	isWorking: boolean;
	description?: string;
	isRepresentative: boolean;
}

export const CareerApi = {
	create(payload: CareerPayload) {
		return api.post("/careers", payload);
	},
	update(id: number, payload: CareerPayload) {
		return api.put(`/careers/${id}`, payload);
	},
	remove(id: number) {
		return api.delete(`/careers/${id}`);
	},
	list() {
		return api.get("/careers");
	},
	setRepresentative(id: number) {
		return api.patch(`/careers/${id}/representative`);
	},
}; 