// src/hooks/useLikeToggle.ts
import { useState } from "react";

export interface LikeableItem {
    id: number;
    liked: boolean;
    likes: number;
}

export function useLikeToggle<T extends LikeableItem>(
    initialItems: T[],
    toggleFunction: (challengeId: number, itemId: number, increment: boolean) => void,
    challengeId: number
) {
    const [items, setItems] = useState(initialItems);

    const toggleLike = (e: React.MouseEvent, itemId: number) => {
        e.preventDefault();
        e.stopPropagation();
        
        setItems((arr) =>
            arr.map((item) =>
                item.id === itemId 
                    ? { ...item, liked: !item.liked, likes: item.liked ? item.likes - 1 : item.likes + 1 } 
                    : item
            )
        );
        
        const target = items.find((item) => item.id === itemId);
        if (target) {
            toggleFunction(challengeId, itemId, !target.liked);
        }
    };

    return { items, toggleLike };
}
