import React from "react";

type Props = { tags: string[] };

export default function TagList({ tags }: Props) {
  return (
    <div className="flex flex-wrap gap-2 sm:gap-2.5 md:gap-3 mb-4 sm:mb-5 md:mb-7">
      {tags.map(tag => (
        <span
          key={tag}
          className="px-3 py-1.5 sm:px-4 sm:py-1.5 md:px-5 md:py-2 rounded-full bg-gray-100 dark:bg-white/10 border border-gray-300 dark:border-[var(--border-color)] text-gray-700 dark:text-white text-xs sm:text-sm md:text-base font-semibold"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
