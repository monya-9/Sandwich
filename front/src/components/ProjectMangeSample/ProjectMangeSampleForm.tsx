import React, { useEffect, useMemo, useRef, useState } from "react";
import Header from "../Main/Header";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import Quill from "quill";
import { RiText } from "react-icons/ri";
import { normalizeVideoUrl } from "./VideoUploadSection";
import ReorderModal from "./ReorderModal";
import { FaImage, FaTrash } from "react-icons/fa";
import { IoMdVideocam } from "react-icons/io";
import { FiMaximize2, FiImage } from "react-icons/fi";
import { createProject, ProjectRequest } from "../../api/projectApi";
import { useNavigate } from "react-router-dom";
import ProjectDetailsModal from "./ProjectDetailsModal";
import ProjectPreviewModal from "./ProjectPreviewModal";
import SettingsPanel from "./SettingsPanel";
import RightPanelActions from "./RightPanelActions";

// Quill size whitelist to show pt values like 16pt
const SizeAttributor = Quill.import("attributors/style/size");
// @ts-ignore
SizeAttributor.whitelist = ["10pt", "12pt", "14pt", "16pt", "18pt", "24pt", "32pt", "36pt", "48pt", "72pt"];
// @ts-ignore
Quill.register(SizeAttributor, true);

// 토큰 유효성 검사 유틸
function getAccessToken(): string | null {
	try { return localStorage.getItem('accessToken'); } catch { return null; }
}
function isJwtExpired(token: string): boolean {
	try {
		const parts = token.split('.')
		if (parts.length < 2) return true;
		const payload = JSON.parse(atob(parts[1]));
		if (typeof payload.exp !== 'number') return false;
		return payload.exp * 1000 < Date.now();
	} catch { return true; }
}

function extractSummaryFromHtml(html: string, maxLen = 200): string {
	try {
		const div = document.createElement('div');
		div.innerHTML = html;
		const text = div.textContent || div.innerText || '';
		const trimmed = text.replace(/\s+/g, ' ').trim();
		return trimmed.length > maxLen ? trimmed.slice(0, maxLen) + '…' : trimmed;
	} catch {
		return '';
	}
}

