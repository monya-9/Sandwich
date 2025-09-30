import React from "react";

type Props = {
	onAdd: (file: File) => void;
};

// Exported helper to use outside the UI component
export async function processImageFile(file: File): Promise<{ ok: boolean; dataUrl?: string; reason?: string }> {
	const MAX_SIZE = 10 * 1024 * 1024; // 10MB
	const allowed = ["jpg", "jpeg", "png", "webp"];
	const ext = (file.name.split(".").pop() || "").toLowerCase();
	if (file.size > MAX_SIZE || !allowed.includes(ext)) {
		return { ok: false, reason: "oversize_or_type" };
	}
	const dataUrl = await downscaleImage(file);
	return { ok: true, dataUrl };
}

async function downscaleImage(file: File, maxWidth = 1600): Promise<string> {
	return new Promise((resolve) => {
		const reader = new FileReader();
		reader.onload = () => {
			try {
				const img = new Image();
				img.onload = () => {
					try {
						const w = (img as any).naturalWidth || img.width;
						const h = (img as any).naturalHeight || img.height;
						const scale = w > maxWidth ? maxWidth / w : 1;
						const canvas = document.createElement("canvas");
						canvas.width = Math.round(w * scale);
						canvas.height = Math.round(h * scale);
						const ctx = canvas.getContext("2d", { alpha: true });
						if (!ctx) { resolve(reader.result as string); return; }
						ctx.imageSmoothingEnabled = true;
						ctx.imageSmoothingQuality = "high" as any;
						ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
						canvas.toBlob((blob) => {
							if (!blob) { resolve(reader.result as string); return; }
							const fr = new FileReader();
							fr.onload = () => resolve(fr.result as string);
							fr.onerror = () => resolve(reader.result as string);
							fr.readAsDataURL(blob);
						}, "image/webp", 0.85);
					} catch { resolve(reader.result as string); }
				};
				img.onerror = () => resolve(reader.result as string);
				img.src = reader.result as string;
			} catch { resolve(reader.result as string); }
		};
		reader.onerror = () => resolve("");
		reader.readAsDataURL(file);
	});
}

export default function ImageUploadSection({ onAdd }: Props) {
	const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files && e.target.files[0];
		if (file) onAdd(file);
		e.currentTarget.value = "";
	};
	return (
		<div className="flex items-center gap-2">
			<label className="inline-flex items-center px-3 py-2 rounded-md border cursor-pointer hover:bg-gray-50">
				<input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handleFile} />
				이미지 추가
			</label>
		</div>
	);
} 