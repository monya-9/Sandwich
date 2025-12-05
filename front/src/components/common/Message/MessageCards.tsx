import React from "react";

/** PROJECT_PROPOSAL / PROJECT_OFFER payload 타입 예시 */
export type ProjectPayload = {
    title?: string;
    contact?: string;
    budget?: number | string;
    description?: string;
    attachments?: { name: string; url?: string }[];
};

/** JOB_OFFER payload 타입 예시 */
export type JobOfferPayload = {
    companyName?: string;
    salary?: string;          // "4,000-6,000만원(협의가능)" 등 문자열
    location?: string;
    description?: string;
    attachments?: { name: string; url?: string }[];
    isNegotiable?: boolean;
};

export const CardShell: React.FC<
    React.PropsWithChildren<{ title: string; icon?: React.ReactNode }>
> = ({ title, icon, children }) => (
    <div className="max-w-[calc(100vw-100px)] sm:max-w-[520px] rounded-2xl overflow-hidden bg-white dark:bg-neutral-900 shadow-sm border border-gray-200 dark:border-neutral-700">
        <div className="bg-teal-500 text-white px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold flex items-center gap-2">
            {icon ?? <span className="inline-block w-3 h-3 sm:w-4 sm:h-4">✉️</span>}
            {title}
        </div>
        <div className="p-3 sm:p-4 text-xs sm:text-sm text-gray-800 dark:text-gray-200 space-y-2 sm:space-y-3">{children}</div>
    </div>
);

const Row: React.FC<{ label: string; value?: React.ReactNode }> = ({
                                                                       label,
                                                                       value,
                                                                   }) => (
    <div className="grid grid-cols-[80px_1fr] sm:grid-cols-[110px_1fr] gap-2 sm:gap-3">
        <div className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-sm font-medium">{label}</div>
        <div className="whitespace-pre-wrap text-[10px] sm:text-sm break-words">{value ?? "-"}</div>
    </div>
);

export const ProjectProposalCard: React.FC<{ data: ProjectPayload }> = ({
                                                                            data,
                                                                        }) => (
    <CardShell title="프로젝트 의뢰 / 프리랜서 제안">
        <Row label="프로젝트 제목" value={data.title} />
        <Row label="연락처" value={data.contact} />
        <Row label="프로젝트 예산" value={data.budget} />
        <Row label="프로젝트 내용" value={data.description} />
        {data.attachments && data.attachments.length > 0 && (
            <Row
                label="첨부파일"
                value={
                    <ul className="list-disc pl-4">
                        {data.attachments.map((f, i) => (
                            <li key={i}>
                                {f.url ? (
                                    <a
                                        className="text-blue-600 underline"
                                        href={f.url}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        {f.name}
                                    </a>
                                ) : (
                                    f.name
                                )}
                            </li>
                        ))}
                    </ul>
                }
            />
        )}
    </CardShell>
);

export const JobOfferCard: React.FC<{ data: JobOfferPayload }> = ({ data }) => (
    <CardShell title="채용 제안">
        <Row label="회사 이름" value={data.companyName} />
        <Row
            label="연봉"
            value={
                data.salary
                    ? data.isNegotiable
                        ? `${data.salary}(협의가능)`
                        : data.salary
                    : "-"
            }
        />
        <Row label="근무 위치" value={data.location} />
        <Row label="내용" value={data.description} />
        {data.attachments && data.attachments.length > 0 && (
            <Row
                label="첨부파일"
                value={
                    <ul className="list-disc pl-4">
                        {data.attachments.map((f, i) => (
                            <li key={i}>
                                {f.url ? (
                                    <a
                                        className="text-blue-600 underline"
                                        href={f.url}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        {f.name}
                                    </a>
                                ) : (
                                    f.name
                                )}
                            </li>
                        ))}
                    </ul>
                }
            />
        )}
    </CardShell>
);
