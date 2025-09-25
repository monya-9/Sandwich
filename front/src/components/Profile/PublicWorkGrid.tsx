import React, { useMemo } from "react";
import { dummyProjects } from "../../data/dummyProjects";
import { resolveCover, swapJpgPng } from "../../utils/getProjectCover";

function Img({ src, alt }: { src: string; alt: string }) {
  const [url, setUrl] = React.useState(src);
  const [triedAlt, setTriedAlt] = React.useState(false);
  return (
    <img
      src={url}
      alt={alt}
      className="absolute inset-0 w-full h-full object-cover"
      onError={() => {
        if (!triedAlt) {
          setUrl(swapJpgPng(url));
          setTriedAlt(true);
        }
      }}
    />
  );
}

export default function PublicWorkGrid() {
  const projects = useMemo(() => dummyProjects.slice(0, 2), []);

  return (
    <div className="min-h-[360px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-medium text-black/90">모든 작업 목록</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {projects.map((p, idx) => {
          const cover = resolveCover(p, { position: idx });
          const coverUrl = cover ? cover : '';
          const title = p.title ? p.title : '';
          return (
            <div key={p.id} className="relative rounded-xl overflow-hidden">
              <div className="relative w-full aspect-[4/3] bg-gray-200">
                <Img src={coverUrl} alt={title} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 