export default function ProjectMangeSampleForm() {
	type ModalBlock = { id: string; type: 'text' | 'image' | 'video'; html: string; text?: string };

	const mainQuillRef = useRef<ReactQuill | null>(null);
	const [previewHtml, setPreviewHtml] = useState<string>("");
	const [showEmptyToast, setShowEmptyToast] = useState(false);
	const toastTimerRef = useRef<number | null>(null);
	const [isReorderOpen, setIsReorderOpen] = useState(false);
	const [backgroundColor, setBackgroundColor] = useState<string>("#FFFFFF");
	const [contentGapPx, setContentGapPx] = useState<number>(10);
	const modulesCacheRef = useRef<Record<string, any>>({});
	const [reorderBlocks, setReorderBlocks] = useState<ModalBlock[]>([]);

	// Hover overlay states for media controls
	const editorContainerRef = useRef<HTMLDivElement | null>(null);
	const [hoverEl, setHoverEl] = useState<HTMLElement | null>(null);
	const [hoverType, setHoverType] = useState<'image' | 'video' | null>(null);
	const overlayRef = useRef<HTMLDivElement | null>(null);
	const overlayPosRef = useRef<{ top: number; left: number }>({ top: 0, left: 0 });
	const rafIdRef = useRef<number | null>(null);
	const isTypingRef = useRef<boolean>(false);
	const hoverElRef = useRef<HTMLElement | null>(null);
	const [isHoveringOverlay, setIsHoveringOverlay] = useState<boolean>(false);
	const [hoveredButton, setHoveredButton] = useState<string | null>(null);
	// Re-render tick for tooltip label immediate update
	const [overlayTick, setOverlayTick] = useState<number>(0);
	// 사용자 지정 미디어 패딩(px)
	const [mediaPaddingPx, setMediaPaddingPx] = useState<number>(40);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	// NEW: 10MB 초과 토스트
	const [showOversizeToast, setShowOversizeToast] = useState(false);
	const notifyOversize = () => {
		setShowOversizeToast(true);
		window.setTimeout(() => setShowOversizeToast(false), 2000);
	};
				// NEW: 1100px 제한 토스트
				const [showWidthToast, setShowWidthToast] = useState(false);
				const notifyNeed1100 = () => {
					setShowWidthToast(true);
					window.setTimeout(() => setShowWidthToast(false), 2000);
				};

				// Lightweight content presence tracking to avoid heavy HTML parsing on every keystroke
				const [hasText, setHasText] = useState<boolean>(false);
				const [mediaCount, setMediaCount] = useState<number>(0);
				const [detailLibraryImages, setDetailLibraryImages] = useState<string[]>([]);
				const [previewCoverUrl, setPreviewCoverUrl] = useState<string | null>(null);

				const recalcCounts = () => {
					const quill = mainQuillRef.current?.getEditor();
					if (!quill) return;
					const nextHasText = (quill.getLength() || 0) > 1;
					if (nextHasText !== hasText) setHasText(nextHasText);
				};

				const collectImageUrls = (): string[] => {
					try {
						const quill = mainQuillRef.current?.getEditor();
						if (!quill) return [];
						return Array.from((quill.root as HTMLElement).querySelectorAll('img'))
							.map(img => img.getAttribute('src') || '')
							.filter(Boolean) as string[];
					} catch { return []; }
				};

				const getEditorHtml = (): string => {
					try {
						const quill = mainQuillRef.current?.getEditor();
						if (!quill) return "";
						return (quill.root as HTMLElement).innerHTML;
					} catch { return ""; }
				};

				const textChangeTimerRef = useRef<number | null>(null);
				useEffect(() => {
					const quill = mainQuillRef.current?.getEditor();
					if (!quill) return;
					const onTextChange = () => {
						isTypingRef.current = true;
						if (overlayRef.current) overlayRef.current.style.display = 'none';
						if (textChangeTimerRef.current) window.clearTimeout(textChangeTimerRef.current);
						textChangeTimerRef.current = window.setTimeout(() => {
							// update only hasText cheaply
							try {
								const len = quill.getLength();
								const nextHasText = (len || 0) > 1;
								if (nextHasText !== hasText) setHasText(nextHasText);
								// when text is cleared, move first media to top if not already
								if (!nextHasText) {
									try {
										const root = quill.root as HTMLElement;
										const firstMedia = root.querySelector('img,iframe') as HTMLElement | null;
										if (firstMedia && firstMedia.previousElementSibling) {
											// move media node to start
											root.insertBefore(firstMedia, root.firstChild);
										}
									} catch {}
								}
							} catch {}
							isTypingRef.current = false;
							if (overlayRef.current) overlayRef.current.style.display = '';
						}, 200);
					};
					quill.on('text-change', onTextChange);
					recalcCounts();
					return () => {
						try { quill.off('text-change', onTextChange); } catch {}
						if (textChangeTimerRef.current) window.clearTimeout(textChangeTimerRef.current);
					};
				}, []);

				// Disable spellcheck to reduce typing overhead on large documents
				useEffect(() => {
					const quill = mainQuillRef.current?.getEditor();
					if (!quill) return;
					try { quill.root.setAttribute('spellcheck', 'false'); } catch {}
				}, []);

				const showOverlayForMedia = (media: HTMLElement) => {
					try {
						const rect = media.getBoundingClientRect();
						if (!isFinite(rect.top) || rect.width <= 1 || rect.height <= 1) return;
						const top = Math.max(8, rect.top - 12);
						const left = rect.left + rect.width / 2;
						if (overlayRef.current) {
							overlayRef.current.style.top = `${top}px`;
							overlayRef.current.style.left = `${left}px`;
							overlayRef.current.style.display = '';
						}
						setHoverEl(media);
						setHoverType(media.tagName.toLowerCase() === 'img' ? 'image' : 'video');
						hoverElRef.current = media;
					} catch {}
				};
				const hideOverlayNow = () => {
					try {
						if (overlayRef.current) overlayRef.current.style.display = 'none';
						setHoverEl(null);
						setHoverType(null);
						hoverElRef.current = null;
					} catch {}
				};

				const followRafRef = useRef<number | null>(null);
				const positionOverlayTo = (media: HTMLElement): boolean => {
					try {
						const rect = media.getBoundingClientRect();
						if (!isFinite(rect.top) || rect.width <= 1 || rect.height <= 1) return false;
						const top = Math.max(8, rect.top - 12);
						const left = rect.left + rect.width / 2;
						if (overlayRef.current) {
							overlayRef.current.style.top = `${top}px`;
							overlayRef.current.style.left = `${left}px`;
							overlayRef.current.style.display = '';
						}
						return true;
					} catch { return false; }
				};
				const startOverlayFollow = (media: HTMLElement, type: 'image' | 'video') => {
					setHoverEl(media);
					setHoverType(type);
					hoverElRef.current = media;
					const tick = () => {
						if (!hoverElRef.current) { return; }
						positionOverlayTo(hoverElRef.current);
						followRafRef.current = window.requestAnimationFrame(tick);
					};
					if (followRafRef.current !== null) { window.cancelAnimationFrame(followRafRef.current); followRafRef.current = null; }
					tick();
				};
				const stopOverlayFollow = () => {
					if (followRafRef.current !== null) { window.cancelAnimationFrame(followRafRef.current); followRafRef.current = null; }
					if (overlayRef.current) overlayRef.current.style.display = 'none';
					setHoverEl(null);
					setHoverType(null);
					hoverElRef.current = null;
				};

				// Observe media changes to keep mediaCount updated and lazily enhance media elements
				const mediaObserverRef = useRef<MutationObserver | null>(null);
				useEffect(() => {
					const quill = mainQuillRef.current?.getEditor();
					if (!quill) return;
					const root = quill.root as HTMLElement;
					const enhance = (scope: ParentNode) => {
						try {
							scope.querySelectorAll('img').forEach(img => {
								(img as HTMLImageElement).setAttribute('decoding', 'async');
								(img as HTMLImageElement).setAttribute('loading', 'lazy');
								img.addEventListener('pointerenter', () => startOverlayFollow(img as HTMLElement, 'image'), { passive: true });
								img.addEventListener('pointerleave', (ev) => {
									const rel = (ev as PointerEvent).relatedTarget as Node | null;
									if (overlayRef.current && rel && overlayRef.current.contains(rel)) return; // moving into overlay
									stopOverlayFollow();
								}, { passive: true });
							});
							scope.querySelectorAll('iframe').forEach(f => {
								(f as HTMLIFrameElement).setAttribute('loading', 'lazy');
								f.addEventListener('pointerenter', () => startOverlayFollow(f as HTMLElement, 'video'), { passive: true });
								f.addEventListener('pointerleave', (ev) => {
									const rel = (ev as PointerEvent).relatedTarget as Node | null;
									if (overlayRef.current && rel && overlayRef.current.contains(rel)) return;
									stopOverlayFollow();
								}, { passive: true });
							});
						} catch {}
					};
					enhance(root);
					const updateMediaCount = () => {
						try {
							const num = root.querySelectorAll('img,iframe').length;
							if (num !== mediaCount) setMediaCount(num);
						} catch {}
					};
					updateMediaCount();
					const ob = new MutationObserver((mutations) => {
						let affected = false;
						mutations.forEach(m => {
							if (m.type === 'childList') {
								m.addedNodes.forEach(n => { if (n instanceof HTMLElement) enhance(n); });
								if (m.addedNodes.length || m.removedNodes.length) affected = true;
							}
						});
						if (affected) updateMediaCount();
					});
					mediaObserverRef.current = ob;
					ob.observe(root, { childList: true, subtree: true });
					return () => { try { ob.disconnect(); } catch {}; mediaObserverRef.current = null; };
				}, [mediaCount]);

	const scrollToEmbedAtIndex = (insertIndex: number) => {
		const doScroll = (delayMs: number) => {
			setTimeout(() => {
				const quill = mainQuillRef.current?.getEditor() as any;
				if (!quill) return;
				try {
					const bounds = quill.getBounds(insertIndex);
					const editorTopAbs = (quill.root as HTMLElement).getBoundingClientRect().top + window.scrollY;
					const margin = 24;
					const targetTop = Math.max(0, editorTopAbs + bounds.top - margin);
					window.scrollTo({ top: targetTop, behavior: 'smooth' });
				} catch {
					// fallback: scroll last media element
					const editor = (mainQuillRef.current?.getEditor()?.root as HTMLElement) || null;
					if (!editor) return;
					const nodes = editor.querySelectorAll('img,iframe');
					if (nodes.length > 0) {
						const el = nodes[nodes.length - 1] as HTMLElement;
						const rect = el.getBoundingClientRect();
						const margin = 24;
						const targetTop = Math.max(0, window.scrollY + rect.top - margin);
						window.scrollTo({ top: targetTop, behavior: 'smooth' });
					}
				}
			}, delayMs);
		};
		// immediate attempt and a second pass after render/layout settles
		doScroll(0);
		doScroll(250);
	};

	useEffect(() => { hoverElRef.current = hoverEl; }, [hoverEl]);

	// 호버 대상이 바뀔 때 현재 요소의 패딩값을 동기화
	useEffect(() => {
		const el = hoverEl as HTMLElement | null;
		if (!el) return;
		try {
			const cs = window.getComputedStyle(el);
			const pl = parseInt((el.style.paddingLeft || cs.paddingLeft || '0').replace('px','')) || 0;
			const pr = parseInt((el.style.paddingRight || cs.paddingRight || '0').replace('px','')) || 0;
			const pb = parseInt((el.style.paddingBottom || cs.paddingBottom || '0').replace('px','')) || 0;
			const next = Math.max(pl, pr, pb);
			setMediaPaddingPx(next > 0 ? next : 40);
		} catch {}
	}, [hoverEl]);

	// 1100px 이상에서만 패딩 조절 허용
	const isPaddingEligible = (el: HTMLElement | null): boolean => {
		if (!el) return false;
		const tag = el.tagName.toLowerCase();
		if (tag === 'img') {
			const img = el as HTMLImageElement;
			const w = img.naturalWidth || img.getBoundingClientRect().width || img.width;
			return (w || 0) >= 1100;
		}
		if (tag === 'iframe') {
			const w = el.getBoundingClientRect().width || (el as HTMLElement).clientWidth;
			return (w || 0) >= 1100;
		}
		return false;
	};

	// 패딩 값을 적용하는 유틸 (콘텐츠 크기 변경 최소화: 좌우/하단 패딩만)
	const applyPadding = (value: number) => {
		if (!hoverEl) return;
		if (!isPaddingEligible(hoverEl)) { notifyNeed1100(); return; }
		hoverEl.classList.add('pm-embed-padded');
		(hoverEl as HTMLElement).style.paddingLeft = `${value}px`;
		(hoverEl as HTMLElement).style.paddingRight = `${value}px`;
		(hoverEl as HTMLElement).style.paddingBottom = `${value}px`;
		(hoverEl as HTMLElement).style.marginTop = '0px';
		setOverlayTick(t => t + 1);
	};

	const togglePadding = () => {
		if (!hoverEl) return;
		// 1100px 이상에서만 허용
		if (!isPaddingEligible(hoverEl)) { notifyNeed1100(); return; }
		const el = hoverEl as HTMLElement;
		if (el.classList.contains('pm-embed-padded')) {
			el.classList.remove('pm-embed-padded');
			el.style.paddingLeft = '';
			el.style.paddingRight = '';
			el.style.paddingBottom = '';
		} else {
			el.classList.add('pm-embed-padded');
			el.style.paddingLeft = `${mediaPaddingPx}px`;
			el.style.paddingRight = `${mediaPaddingPx}px`;
			el.style.paddingBottom = `${mediaPaddingPx}px`;
			el.style.marginTop = '0px';
		}
		// force re-render so tooltip text updates immediately
		setOverlayTick(t => t + 1);
	};
	const removeContent = () => {
		if (!hoverEl) return;
		const target = hoverEl as HTMLElement;
		// Quill는 root 내부의 노드를 지우면 반영됨
		const parent = target.parentElement;
		if (!parent) return;
		parent.removeChild(target);
		setHoverEl(null);
		setOverlayTick(t => t + 1);
		recalcCounts();
	};
	const MAX_INSERT_WIDTH = 1600; // clamp long edge in pixels
	const TARGET_MIME = 'image/webp';
	const TARGET_QUALITY = 0.85;

	const downscaleImage = (file: File, maxWidth = MAX_INSERT_WIDTH): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				try {
					const img = new Image();
					img.onload = () => {
						try {
							const w = img.naturalWidth || img.width;
							const h = img.naturalHeight || img.height;
							const scale = w > maxWidth ? maxWidth / w : 1;
							const canvas = document.createElement('canvas');
							canvas.width = Math.round(w * scale);
							canvas.height = Math.round(h * scale);
							const ctx = canvas.getContext('2d', { alpha: true });
							if (!ctx) { resolve(reader.result as string); return; }
							ctx.imageSmoothingEnabled = true;
							ctx.imageSmoothingQuality = 'high';
							ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
							canvas.toBlob((blob) => {
								if (!blob) { resolve(reader.result as string); return; }
								const fr = new FileReader();
								fr.onload = () => resolve(fr.result as string);
								fr.onerror = () => resolve(reader.result as string);
								fr.readAsDataURL(blob);
							}, TARGET_MIME, TARGET_QUALITY);
						} catch { resolve(reader.result as string); }
					};
					img.onerror = () => resolve(reader.result as string);
					img.src = reader.result as string;
				} catch { resolve(reader.result as string); }
			};
			reader.onerror = () => reject(new Error('image read error'));
			reader.readAsDataURL(file);
		});
	};
	const changeImage = () => {
		if (!hoverEl || hoverType !== 'image') return;
		const img = hoverEl as HTMLImageElement;
		const fileInput = document.createElement('input');
		fileInput.type = 'file';
		fileInput.accept = 'image/jpeg,image/jpg,image/png,image/webp';
		fileInput.onchange = () => {
			const file = fileInput.files && fileInput.files[0];
			if (!file) return;
			const MAX_SIZE = 10 * 1024 * 1024; // 10MB
			const allowed = ['jpg','jpeg','png','webp'];
			const ext = (file.name.split('.').pop() || '').toLowerCase();
			if (file.size > MAX_SIZE || !allowed.includes(ext)) { notifyOversize(); return; }
			downscaleImage(file).then((dataUrl) => { img.src = dataUrl; img.classList.add('pm-embed-padded','pm-embed-full'); img.style.marginTop = '0px'; recalcCounts(); });
		};
		fileInput.click();
	};
	const changeVideoUrl = () => {
		if (!hoverEl || hoverType !== 'video') return;
		const iframe = hoverEl as HTMLIFrameElement;
		const url = window.prompt('새 동영상 URL (YouTube/Vimeo)');
		if (!url) return;
		const embedUrl = normalizeVideoUrl(url);
		if (!embedUrl) { window.alert('지원하지 않는 형식입니다.'); return; }
		iframe.src = embedUrl;
	};

	// new: external controls wiring
	const addImageFile = async (file: File) => {
		const MAX_SIZE = 10 * 1024 * 1024; // 10MB
		const allowed = ['jpg','jpeg','png','webp'];
		const ext = (file.name.split('.').pop() || '').toLowerCase();
		if (file.size > MAX_SIZE || !allowed.includes(ext)) { notifyOversize(); return; }
		const dataUrl = await downscaleImage(file);
		insertEmbedAsBlock('image', dataUrl);
	};
	const addVideoUrl = (rawUrl: string) => {
		try {
			let u = rawUrl.trim();
			if (!u) return;
			const embedUrl = normalizeVideoUrl(u);
			if (!embedUrl) { window.alert('지원하지 않는 동영상 URL 형식입니다. YouTube 또는 Vimeo 링크를 입력해주세요.'); return; }
			insertEmbedAsBlock('video', embedUrl);
		} catch {}
	};

	const insertEmbedAsBlock = (type: 'image' | 'video', value: string) => {
		const quill = mainQuillRef.current?.getEditor();
		if (!quill) return;
		const range = quill.getSelection(true);
		const insertIndex = range ? range.index : quill.getLength();
		// insert embed inline at current cursor
		quill.insertEmbed(insertIndex, type, value, 'user');
		quill.setSelection(insertIndex + 1, 0, 'user');
		scrollToEmbedAtIndex(insertIndex);
		recalcCounts();
		// apply default padded/full style and anchor lock after DOM updates
		setTimeout(() => {
			try {
				const root = quill.root as HTMLElement;
				// find the embed just inserted (last embed at or before index)
				const nodes = Array.from(root.querySelectorAll(type === 'image' ? 'img' : 'iframe')) as HTMLElement[];
				const el = nodes[nodes.length - 1];
				if (!el) return;
				el.classList.add('pm-embed-padded');
				if (type === 'video') { el.classList.add('pm-embed-full'); }
				// ensure center alignment
				(el as HTMLElement).style.display = 'block';
				(el as HTMLElement).style.marginLeft = 'auto';
				(el as HTMLElement).style.marginRight = 'auto';
				// lock top anchor by setting margin-top to 0 and using padding for vertical spacing
				el.style.marginTop = '0px';
			} catch {}
		}, 0);
	};

	const openImagePicker = () => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'image/jpeg,image/jpg,image/png,image/webp';
		input.onchange = () => {
			const file = input.files && input.files[0];
			if (file) { addImageFile(file); }
		};
		input.click();
	};
	const triggerImageAdd = () => { openImagePicker(); };
	const triggerVideoAdd = () => {
		const url = window.prompt('동영상 URL을 입력하세요 (YouTube, Vimeo 등)');
		if (url) { addVideoUrl(url); }
	};

	const buildModules = (toolbarSelector: string) => ({
		toolbar: {
			container: toolbarSelector,
			handlers: {
				image: openImagePicker,
				video: triggerVideoAdd
			}
		},
		clipboard: { matchVisual: false }
	});

	const getStableModules = () => {
		const cached = modulesCacheRef.current['main'];
		if (cached) return cached;
		const created = buildModules(`#pm-toolbar-main`);
		modulesCacheRef.current['main'] = created;
		return created;
	};

	const quillFormats = useMemo(() => [
		'header', 'bold', 'underline', 'color', 'align', 'link', 'size', 'image', 'video'
	], []);

	const hasContent = hasText || mediaCount > 0;

	// image urls are collected lazily when opening modals

	const extractBlocksFromEditor = (): ModalBlock[] => {
		const editor = mainQuillRef.current?.getEditor();
		if (!editor) return [];
		const root = editor.root as HTMLElement;
		const children = Array.from(root.children) as HTMLElement[];
		const result: ModalBlock[] = [];
		children.forEach((el, idx) => {
			const tag = el.tagName.toLowerCase();
			const hasIframe = tag === 'iframe' || !!el.querySelector('iframe');
			const hasImage = tag === 'img' || !!el.querySelector('img');
			const plain = el.innerText.replace(/\s+/g, ' ').trim();
			if (hasIframe) {
				result.push({ id: Math.random().toString(36).slice(2), type: 'video', html: el.outerHTML });
			} else if (hasImage) {
				result.push({ id: Math.random().toString(36).slice(2), type: 'image', html: el.outerHTML });
			} else if (plain.length > 0) {
				result.push({ id: Math.random().toString(36).slice(2), type: 'text', html: el.outerHTML, text: plain });
			}
		});
		return result;
	};

	const openReorder = () => {
		const blocks = extractBlocksFromEditor();
		if (blocks.length === 0) {
			setShowEmptyToast(true);
			if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
			toastTimerRef.current = window.setTimeout(() => setShowEmptyToast(false), 2000);
			return;
		}
		setReorderBlocks(blocks);
		setIsReorderOpen(true);
	};

	const applyNewOrder = (orderedIds: string[]) => {
		const quill = mainQuillRef.current?.getEditor();
		if (!quill) return;
		const idToBlock = Object.fromEntries(reorderBlocks.map(b => [b.id, b]));
		const newHtml = orderedIds.map(id => idToBlock[id]).filter(Boolean).map(b => (b as ModalBlock).html).join('');
		quill.clipboard.dangerouslyPasteHTML(newHtml, 'user');
		setIsReorderOpen(false);
		recalcCounts();
	};

	const modal = (
		<ReorderModal open={isReorderOpen} blocks={reorderBlocks} onConfirm={applyNewOrder} onClose={() => setIsReorderOpen(false)} />
	);

	const navigate = useNavigate();
	const [isDetailsOpen, setIsDetailsOpen] = useState(false);
	const [isPreviewOpen, setIsPreviewOpen] = useState(false);

	const handleSubmit = async () => {
		if (!hasContent) return;
		const token = getAccessToken();
		if (!token) {
			navigate('/login');
			return;
		}
		if (isJwtExpired(token)) {
			window.alert('로그인 세션이 만료되었습니다. 다시 로그인해주세요.');
			navigate('/login');
			return;
		}
		setDetailLibraryImages(collectImageUrls());
		setIsDetailsOpen(true);
	};

	const openPreview = () => {
		const imgs = collectImageUrls();
		setPreviewCoverUrl(imgs[0] || null);
		setPreviewHtml(getEditorHtml());
		setIsPreviewOpen(true);
	};

	return (
		<div className="min-h-screen font-gmarket relative">
			<style>{`
				.pm-sample-editor { width: 100%; }
				.pm-sample-editor .ql-toolbar { border-radius: 10px 10px 0 0; }
				/* Remove fixed height; let page scroll */
				.pm-sample-editor .ql-container { height: auto; min-height: 800px; border-radius: 0 0 10px 10px; margin-top: 0; border: none; background: transparent; width: 100%; box-sizing: border-box; }
				.pm-sample-editor .ql-editor { min-height: 800px; height: auto; font-size: 18px; padding: 0; }
				/* editor background color is applied here dynamically via inline style */
				.pm-toolbar-row { width: 100%; display: flex; align-items: center; gap: 8px; padding: 0; margin-bottom: 0; box-sizing: border-box; background: #FFFFFF; border-radius: 10px 10px 0 0; }
				.pm-toolbar-left.ql-toolbar { border: none; border-bottom: none; border-radius: 10px 10px 0 0; padding: 6px 10px; min-height: 60px; margin-bottom: 0; display: flex; flex-wrap: nowrap; align-items: center; background: #FFFFFF; }
				.pm-toolbar-left .ql-formats { display: inline-flex; align-items: center; gap: 8px; margin-right: 8px; }
				.pm-toolbar-left .ql-formats button, .pm-toolbar-left .ql-formats .ql-picker { height: 50px; }
				.pm-toolbar-left .ql-picker { height: 50px; }
				.pm-toolbar-left .ql-formats button svg { width: 22px; height: 22px; }
				.pm-toolbar-left .ql-picker-label svg { width: 20px; height: 20px; }
				.pm-toolbar-left .ql-picker-label { display: inline-flex; align-items: center; height: 50px; padding: 0 10px; font-size: 16px; line-height: 50px; }
				.pm-toolbar-left .ql-picker-options { font-size: 14px; }
				/* Center media by default */
				.pm-sample-editor .ql-editor img, .pm-sample-editor .ql-editor iframe { display: block; margin-left: auto; margin-right: auto; }
				/* Media should by default not exceed editor width */
				.pm-sample-editor .ql-editor img { max-width: 100%; height: auto; content-visibility: auto; contain: content; }
				.pm-sample-editor .ql-editor iframe { width: 100% !important; height: auto !important; aspect-ratio: 16 / 9; }
				/* Full width when eligible */
				.pm-sample-editor .ql-editor img.pm-embed-full { }
				.pm-sample-editor .ql-editor iframe.pm-embed-full { width: 100% !important; height: auto !important; aspect-ratio: 16 / 9; }
				/* Padded state for media - keep top anchored; only sides and bottom expand */
				.pm-sample-editor .ql-editor img.pm-embed-padded, .pm-sample-editor .ql-editor iframe.pm-embed-padded { padding: 0 40px 40px 40px; background: transparent; border-radius: 0; box-sizing: border-box; }
				/* Editor frame */
				.pm-editor-frame { width: 1200px; border: none; border-radius: 10px; overflow: visible; background: transparent; box-sizing: border-box; }
				/* Overlay toolbar */
				.pm-embed-toolbar { width: 220px; background: rgba(0,0,0,0.72); color: white; padding: 8px; border-radius: 8px; display: flex; gap: 8px; align-items: center; }
				.pm-embed-toolbar button { display: inline-flex; gap: 6px; align-items: center; background: transparent; color: white; border: 1px solid rgba(255,255,255,0.3); padding: 6px 8px; border-radius: 6px; font-size: 12px; }
				.pm-embed-toolbar button:hover { background: rgba(255,255,255,0.12); }
			`}</style>
			<Header />
			{/* 10MB 초과 토스트 */}
			{showOversizeToast && (
				<div className="fixed top-4 left-1/2 -translate-x-1/2 z-[10000]" onClick={() => setShowOversizeToast(false)}>
					<div className="bg-[#111] text-white rounded-[10px] px-4 py-2 shadow-lg flex items-center gap-3">
						<span className="w-6 h-6 rounded-full bg-[#F04438] flex items-center justify-center text-[10px] font-bold">!</span>
						<span className="text-[14px]">10MB가 넘는 이미지가 있습니다</span>
					</div>
				</div>
			)}
			{/* 1100px 제한 토스트 */}
			{showWidthToast && (
				<div className="fixed top-4 left-1/2 -translate-x-1/2 z-[10000]" onClick={() => setShowWidthToast(false)}>
					<div className="bg-[#111] text-white rounded-[10px] px-4 py-2 shadow-lg flex items-center gap-3">
						<span className="w-6 h-6 rounded-full bg-[#111827] flex items-center justify-center text-[10px] font-bold">!</span>
						<span className="text-[14px]">가로 폭 1100px 이상의 콘텐츠만 사용 가능한 기능입니다</span>
					</div>
				</div>
			)}
			{showEmptyToast && (
				<div className="fixed top-4 left-1/2 -translate-x-1/2 z-[10000]" onClick={() => setShowEmptyToast(false)}>
					<div className="bg-[#111] text-white rounded-[10px] px-4 py-2 shadow-lg flex items-center gap-3">
						<span className="w-9 h-9 rounded-full bg-[#F04438] flex items-center justify-center text-[12px] font-bold">!</span>
						<span className="text-[14px]">아직 생성된 컨텐츠가 없습니다.</span>
					</div>
				</div>
			)}
			<main className="w-full max-w-[1800px] mx-auto">
				<div className="grid grid-cols-[1fr_1200px_1fr] items-start gap-[28px] px-[30px] pt-[40px]">
					<section className="w-[1200px] min-h-screen rounded-[10px] flex flex-col items-center relative pt-0 pb-40 col-start-2" style={{ backgroundColor }}>
						<div className="pointer-events-none absolute inset-0 rounded-[10px] z-20" style={{ boxShadow: 'inset 0 0 0 1px #ADADAD' }} />
						<div className="w-full flex flex-col items-center" style={{ gap: `${contentGapPx}px` }}>
							<div className="pm-editor-frame">
						<div className="pm-toolbar-row">
							<div id={`pm-toolbar-main`} className="ql-toolbar ql-snow pm-toolbar-left">
								<span className="ql-formats">
									<button className="ql-bold" />
								</span>
								<span className="ql-formats">
									<select className="ql-color" />
									<button className="ql-underline" />
								</span>
								<span className="ql-formats">
									<button className="ql-align" value="" />
									<button className="ql-align" value="center" />
									<button className="ql-align" value="right" />
								</span>
								<span className="ql-formats">
									<button className="ql-link" />
								</span>
								<span className="ql-formats">
									<select className="ql-size" defaultValue="18pt">
										<option value="10pt">10pt</option>
										<option value="12pt">12pt</option>
										<option value="14pt">14pt</option>
										<option value="16pt">16pt</option>
										<option value="18pt">18pt</option>
										<option value="24pt">24pt</option>
										<option value="32pt">32pt</option>
										<option value="36pt">36pt</option>
										<option value="48pt">48pt</option>
										<option value="72pt">72pt</option>
									</select>
									<button className="ql-image" />
									<button className="ql-video" />
								</span>
							</div>
						</div>

								<div ref={editorContainerRef}>
																				<ReactQuill
												ref={mainQuillRef}
												className="pm-sample-editor"
												theme="snow"
												defaultValue=""
												modules={getStableModules()}
												formats={quillFormats}
											/>
									{/* Apply editor inner content spacing; toolbar fixed white; editor follows backgroundColor */}
									<style>{`
										.pm-sample-editor .ql-container { background: transparent; }
										.pm-sample-editor .ql-editor { background: ${backgroundColor}; --pm-gap: ${contentGapPx}px; }
										/* universal block gap: allow per-block override via --pm-top-gap */
										.pm-sample-editor .ql-editor > * + * { margin-top: var(--pm-top-gap, var(--pm-gap)) !important; }
										/* protect gap with same variable to avoid mismatch */
										.pm-sample-editor .ql-editor > * + *::before { content: ""; display: block; height: var(--pm-top-gap, var(--pm-gap)); margin-top: calc(-1 * var(--pm-top-gap, var(--pm-gap))); }
										/* direct embeds without wrappers */
										.pm-sample-editor .ql-editor > img,
										.pm-sample-editor .ql-editor > iframe { display: block; }
										/* lists: halve the gap between items */
										.pm-sample-editor .ql-editor li + li { margin-top: calc(var(--pm-gap) / 2) !important; }
										/* when embeds are consecutive inside the same block */
										.pm-sample-editor .ql-editor img + img,
										.pm-sample-editor .ql-editor img + iframe,
										.pm-sample-editor .ql-editor iframe + img,
										.pm-sample-editor .ql-editor iframe + iframe { margin-top: var(--pm-gap) !important; display: block; }
									`}</style>
									{hoverEl && hoverType && (
										<div
											ref={overlayRef}
											className="bg-white border border-gray-300 rounded shadow-lg flex gap-2 px-4 py-2 relative"
											style={{ position: 'fixed', transform: 'translateX(-50%) translateZ(0)', zIndex: 10000, pointerEvents: 'auto', willChange: 'top,left,transform' }}
											onMouseEnter={() => { setIsHoveringOverlay(true); }}
											onMouseLeave={(e) => { setIsHoveringOverlay(false); setHoveredButton(null); const rel = (e as any).relatedTarget as Node | null; if (!(hoverElRef.current && rel && (rel === hoverElRef.current || (hoverElRef.current as any).contains?.(rel)))) { stopOverlayFollow(); } }}
										>
											<div className="relative">
												<button
													className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-sm"
													onMouseEnter={() => setHoveredButton('padding')}
													onMouseLeave={() => setHoveredButton(null)}
													onClick={togglePadding}
													type="button"
												>
													<FiMaximize2 className="w-4 h-4" />
												</button>
												{hoveredButton === 'padding' && (
													<div className="absolute left-1/2 -translate-x-1/2 -top-10 flex flex-col items-center z-30 pointer-events-none">
														<div className="bg-black text-white text-xs px-3 py-1.5 rounded-md shadow-lg font-medium" style={{minWidth: 120, textAlign: 'center', letterSpacing: "-0.5px"}}>
															{hoverEl && hoverEl.classList.contains('pm-embed-padded') ? '패딩 제거' : '패딩 추가'}
														</div>
														<div className="w-2.5 h-2.5 bg-black rotate-45 -mt-1"></div>
													</div>
												)}
											</div>
											<div className="relative">
												<button
													className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-sm"
													onMouseEnter={() => setHoveredButton(hoverType === 'image' ? 'image' : 'url')}
													onMouseLeave={() => setHoveredButton(null)}
													onClick={hoverType === 'image' ? changeImage : changeVideoUrl}
													type="button"
												>
													{hoverType === 'image' ? <FiImage className="w-4 h-4" /> : <IoMdVideocam className="w-4 h-4" />}
												</button>
												{hoveredButton === 'image' && (
													<div className="absolute left-1/2 -translate-x-1/2 -top-10 flex flex-col items-center z-30 pointer-events-none">
														<div className="bg-black text-white text-xs px-3 py-1.5 rounded-md shadow-lg font-medium" style={{minWidth: 120, textAlign: 'center', letterSpacing: "-0.5px"}}>
															이미지 변경
														</div>
														<div className="w-2.5 h-2.5 bg-black rotate-45 -mt-1"></div>
													</div>
												)}
												{hoveredButton === 'url' && (
													<div className="absolute left-1/2 -translate-x-1/2 -top-10 flex flex-col items-center z-30 pointer-events-none">
														<div className="bg-black text-white text-xs px-3 py-1.5 rounded-md shadow-lg font-medium" style={{minWidth: 120, textAlign: 'center', letterSpacing: "-0.5px"}}>
															URL 변경
														</div>
														<div className="w-2.5 h-2.5 bg-black rotate-45 -mt-1"></div>
													</div>
												)}
											</div>
											<div className="relative">
												<button
													className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-sm"
													onMouseEnter={() => setHoveredButton('delete')}
													onMouseLeave={() => setHoveredButton(null)}
													onClick={removeContent}
													type="button"
												>
													<span className="w-4 h-4 inline-flex items-center justify-center"><FaTrash className="w-4 h-4" /></span>
												</button>
												{hoveredButton === 'delete' && (
													<div className="absolute left-1/2 -translate-x-1/2 -top-10 flex flex-col items-center z-30 pointer-events-none">
														<div className="bg-black text-white text-xs px-3 py-1.5 rounded-md shadow-lg font-medium" style={{minWidth: 120, textAlign: 'center', letterSpacing: "-0.5px"}}>
															콘텐츠 삭제
														</div>
														<div className="w-2.5 h-2.5 bg-black rotate-45 -mt-1"></div>
													</div>
												)}
											</div>

											{/* 1100px 이상 미디어에서만 패딩 조절 노출 */}
											{isPaddingEligible(hoverEl) && (
												<div className="flex items-center gap-2 ml-2">
													<span className="text-xs text-gray-600">패딩</span>
													<input
														type="range"
														min={0}
														max={200}
														step={2}
														value={mediaPaddingPx}
														onChange={(e) => { const v = Number(e.target.value); setMediaPaddingPx(v); applyPadding(v); }}
														className="w-28"
													/>
													<input
														type="number"
														min={0}
														max={400}
														step={1}
														value={mediaPaddingPx}
														onChange={(e) => { const v = Math.max(0, Math.min(400, Number(e.target.value))); setMediaPaddingPx(v); applyPadding(v); }}
														className="w-14 border border-gray-300 rounded px-1 py-0.5 text-xs"
													/>
												</div>
											)}
										</div>
									)}
																</div>
							</div>
							</div>
						</section>

					<aside className="w-[357px] flex flex-col gap-[16px] mt-[0px] sticky top-[24px] self-start col-start-3">
						<RightPanelActions onImageAdd={triggerImageAdd} onVideoAdd={triggerVideoAdd} onReorder={openReorder} />
						<SettingsPanel backgroundColor={backgroundColor} onBackgroundColorChange={setBackgroundColor} contentGapPx={contentGapPx} onContentGapChange={setContentGapPx} />
						<div className="flex flex-col gap-[12px]">
							<button
								className={`rounded-[30px] w-[357px] h-[56px] text-white text-[18px] transition-colors duration-200 ${hasContent ? 'bg-[#10B9B5] hover:bg-[#0ea7a3]' : 'bg-[#9CA3AF]'}`}
								type="button"
								onClick={openPreview}
							>
								화면 미리보기
							</button>
							<button
								className={`${hasContent ? 'bg-[#D1D5DB] hover:bg-gray-300' : 'bg-[#E5E7EB] cursor-not-allowed'} rounded-[30px] w-[357px] h-[82px] text-black text-[24px] transition-colors duration-200`}
								type="button"
								onClick={handleSubmit}
								disabled={!hasContent}
							>
								다음
							</button>
						</div>
					</aside>
				</div>
				{modal}
				<ProjectDetailsModal open={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} onCreated={() => setIsDetailsOpen(false)} libraryImages={detailLibraryImages} />
				<ProjectPreviewModal open={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} projectName="아가리학" ownerName="L" category="UI/UX" coverUrl={previewCoverUrl} backgroundColor={backgroundColor} contentGapPx={contentGapPx}>
					{/* 미리보기 본문: 편집기 HTML을 그대로 렌더 */}
					<div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: previewHtml }} />
				</ProjectPreviewModal>
			</main>
		</div>
	);
}

// Reorder list UI moved to ReorderModal 