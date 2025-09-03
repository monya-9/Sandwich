import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";

export type HandleType = 'move' | 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'scale';

export interface CoverCropperProps {
  open: boolean;
  src: string | null;
  onClose: () => void;
  onCropped: (
    square: { blob: Blob; url: string },
    rect: { blob: Blob; url: string }
  ) => void;
}

const SQUARE_OUT = 1520; // 760의 2배
const RECT_OUT_W = 2360; // 1180의 2배
const RECT_OUT_H = 1520; // 760의 2배 (3:2)
const RECT_RATIO = RECT_OUT_H / RECT_OUT_W; // h / w

const CoverCropper: React.FC<CoverCropperProps> = ({ open, src, onClose, onCropped }) => {
  const [stage, setStage] = useState({ w: 360, h: 240 });
  const minBox = 60;

  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [fitScale, setFitScale] = useState(1);
  const [imgW, setImgW] = useState(0);
  const [imgH, setImgH] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const [boxSq, setBoxSq] = useState({ x: 0, y: 0, w: 80, h: 80 });
  const [dragSq, setDragSq] = useState<{ type: HandleType | null; sx: number; sy: number; start: { x: number; y: number; w: number; h: number } } | null>(null);

  const [boxRect, setBoxRect] = useState({ x: 0, y: 0, w: 120, h: 60 });
  const [dragRect, setDragRect] = useState<{ type: HandleType | null; sx: number; sy: number; start: { x: number; y: number; w: number; h: number } } | null>(null);
  const [activeCrop, setActiveCrop] = useState<'square' | 'rect'>('square');
  const rectRatioRef = useRef(RECT_RATIO); // 고정 3:2

  // 공통: 현재 뷰포트에서 최대 스테이지 경계 계산
  const getMaxStage = () => {
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    const maxW = Math.min(760, Math.floor(vw * 0.6));
    const maxH = Math.min(420, Math.floor(vh * 0.55));
    return { maxW, maxH };
  };

  // 이미지 로드 시 스테이지/이미지 배치 계산
  useEffect(() => {
    if (!open || !src) return;
    const im = new Image();
    try {
      if (/^https?:\/\//i.test(src)) {
        im.crossOrigin = 'anonymous';
      }
    } catch {}
    im.onload = () => {
      const { maxW, maxH } = getMaxStage();
      const scale = Math.min(maxW / im.width, maxH / im.height, 1);
      const w = Math.max(1, Math.round(im.width * scale));
      const h = Math.max(1, Math.round(im.height * scale));
      setImg(im);
      setFitScale(scale);
      setImgW(w);
      setImgH(h);
      setStage({ w, h });
      setOffset({ x: 0, y: 0 });
      const sqSize = Math.min(w, h) * 0.6;
      setBoxSq({ x: (w - sqSize) / 2, y: (h - sqSize) / 2, w: sqSize, h: sqSize });
      // 직사각형 초기화: 3:2 비율 유지, 이미지 내부 최대
      let initW = Math.min(w * 0.9, w);
      let initH = initW * rectRatioRef.current;
      if (initH > h) { initH = h * 0.9; initW = initH / rectRatioRef.current; }
      setBoxRect({ x: (w - initW) / 2, y: (h - initH) / 2, w: initW, h: initH });
    };
    im.src = src;
  }, [open, src]);

  // 리사이즈 시 재계산 (이미지가 로드된 경우)
  useEffect(() => {
    if (!open || !img) return;
    const onResize = () => {
      const { maxW, maxH } = getMaxStage();
      const scale = Math.min(maxW / img.width, maxH / img.height, 1);
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      setFitScale(scale);
      setImgW(w);
      setImgH(h);
      setStage({ w, h });
      setOffset({ x: 0, y: 0 });
      const sqSize = Math.min(w, h) * 0.6;
      setBoxSq({ x: (w - sqSize) / 2, y: (h - sqSize) / 2, w: sqSize, h: sqSize });
      let initW = Math.min(w * 0.9, w);
      let initH = initW * rectRatioRef.current;
      if (initH > h) { initH = h * 0.9; initW = initH / rectRatioRef.current; }
      setBoxRect({ x: (w - initW) / 2, y: (h - initH) / 2, w: initW, h: initH });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [open, img]);

  // 강제적으로 상위의 필터/블렌드 영향 제거 (모달이 열릴 때만)
  useEffect(() => {
    if (!open) return;
    const htmlEl = document.documentElement as HTMLElement & { style: any };
    const bodyEl = document.body as HTMLBodyElement & { style: any };

    const prev = {
      htmlFilter: htmlEl.style.filter,
      htmlBackdrop: htmlEl.style.backdropFilter,
      htmlMix: htmlEl.style.mixBlendMode,
      bodyFilter: bodyEl.style.filter,
      bodyBackdrop: bodyEl.style.backdropFilter,
      bodyMix: bodyEl.style.mixBlendMode,
    };

    htmlEl.style.filter = 'none';
    htmlEl.style.backdropFilter = 'none';
    htmlEl.style.mixBlendMode = 'normal';
    bodyEl.style.filter = 'none';
    bodyEl.style.backdropFilter = 'none';
    bodyEl.style.mixBlendMode = 'normal';

    return () => {
      htmlEl.style.filter = prev.htmlFilter;
      htmlEl.style.backdropFilter = prev.htmlBackdrop;
      htmlEl.style.mixBlendMode = prev.htmlMix;
      bodyEl.style.filter = prev.bodyFilter;
      bodyEl.style.backdropFilter = prev.bodyBackdrop;
      bodyEl.style.mixBlendMode = prev.bodyMix;
    };
  }, [open]);

  const clampSq = (b: { x: number; y: number; w: number; h: number }) => {
    const minX = offset.x, minY = offset.y;
    const maxX = offset.x + imgW, maxY = offset.y + imgH;
    let { x, y, w, h } = b;
    const maxSize = Math.min(imgW, imgH);
    const size = Math.max(minBox, Math.min(Math.min(w, h), maxSize));
    w = size; h = size;
    if (x < minX) x = minX;
    if (y < minY) y = minY;
    if (x + w > maxX) x = maxX - w;
    if (y + h > maxY) y = maxY - h;
    return { x, y, w, h };
  };

  const clampRect = (b: { x: number; y: number; w: number; h: number }) => {
    const minX = offset.x, minY = offset.y;
    const maxX = offset.x + imgW, maxY = offset.y + imgH;
    let { x, y, w, h } = b;
    const ratio = rectRatioRef.current;
    // 비율 복원
    h = w * ratio;
    if (h > imgH) { h = imgH; w = h / ratio; }
    if (w > imgW) { w = imgW; h = w * ratio; }
    w = Math.max(minBox, w);
    h = Math.max(minBox, h);
    if (x < minX) x = minX;
    if (y < minY) y = minY;
    if (x + w > maxX) x = Math.max(minX, maxX - w);
    if (y + h > maxY) y = Math.max(minY, maxY - h);
    return { x, y, w, h };
  };

  // 확대/축소 유틸
  const scaleSquareBy = (factor: number) => {
    const cx = boxSq.x + boxSq.w / 2;
    const cy = boxSq.y + boxSq.h / 2;
    let size = boxSq.w * factor;
    size = Math.max(minBox, Math.min(size, Math.min(imgW, imgH)));
    const nx = cx - size / 2;
    const ny = cy - size / 2;
    setBoxSq(clampSq({ x: nx, y: ny, w: size, h: size }));
  };
  const setSquareSideToPx = (sidePx: number) => {
    let size = sidePx * fitScale;
    size = Math.max(minBox, Math.min(size, Math.min(imgW, imgH)));
    const cx = boxSq.x + boxSq.w / 2;
    const cy = boxSq.y + boxSq.h / 2;
    setBoxSq(clampSq({ x: cx - size / 2, y: cy - size / 2, w: size, h: size }));
  };

  const scaleRectBy = (factor: number) => {
    const cx = boxRect.x + boxRect.w / 2;
    const cy = boxRect.y + boxRect.h / 2;
    let w = boxRect.w * factor;
    let h = boxRect.h * factor;
    w = Math.max(minBox, Math.min(w, imgW));
    h = Math.max(minBox, Math.min(h, imgH));
    setBoxRect(clampRect({ x: cx - w / 2, y: cy - h / 2, w, h }));
  };
  const setRectWidthToPx = (widthPx: number) => {
    const ratio = boxRect.h / boxRect.w;
    let w = widthPx * fitScale;
    let h = w * ratio;
    if (w > imgW) { w = imgW; h = w * ratio; }
    if (h > imgH) { h = imgH; w = h / ratio; }
    w = Math.max(minBox, w);
    h = Math.max(minBox, h);
    const cx = boxRect.x + boxRect.w / 2;
    const cy = boxRect.y + boxRect.h / 2;
    setBoxRect(clampRect({ x: cx - w / 2, y: cy - h / 2, w, h }));
  };

  // 가장자리 감지: 테두리에서 8px 이내면 해당 방향 리사이즈, 아니면 move
  const detectEdgeType = (e: React.MouseEvent): HandleType => {
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const t = 8;
    const nearL = x < t; const nearR = r.width - x < t; const nearT = y < t; const nearB = r.height - y < t;
    if (nearT && nearL) return 'nw';
    if (nearT && nearR) return 'ne';
    if (nearB && nearL) return 'sw';
    if (nearB && nearR) return 'se';
    if (nearT) return 'n';
    if (nearB) return 's';
    if (nearL) return 'w';
    if (nearR) return 'e';
    return 'move';
  };

  const onDownSq = (e: React.MouseEvent, type: HandleType) => {
    e.preventDefault();
    const actualType: HandleType = type;
    setActiveCrop('square');
    setDragSq({ type: actualType, sx: e.clientX, sy: e.clientY, start: { x: boxSq.x, y: boxSq.y, w: boxSq.w, h: boxSq.h } });
  };
  const onDownRect = (e: React.MouseEvent, type: HandleType) => {
    e.preventDefault();
    const actualType: HandleType = type;
    setActiveCrop('rect');
    setDragRect({ type: actualType, sx: e.clientX, sy: e.clientY, start: { x: boxRect.x, y: boxRect.y, w: boxRect.w, h: boxRect.h } });
  };

  const handleDownSq = (e: React.MouseEvent) => onDownSq(e, detectEdgeType(e));
  const handleDownRect = (e: React.MouseEvent) => onDownRect(e, detectEdgeType(e));

  useEffect(() => {
    if (!dragSq) return;
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - dragSq.sx; const dy = ev.clientY - dragSq.sy;
      if (dragSq.type === 'move') {
        setBoxSq(prev => clampSq({ ...prev, x: dragSq.start.x + dx, y: dragSq.start.y + dy }));
        return;
      }
      if (dragSq.type === 'scale') {
        const d = Math.abs(dx) > Math.abs(dy) ? dx : dy;
        const size = dragSq.start.w + d;
        const nx = dragSq.start.x + (dragSq.start.w - size) / 2;
        const ny = dragSq.start.y + (dragSq.start.h - size) / 2;
        setBoxSq(clampSq({ x: nx, y: ny, w: size, h: size }));
        return;
      }
      let size = dragSq.start.w + Math.max(dx, dy) * (['e','se','s'].includes(String(dragSq.type)) ? 1 : -1);
      let nx = dragSq.start.x, ny = dragSq.start.y;
      if (['nw','n','w'].includes(String(dragSq.type))) { nx = dragSq.start.x + (dragSq.start.w - size); ny = dragSq.start.y + (dragSq.start.h - size); }
      setBoxSq(clampSq({ x: nx, y: ny, w: size, h: size }));
    };
    const onUp = () => setDragSq(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragSq]);

  useEffect(() => {
    if (!dragRect) return;
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - dragRect.sx;
      const dy = ev.clientY - dragRect.sy;
      let { x, y, w, h } = dragRect.start;
      switch (dragRect.type) {
        case 'move': x = dragRect.start.x + dx; y = dragRect.start.y + dy; break;
        case 'e': w = dragRect.start.w + dx; break;
        case 'w': x = dragRect.start.x + dx; w = dragRect.start.w - dx; break;
        case 's': h = dragRect.start.h + dy; break;
        case 'n': y = dragRect.start.y + dy; h = dragRect.start.h - dy; break;
        case 'se': w = dragRect.start.w + dx; h = dragRect.start.h + dy; break;
        case 'ne': y = dragRect.start.y + dy; h = dragRect.start.h - dy; w = dragRect.start.w + dx; break;
        case 'sw': x = dragRect.start.x + dx; w = dragRect.start.w - dx; h = dragRect.start.h + dy; break;
        case 'nw': x = dragRect.start.x + dx; y = dragRect.start.y + dy; w = dragRect.start.w - dx; h = dragRect.start.h - dy; break;
        case 'scale': {
          const d = Math.abs(dx) > Math.abs(dy) ? dx : dy;
          const ratio = dragRect.start.h / dragRect.start.w;
          w = dragRect.start.w + d;
          h = w * ratio;
          x = dragRect.start.x + (dragRect.start.w - w) / 2;
          y = dragRect.start.y + (dragRect.start.h - h) / 2;
          break;
        }
        default: break;
      }
      setBoxRect(clampRect({ x, y, w, h }));
    };
    const onUp = () => setDragRect(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragRect]);

  const cropToBlob = (crop: { x: number; y: number; w: number; h: number }) => {
    if (!img) return Promise.resolve<Blob | null>(null);
    const cropX = (crop.x - offset.x) / fitScale;
    const cropY = (crop.y - offset.y) / fitScale;
    const cropW = crop.w / fitScale;
    const cropH = crop.h / fitScale;
    const size = SQUARE_OUT;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return Promise.resolve(null);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0,0,size,size);
    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, size, size);
    return new Promise((resolve)=>{
      canvas.toBlob(b=>resolve(b), 'image/jpeg', 0.92);
    });
  };

  const cropRectToBlob = (crop: { x: number; y: number; w: number; h: number }) => {
    if (!img) return Promise.resolve<Blob | null>(null);
    const cropX = (crop.x - offset.x) / fitScale;
    const cropY = (crop.y - offset.y) / fitScale;
    const cropW = crop.w / fitScale;
    const cropH = crop.h / fitScale;
    const outW = RECT_OUT_W; const outH = RECT_OUT_H;
    const canvas = document.createElement('canvas');
    canvas.width = outW; canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return Promise.resolve(null);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0,0,outW,outH);
    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, outW, outH);
    return new Promise((resolve)=>{
      canvas.toBlob(b=>resolve(b), 'image/jpeg', 0.92);
    });
  };

  const doCrop = async () => {
    try {
      const sqBlob = await cropToBlob(boxSq);
      const rtBlob = await cropRectToBlob(boxRect);
      if (!sqBlob || !rtBlob) {
        try { alert('이미지를 처리할 수 없습니다. 다른 이미지를 시도해주세요.'); } catch {}
        onClose();
        return;
      }
      const sq = { blob: sqBlob as Blob, url: URL.createObjectURL(sqBlob as Blob) };
      const rt = { blob: rtBlob as Blob, url: URL.createObjectURL(rtBlob as Blob) };
      onCropped(sq, rt);
      onClose();
    } catch (_e) {
      try { alert('이미지 크롭 중 오류가 발생했습니다.'); } catch {}
      onClose();
    }
  };

  const renderHandles = (onDown: (e: React.MouseEvent, t: HandleType)=>void) => (
    (['nw','n','ne','e','se','s','sw','w'] as HandleType[]).map((pos)=>{
      const common = 'absolute w-4 h-4 bg-white border border-black';
      const styleMap: Record<HandleType | string, React.CSSProperties> = {
        nw: { left: -8, top: -8, cursor:'nwse-resize' },
        n:  { left: '50%', top: -8, transform:'translateX(-50%)', cursor:'ns-resize' },
        ne: { right: -8, top: -8, cursor:'nesw-resize' },
        e:  { right: -8, top: '50%', transform:'translateY(-50%)', cursor:'ew-resize' },
        se: { right: -8, bottom: -8, cursor:'nwse-resize' },
        s:  { left: '50%', bottom: -8, transform:'translateX(-50%)', cursor:'ns-resize' },
        sw: { left: -8, bottom: -8, cursor:'nesw-resize' },
        w:  { left: -8, top: '50%', transform:'translateY(-50%)', cursor:'ew-resize' },
      };
      return (
        <span key={pos} className={common} style={styleMap[pos]} onMouseDown={(e)=>onDown(e, pos)} />
      );
    })
  );

  if (!open) return null;

  const modal = (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center isolate" role="dialog" aria-modal="true">
      <div className="absolute inset-0 z-0 bg-black/60" />
      <div
        className="relative z-10 bg-white w-[800px] max-w-[90%] rounded-xl shadow-2xl ring-1 ring-black/5 p-0 opacity-100"
        style={{
          filter: 'none',
          WebkitFilter: 'none',
          backdropFilter: 'none',
          mixBlendMode: 'normal',
          opacity: 1,
          transform: 'translateZ(0)',
          isolation: 'isolate'
        }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="text-[18px] font-semibold">커버 자르기</div>
          <button type="button" className="w-10 h-10 text-[28px] leading-none" onClick={onClose}>×</button>
        </div>
        <div className="p-5 space-y-6">
          <div>
            <div className="text-sm mb-2">1. 정사각형 커버를 지정해주세요.</div>
            <div className="relative bg-white rounded-none border border-[#E5E7EB] overflow-hidden" style={{ width: stage.w, height: stage.h }}>
              {img && (
                <img src={img.src} alt="source1" draggable={false} className="select-none" style={{ position:'absolute', left: offset.x, top: offset.y, width: imgW, height: imgH }} />
              )}
              <div className={`absolute border-2 ${activeCrop==='square' ? 'border-[#00C2A8]' : 'border-white'} shadow-[0_0_0_20000px_rgba(0,0,0,0.35)] box-border`} style={{ left: boxSq.x, top: boxSq.y, width: boxSq.w, height: boxSq.h, cursor:'move' }} onMouseDown={handleDownSq}>
                {renderHandles(onDownSq)}
              </div>
            </div>
          </div>
          <div className="h-px bg-gray-200" />
          <div>
            <div className="text-sm mb-2">2. 직사각형 커버를 지정해주세요.</div>
            <div className="relative bg-white rounded-none border border-[#E5E7EB] overflow-hidden" style={{ width: stage.w, height: stage.h }}>
              {img && (
                <img src={img.src} alt="source2" draggable={false} className="select-none" style={{ position:'absolute', left: offset.x, top: offset.y, width: imgW, height: imgH }} />
              )}
              <div className={`absolute border-2 ${activeCrop==='rect' ? 'border-[#00C2A8]' : 'border-white'} shadow-[0_0_0_20000px_rgba(0,0,0,0.35)] box-border`} style={{ left: boxRect.x, top: boxRect.y, width: boxRect.w, height: boxRect.h, cursor:'move' }} onMouseDown={handleDownRect}>
                {renderHandles(onDownRect)}
              </div>
            </div>
          </div>
          <div className="h-px bg-gray-200" />
        </div>
        <div className="px-5 py-3 border-t flex justify-end gap-2">
          <button type="button" className="h-10 px-4 border rounded" onClick={onClose}>취소</button>
          <button type="button" className="h-10 px-5 bg-black text-white rounded" onClick={doCrop}>완료</button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default CoverCropper; 