import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosInstance";
import { Project } from "../../types/Project";
import { resolveCover } from "../../utils/getProjectCover";

const LikesTab: React.FC = () => {
	const [items, setItems] = useState<Project[]>([]);
	const [loading, setLoading] = useState(true);
	const navigate = useNavigate();

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				setLoading(true);
				const res = await api.get("/likes/me/projects", { params: { page: 0, size: 48 } });
				const list = (res.data?.content || []) as Project[];
				if (!mounted) return;
				setItems(list);
			} catch {
				if (mounted) setItems([]);
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => { mounted = false; };
	}, []);

    if (loading) {
        return <div className="min-h-[360px] flex items-center justify-center text-black/60 dark:text-white/60">불러오는 중…</div>;
    }

	if (!items.length) {
		return (
            <div className="min-h-[360px] flex flex-col items-center justify-center text-center">
                <div className="mt-6 text-[16px] md:text-[18px] text-black/80 dark:text-white/80">아직 좋아요한 작업이 없습니다.</div>
			</div>
		);
	}

	return (
		<div className="mt-6 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
			{items.map((p, idx) => {
				const cover = (p as any).coverUrl || resolveCover(p as any, { position: idx });
				const title = (p as any).title || "";
				const ownerId = (p as any).owner?.id || (p as any).authorId;
				const go = () => navigate(`/other-project/${ownerId}/${(p as any).id}`, { state: { fromApp: true } });
				return (
					<div key={p.id} className="relative rounded-xl overflow-hidden cursor-pointer" onClick={go}>
						<div className="relative w-full aspect-[4/3] bg-gray-200 group">
							<img src={cover || ""} alt={title} className="absolute inset-0 w-full h-full object-cover" />
							<div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
							<div className="absolute left-2 bottom-2 text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity line-clamp-1">{title}</div>
						</div>
					</div>
				);
			})}
		</div>
	);
};

export default LikesTab;
