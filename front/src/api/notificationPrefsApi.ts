import api from "./axiosInstance";

export type NotificationPrefsDTO = {
	// push
	pushMessage: boolean;
	pushComment: boolean;
	pushLike: boolean;
	pushFollow: boolean;
	pushEvent: boolean;
	pushCollection?: boolean | null;
	pushWorkDigest: boolean;
	// email
	emailMessage: boolean;
	emailComment: boolean;
	emailLike: boolean;
	emailFollow: boolean;
	emailEvent: boolean;
	emailWorkDigest: boolean;
};

export type NotificationPrefsUpdate = Partial<NotificationPrefsDTO>;

export const NotificationPrefsApi = {
	async getMy() {
		const res = await api.get<NotificationPrefsDTO>("/notifications/prefs/me");
		return res.data;
	},
	async updateMy(payload: NotificationPrefsUpdate) {
		const res = await api.put<NotificationPrefsDTO>("/notifications/prefs/me", payload);
		return res.data;
	},
}; 