import React from "react";

type Props = { tags: string[] };

export default function TagList({ tags }: Props) {
  return (
    <div className="flex flex-wrap gap-3 mb-7">
      {tags.map(tag => (
        <span
          key={tag}
          className="px-5 py-2 rounded-full bg-gray-100 dark:bg-white/10 border border-gray-300 dark:border-[var(--border-color)] text-gray-700 dark:text-white text-base font-semibold"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
