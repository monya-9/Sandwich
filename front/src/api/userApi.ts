import api from "./axiosInstance";

export type PositionDto = { id: number; name: string };
export type InterestDto = { id: number; name: string };
export type UserProfileResponse = {
	username: string;
	email: string;
	nickname: string;
	bio?: string | null;
	skills?: string | null;
	github?: string | null;
	linkedin?: string | null;
	profileImage?: string | null;
	position?: PositionDto | null;
	interests: InterestDto[];
	followerCount: number;
	followingCount: number;
};

export type UserProfileRequest = {
	nickname: string;
	positionId: number;
	interestIds: number[];
	bio?: string | null;
	skills?: string | null;
	github?: string | null;
	linkedin?: string | null;
	profileImageUrl?: string | null;
};

export const UserApi = {
	async checkNickname(nickname: string): Promise<{ exists: boolean; message?: string }> {
		const res = await api.get("/auth/nickname/check", { params: { nickname } });
		return res.data as any;
	},
	async updateNickname(nickname: string): Promise<void> {
		await api.patch("/users/nickname", { nickname });
	},
	async getMe(): Promise<UserProfileResponse> {
		const res = await api.get<UserProfileResponse>("/users/me");
		return res.data;
	},
	async updateProfile(payload: UserProfileRequest): Promise<void> {
		await api.put("/users/profile", payload);
	},
	async uploadImage(file: File): Promise<string> {
		const form = new FormData();
		form.append("file", file);
		const res = await api.post<{ url: string }>("/upload/image", form, { headers: { "Content-Type": "multipart/form-data" } });
		return (res as any).data.url;
	},
};
