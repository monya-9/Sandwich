// src/components/project/ProjectCard.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project } from '../../types/Project';
import { dummyUsers } from '../../data/dummyUsers';
import { resolveCover, swapJpgPng } from '../../utils/getProjectCover';

type Props = {
    project: Project;
    indexInList?: number; // 중복 방지용
};

const ProjectCard: React.FC<Props> = ({ project, indexInList }) => {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);
    const [imgErr, setImgErr] = useState(false);
    const [triedAltExt, setTriedAltExt] = useState(false);
    const [src, setSrc] = useState(() => project.coverUrl || resolveCover(project, { position: indexInList }));

    // DB 데이터는 username, 더미데이터는 authorId로 사용자 정보 제공 (닉네임 우선)
    const username = project.username || (project.authorId ? dummyUsers.find(user => user.id === project.authorId)?.nickname || dummyUsers.find(user => user.id === project.authorId)?.name : null) || '알 수 없음';
    const initial = username.charAt(0).toUpperCase();

    // 포트폴리오 상세 페이지로 이동
    const handleCardClick = () => {
        // ownerId는 authorId를 우선 사용, 없으면 username 사용
        const ownerId = project.authorId || project.username || 'unknown';
        navigate(`/other-project/${ownerId}/${project.id}`);
    };
    

    const handleError = () => {
        if (!triedAltExt) {
            setTriedAltExt(true);
            setSrc(prev => swapJpgPng(prev));
        } else {
            setImgErr(true);
        }
    };

    return (
        <div className="relative w-full flex flex-col items-center mb-5">
            {/* 이미지 영역(비율 고정) */}
            <div
                className="relative w-full rounded-[20px] overflow-hidden cursor-pointer"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={handleCardClick}
            >
                {/* 핵심: 비율 고정 */}
                <div className="relative w-full aspect-[4/3] bg-gray-200">
                    {imgErr ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                            <span className="text-sm text-gray-500">{(project.title || '프로젝트').slice(0, 14)}</span>
                        </div>
                    ) : (
                        <img
                            src={src}
                            alt={project.title || '프로젝트'}
                            className="absolute inset-0 w-full h-full object-cover"
                            loading="lazy"
                            onError={handleError}
                        />
                    )}

                    {isHovered && (
                        <div className="absolute inset-0 bg-black/40 flex items-end justify-start p-4 transition-opacity duration-300">
                            <p className="text-white text-sm font-medium truncate w-full">{project.title}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 작성자 + 정보 영역 */}
            <div className="w-full mt-1 flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-300 text-xs font-semibold flex items-center justify-center text-black">
                        {initial}
                    </div>
                    <span className="text-sm text-black">{username}</span>
                </div>
                <div className="text-xs text-gray-600 flex gap-3">
                    <span>👁 {project.views || 0}</span>
                    <span>♥ {project.likes || 0}</span>
                    <span>💬 {project.comments || 0}</span>
                </div>
            </div>
        </div>
    );
};

export default ProjectCard;
