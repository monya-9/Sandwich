import React from "react";
import { MdMail } from "react-icons/md";

type As = "span" | "button" | "div";

type BaseProps<E extends As> = React.ComponentPropsWithoutRef<E>;
type Props<E extends As = "span"> = {
    hasNew: boolean;
    as?: E; // 기본 span (중첩 안전), 필요시 "button"
} & Omit<BaseProps<E>, "children">;

const MessageIcon = <E extends As = "span">({
                                                hasNew,
                                                as,
                                                className,
                                                onKeyDown,
                                                ...rest
                                            }: Props<E>) => {
    const Comp = (as ?? "span") as any;

    const handleKeyDown: React.KeyboardEventHandler = (e) => {
        if (onKeyDown) onKeyDown(e as any);
        if (rest.onClick && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            (rest.onClick as any)(e);
        }
    };

    const commonProps =
        (as ?? "span") === "span"
            ? { role: "button", tabIndex: 0, onKeyDown: handleKeyDown }
            : { onKeyDown: handleKeyDown };

    return (
        <Comp className={["relative group", className].filter(Boolean).join(" ")} {...commonProps} {...rest}>
            <MdMail className="w-6 h-6 text-[#232323] dark:text-gray-200 group-hover:text-[#3B3B3B] dark:group-hover:text-white" />
            {hasNew && (
                <span className="absolute -top-0 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
            )}
        </Comp>
    );
};

export default MessageIcon;
