import React from "react";
import { useNavigate } from "react-router-dom";

interface UploadDoneModalProps {
  open: boolean;
  onClose: () => void;
  ownerId?: number;
  projectId?: number;
}

const UploadDoneModal: React.FC<UploadDoneModalProps> = ({ open, onClose, ownerId, projectId }) => {
  const navigate = useNavigate();
  if (!open) return null;
  // 내 프로필로 이동
  const goProfile = () => {
    onClose();
    const myId = Number((localStorage.getItem('userId') || sessionStorage.getItem('userId') || '0'));
    if (myId > 0) navigate('/profile'); else navigate('/login');
  };
  // 작업 상세 페이지로 이동 (페이지 형식)
  const goDetail = () => {
    if (ownerId && projectId) {
      onClose();
      navigate(`/other-project/${ownerId}/${projectId}`, { state: { page: true } });
    } else { onClose(); }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60">
      <div className="bg-white dark:bg-[var(--surface)] border border-black/10 dark:border-[var(--border-color)] rounded-lg w-[640px] max-w-[95%] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 dark:border-[var(--border-color)]">
          <div className="text-[20px] font-bold text-black dark:text-white">업로드 완료</div>
          <button onClick={onClose} className="w-10 h-10 text-[30px] leading-none text-black dark:text-white">×</button>
        </div>
        <div className="px-6 py-10 min-h-[220px]">
          <div className="text-gray-800 dark:text-white">업로드가 완료되었습니다.</div>
        </div>
        <div className="px-6 py-4 border-t border-black/10 dark:border-[var(--border-color)] flex items-center justify-between">
          <button className="text-gray-700 dark:text-white/80 hover:text-black dark:hover:text-white" onClick={goProfile}>프로필로 이동</button>
          <button className="bg-[#11B8A5] hover:bg-[#0fa192] text-white rounded-full h-10 px-5 ring-1 ring-black/10 dark:ring-white/15 border border-black/20 dark:border-white/10" onClick={goDetail}>작업 상세페이지로 이동</button>
        </div>
      </div>
    </div>
  );
};

export default UploadDoneModal; 