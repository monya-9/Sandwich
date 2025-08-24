export interface PositionMeta {
    id: number;
    name: string;
}

export type InterestType = "GENERAL" | "TECH";

export interface InterestMeta {
    id: number;
    name: string;
    type?: InterestType;
}
