import React from "react";

type Props = { tags: string[] };

export default function TagList({ tags }: Props) {
  return (
    <div className="flex flex-wrap gap-3 mb-7">
      {tags.map(tag => (
        <span
          key={tag}
          className="px-5 py-2 rounded-full bg-gray-100 border border-gray-300 text-gray-700 text-base font-semibold"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
