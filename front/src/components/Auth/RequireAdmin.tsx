import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

function base64UrlDecode(input: string): string {
    try {
        const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
        if (typeof window === "undefined") return Buffer.from(padded, "base64").toString("utf-8");
        return decodeURIComponent(
            Array.prototype.map
                .call(atob(padded), (c: string) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );
    } catch {
        return "";
    }
}

function decodeJwtPayload(token: string): any | null {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        const json = base64UrlDecode(parts[1]);
        return JSON.parse(json);
    } catch {
        return null;
    }
}

function includesAdmin(value: unknown): boolean {
    if (!value) return false;
    const asString = (v: unknown) => (typeof v === "string" ? v : Array.isArray(v) ? v.join(" ") : "");
    const text = asString(value).toUpperCase();
    return text.includes("ROLE_ADMIN") || text === "ADMIN" || text.split(/[ ,]/).includes("ADMIN");
}

function isAdminFromToken(token: string | null): boolean {
    if (!token) return false;
    const payload = decodeJwtPayload(token);
    if (!payload) return false;
    const candidates = [payload.roles, payload.authorities, payload.auth, payload.scope, payload.scopes, payload.role];
    return candidates.some(includesAdmin);
}

export default function RequireAdmin({ children }: { children?: React.ReactNode }) {
    const location = useLocation();
    const token = (typeof window !== "undefined" && (localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken"))) || null;
    const ok = isAdminFromToken(token);

    if (!ok) {
        return <Navigate to="/" replace state={{ from: location }} />;
    }
    return children ? <>{children}</> : <Outlet />;
}


