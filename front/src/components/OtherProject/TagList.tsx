import React from "react";

type Props = { tags: string[] };

export default function TagList({ tags }: Props) {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      {tags.map(tag => (
        <span
          key={tag}
          className="px-4 py-1 rounded-full bg-gray-100 border border-gray-300 text-gray-700 text-sm font-medium"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
