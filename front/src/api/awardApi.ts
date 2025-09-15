import api from "./axiosInstance";

export interface AwardPayload {
	title: string;
	issuer: string;
	year: number;
	month: number;
	description?: string;
	isRepresentative: boolean;
}

export const AwardApi = {
	create(payload: AwardPayload) {
		return api.post("/awards", payload);
	},
	update(id: number, payload: AwardPayload) {
		return api.put(`/awards/${id}`, payload);
	},
	remove(id: number) {
		return api.delete(`/awards/${id}`);
	},
	list() {
		return api.get("/awards");
	},
	setRepresentative(id: number) {
		return api.patch(`/awards/${id}/representative`);
	},
}; 