// src/api/challengeApi.ts
import api from "./axiosInstance";

/** 공통 */
export type SubmissionKind = "CODE" | "PORTFOLIO";
export type SubmissionStatus = "PENDING" | "RUNNING" | "PASSED" | "FAILED" | "SCORED";

export type CreateSubmissionPayload =
    | ({
    type: "CODE";
    title: string;
    repoUrl: string;
    language: "node" | "python";
    entrypoint: string;
    note?: string;
})
    | ({
    type: "PORTFOLIO";
    title: string;
    repoUrl?: string;
    demoUrl?: string;
    desc?: string;
    // assets?: { s3Key: string; mime: string }[];
});

export type SubmissionCreated = { id: number; status: SubmissionStatus };

/** 👉 에러났던 필드들 전부 포함 */
export type SubmissionDetail = {
    id: number;
    challengeId: number;
    type: SubmissionKind;

    title: string;
    repoUrl?: string | null;
    demoUrl?: string | null;
    language?: "node" | "python" | string | null;
    entrypoint?: string | null;
    note?: string | null;

    status: SubmissionStatus;
    score?: number | null;
    passed?: number | null;
    failed?: number | null;
    coverage?: number | null;
    aiComment?: string | null;

    createdAt?: string;
    updatedAt?: string;
};

export const challengeApi = {
    async createSubmission(challengeId: number, payload: CreateSubmissionPayload): Promise<SubmissionCreated> {
        const { data } = await api.post(`/challenges/${challengeId}/submissions`, payload);
        return data;
    },

    async getSubmission(submissionId: number): Promise<SubmissionDetail> {
        const { data } = await api.get(`/submissions/${submissionId}`);
        return data;
    },

    async updateSubmission(submissionId: number, patch: Partial<CreateSubmissionPayload>): Promise<SubmissionDetail> {
        const { data } = await api.patch(`/submissions/${submissionId}`, patch);
        return data;
    },
};
