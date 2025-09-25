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
  const goProfile = () => { onClose(); const myId = Number((localStorage.getItem('userId') || sessionStorage.getItem('userId') || '0')); if (myId > 0) navigate(`/users/${myId}`); else navigate('/login'); };
  const goDetail = () => { if (ownerId && projectId) { onClose(); navigate(`/${ownerId}/${projectId}`); } else { onClose(); } };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-lg w-[640px] max-w-[95%] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="text-[20px] font-bold">업로드 완료</div>
          <button onClick={onClose} className="w-10 h-10 text-[30px] leading-none">×</button>
        </div>
        <div className="px-6 py-10 min-h-[220px]">
          <div className="text-gray-800">1 업로드가 완료되었습니다.</div>
        </div>
        <div className="px-6 py-4 border-t flex items-center justify-between">
          <button className="text-gray-700 hover:text-black" onClick={goProfile}>프로필로 이동</button>
          <button className="bg-[#33c5b5] hover:bg-[#28b3a3] text-white rounded-full h-10 px-5" onClick={goDetail}>작업 상세페이지로 이동</button>
        </div>
      </div>
    </div>
  );
};

export default UploadDoneModal; 