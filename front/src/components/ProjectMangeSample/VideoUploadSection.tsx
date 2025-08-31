import React, { useState } from "react";

type Props = {
	onAdd: (embedUrl: string) => void;
};

export function normalizeVideoUrl(raw: string): string | null {
	try {
		let u = raw.trim();
		if (u.startsWith("http://")) u = "https://" + u.slice(7);
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
	return (
		<div className="flex items-center gap-2">
			<input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="YouTube/Vimeo URL" className="border rounded px-2 py-1 w-[260px]" />
			<button
				type="button"
				className="px-3 py-1 rounded-md border hover:bg-gray-50"
				onClick={() => {
					const embed = normalizeVideoUrl(url);
					if (embed) onAdd(embed);
					else alert('지원하지 않는 동영상 URL 형식입니다. YouTube 또는 Vimeo 링크를 입력해주세요.');
					setUrl("");
				}}
			>
				추가
			</button>
		</div>
	);
} 