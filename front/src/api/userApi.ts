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
	coverImage?: string | null;
	position?: PositionDto | null;
	interests: InterestDto[];
	followerCount: number;
	followingCount: number;
	profileName?: string | null; // one-line profile
	profileSlug?: string | null; // 프로필 URL용 슬러그
	roles?: string[]; // 사용자 권한 (ROLE_USER, ROLE_ADMIN, ROLE_AI)
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
	coverImageUrl?: string | null;
};

// 대표 커리어(경력/학력/수상/프로젝트) 요약 응답
export type RepresentativeCareer = {
	type: "CAREER" | "EDUCATION" | "AWARD" | "PROJECT" | "PROJECT_RESUME" | "PROJECT_PORTFOLIO";
	title: string;
	subtitle: string;
	description?: string | null;
};

export const UserApi = {
	async checkNickname(nickname: string): Promise<boolean> {
		const res = await api.get<boolean>("/users/check-nickname", { params: { value: nickname } });
		return res.data;
	},
	async updateNickname(nickname: string): Promise<void> {
		await api.patch("/users/nickname", { nickname });
	},
	async checkUsername(username: string): Promise<{ exists: boolean; message?: string }> {
		const res = await api.get("/auth/username/check", { params: { username } });
		return res.data as any;
	},
	async updateUsername(username: string): Promise<void> {
		await api.patch("/users/username", { username });
	},
	async updateBio(bio: string): Promise<void> {
		await api.patch("/users/profile/bio", { bio });
	},
	async getMe(): Promise<UserProfileResponse> {
		const res = await api.get<UserProfileResponse>("/users/me");
		return res.data;
	},
	// 대표 커리어 목록 조회
	async getRepresentativeCareers(): Promise<RepresentativeCareer[]> {
		const res = await api.get<RepresentativeCareer[]>("/users/me/representative-careers");
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
	async getPosition(): Promise<PositionDto> {
		const res = await api.get<PositionDto>("/users/position");
		return res.data;
	},
	async updatePosition(positionId: number): Promise<void> {
		await api.put("/users/position", { positionId });
	},
	// slug로 프로필 조회 (인증 불필요)
	async getProfileBySlug(slug: string): Promise<UserProfileResponse> {
		const res = await api.get<UserProfileResponse>(`/users/slug/${slug}`);
		return res.data;
	},
};
