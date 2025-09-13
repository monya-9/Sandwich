import { postMessage, type SendMessageBody } from "./messages";

/** 폼에서 쓰는 payload 타입 (UI 카드와 동일한 형태로 맞춰 주세요) */
export type ProjectPayload = {
    title: string;
    contact: string;
    budget: string | number;
    description: string;
    attachments?: { url: string; name?: string }[];
};

export type JobOfferPayload = {
    companyName: string;
    salary: string;     // "4,000 - 6,000만원(협의가능)" 같은 문자열
    location: string;
    description: string;
    attachments?: { url: string; name?: string }[];
};

export async function sendProjectProposal(targetUserId: number, form: ProjectPayload) {
    const body: SendMessageBody = {
        targetUserId,
        type: "PROJECT_PROPOSAL",         // 서버 스펙에 맞게 유지
        content: form.title || "프로젝트 제안", // 드롭다운/목록 프리뷰용
        payload: form,
    };
    return postMessage(body);
}

export async function sendJobOffer(targetUserId: number, form: JobOfferPayload) {
    const body: SendMessageBody = {
        targetUserId,
        type: "JOB_OFFER",
        content: form.companyName || "채용 제안",
        payload: form,
    };
    return postMessage(body);
}
