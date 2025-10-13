import React, { useEffect, useState } from "react";
import { FaFolderMinus } from "react-icons/fa6";
import LoginPrompt from "../LoginPrompt";
import { useNavigate } from "react-router-dom";
import CollectionPickerModal from "../CollectionPickerModal";
import { listMyCollectionFolders, getCollectionFolder } from "../../../api/collections";

export default function CollectionAction({ projectId }: { projectId?: number } = {}) {
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [openPicker, setOpenPicker] = useState(false);
  const [hasCollected, setHasCollected] = useState(false);
  const [initialSelected, setInitialSelected] = useState<number[]>([]);
  const navigate = useNavigate();

  const broadcast = (value: boolean) => {
    try {
      window.dispatchEvent(new CustomEvent("collection:membership", { detail: { projectId, hasCollected: value } }));
    } catch {}
  };

  useEffect(() => {
    const loadMembership = async () => {
      try {
        const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
        if (!token || !projectId) return;
        const folders = await listMyCollectionFolders();
        const ids = folders.map(f => f.id);
        const results = await Promise.allSettled(ids.map(id => getCollectionFolder(id) as any));
        const selected: number[] = [];
        results.forEach((r, idx) => {
          if (r.status === "fulfilled") {
            const detail: any = r.value;
            const projects: any[] = Array.isArray(detail?.projects) ? detail.projects : [];
            if (projects.some(p => p?.id === projectId)) selected.push(ids[idx]);
          }
        });
        setInitialSelected(selected);
        setHasCollected(selected.length > 0);
        broadcast(selected.length > 0);
      } catch {}
    };
    loadMembership();
  }, [projectId]);

  const openPickerWithAuth = () => {
    const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
    if (!token) {
      setShowLoginPrompt(true);
      return false;
    }
    setOpenPicker(true);
    return true;
  };

  const handleClick = () => {
    openPickerWithAuth();
  };

  // 외부에서 모달 열기 이벤트 처리
  useEffect(() => {
    const onOpen = () => { openPickerWithAuth(); };
    window.addEventListener("collection:open", onOpen as any);
    return () => window.removeEventListener("collection:open", onOpen as any);
  }, []);

  return (
    <div className="relative">
      {showLoginPrompt && (
        <LoginPrompt
          onLoginClick={() => { setShowLoginPrompt(false); navigate("/login"); }}
          onSignupClick={() => { setShowLoginPrompt(false); navigate("/join"); }}
          onClose={() => setShowLoginPrompt(false)}
        />
      )}
      <CollectionPickerModal
        open={openPicker}
        onClose={() => setOpenPicker(false)}
        projectId={projectId}
        initialSelectedIds={initialSelected}
        onAfterChange={(selected) => { const v = selected.length > 0; setInitialSelected(selected); setHasCollected(v); broadcast(v); }}
      />
      <button
        className="flex flex-col items-center gap-1 group"
        onClick={handleClick}
      >
        <div className={`w-14 h-14 rounded-full shadow flex items-center justify-center mb-1 ${hasCollected ? "bg-[#068334] text-white" : "bg-white"}`}>
          <FaFolderMinus className="w-7 h-7" />
        </div>
        <span className={`text-sm font-semibold text-center text-white`} style={{ textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>컬렉션</span>
      </button>
    </div>
  );
}
