import React, { useState } from "react";
import Toast from "../common/Toast";

type Props = {
	onAdd: (embedUrl: string) => void;
};

export function normalizeVideoUrl(raw: string): string | null {
	try {
		let u = (raw || "").trim();
		if (!u) return null;
		// iframe snippet 붙여넣기 지원
		const iframeSrc = u.match(/<iframe[^>]*src=\"([^\"]+)\"[^>]*><\/iframe>/i);
		if (iframeSrc) u = iframeSrc[1];
		if (u.startsWith("http://")) u = "https://" + u.slice(7);
		// URL 파싱 후 호스트/패스 정규화
		let parsed: URL | null = null;
		try { parsed = new URL(u); } catch { parsed = null; }
		if (parsed) {
			const host = parsed.hostname.replace(/^m\./, "");
			const path = parsed.pathname.replace(/\/+$/, "");
			// YouTube variants
			if (/^(www\.)?youtube\.com$/.test(host)) {
				// watch?v=ID, shorts/ID, live/ID, embed/ID
				const v = parsed.searchParams.get("v");
				if (v) return `https://www.youtube.com/embed/${v}`;
				const m = path.match(/^\/(shorts|live|embed)\/([\w-]+)/i);
				if (m) return `https://www.youtube.com/embed/${m[2]}`;
			}
			if (/^(www\.)?youtu\.be$/.test(host)) {
				const id = path.split("/").filter(Boolean)[0];
				if (id) return `https://www.youtube.com/embed/${id}`;
			}
			// Vimeo
			if (/^(www\.)?vimeo\.com$/.test(host)) {
				const id = path.split("/").filter(Boolean)[0];
				if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
			}
			if (/^(player\.)?vimeo\.com$/.test(host) && /\/video\//.test(path)) {
				return `https://player.vimeo.com${path}`;
			}
		}
		// 마지막 폴백: 기존 정규식
		const ytWatch = u.match(/https?:\/\/(www\.)?youtube\.com\/watch\?v=([\w-]+)/i);
		if (ytWatch) return `https://www.youtube.com/embed/${ytWatch[2]}`;
		const ytShort = u.match(/https?:\/\/(www\.)?youtu\.be\/([\w-]+)/i);
		if (ytShort) return `https://www.youtube.com/embed/${ytShort[2]}`;
		const ytShorts = u.match(/https?:\/\/(www\.)?youtube\.com\/shorts\/([\w-]+)/i);
		if (ytShorts) return `https://www.youtube.com/embed/${ytShorts[2]}`;
		const ytEmbed = u.match(/https?:\/\/(www\.)?youtube\.com\/embed\/([\w-]+)/i);
		if (ytEmbed) return u;
		const vimeo = u.match(/https?:\/\/(www\.)?vimeo\.com\/(\d+)/i);
		if (vimeo) return `https://player.vimeo.com/video/${vimeo[2]}`;
		return null;
	} catch { return null; }
}

export default function VideoUploadSection({ onAdd }: Props) {
	const [url, setUrl] = useState("");
	const [errorToast, setErrorToast] = useState<{ visible: boolean; message: string }>({
		visible: false,
		message: ''
	});
	return (
		<>
			<Toast
				visible={errorToast.visible}
				message={errorToast.message}
				type="error"
				size="medium"
				autoClose={3000}
				closable={true}
				onClose={() => setErrorToast(prev => ({ ...prev, visible: false }))}
			/>
			<div className="flex items-center gap-2">
			<input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="YouTube/Vimeo URL" className="border rounded px-2 py-1 w-[260px]" />
			<button
				type="button"
				className="px-3 py-1 rounded-md border hover:bg-gray-50"
				onClick={() => {
					const embed = normalizeVideoUrl(url);
					if (embed) onAdd(embed);
					else {
					setErrorToast({
						visible: true,
						message: '지원하지 않는 동영상 URL 형식입니다. YouTube 또는 Vimeo 링크를 입력해주세요.'
					});
				}
					setUrl("");
				}}
			>
				추가
			</button>
		</div>
		</>
	);
} 