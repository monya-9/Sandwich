import React, { useState } from "react";
import { FaQrcode } from "react-icons/fa";

interface QrCodeActionProps {
  qrImageUrl: string;
}

export default function QrCodeAction({ qrImageUrl }: QrCodeActionProps) {
  const [hover, setHover] = useState(false);

  return (
    <div className="relative">
      <button
        className="flex flex-col items-center gap-1 group"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => window.open(qrImageUrl, "_blank")}
      >
        		<div className="w-14 h-14 rounded-full bg-white shadow flex items-center justify-center mb-1">
			<FaQrcode className="w-6 h-6" />
		</div>
		<span className="text-xs text-white font-semibold text-center">QR코드</span>
      </button>
      {hover && (
        <div className="absolute right-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-50 px-4 py-2 rounded-xl bg-black text-white text-sm shadow">
          QR코드 보기
        </div>
      )}
    </div>
  );
}
