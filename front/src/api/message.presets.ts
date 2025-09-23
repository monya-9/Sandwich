import { postMessage, type SendMessageBody } from "./messages";

/** 폼에서 쓰는 payload 타입 (UI 카드와 동일한 형태로 맞춰 주세요) */
export type ProjectPayload = {
    title: string;
    contact: string;
    budget: string | number;
    description: string;
    isNegotiable?: boolean;
    attachments?: { url: string; name?: string }[];
};

export type JobOfferPayload = {
    companyName: string;
    salary: string;     // "4,000 - 6,000만원(협의가능)" 같은 문자열
    location: string;
    description: string;
    isNegotiable?: boolean;
    position?: string;
    attachments?: { url: string; name?: string }[];
};

export async function sendProjectProposal(targetUserId: number, form: ProjectPayload) {
    const body: SendMessageBody = {
        targetUserId,
        type: "PROJECT_OFFER",            // 서버 스펙에 맞게 변경
        content: null,
        payload: JSON.stringify(form),
        // top-level 필드도 함께 전송 (백엔드가 우선 사용)
        title: form.title,
        contact: form.contact,
        budget: String(form.budget ?? ""),
        description: form.description,
        isNegotiable: !!form.isNegotiable,
    } as any;
    return postMessage(body);
}

export async function sendJobOffer(targetUserId: number, form: JobOfferPayload) {
    const body: SendMessageBody = {
        targetUserId,
        type: "JOB_OFFER",
        content: null,
        payload: JSON.stringify(form),
        // top-level 필드도 함께 전송
        companyName: form.companyName,
        position: (form.position && String(form.position).trim()) || "기타",
        salary: form.isNegotiable ? null : (form.salary ?? null),
        location: form.location,
        isNegotiable: !!form.isNegotiable,
        description: form.description,
    } as any;
    return postMessage(body);
}
