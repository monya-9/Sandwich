import React from "react";
import { MdNotifications } from "react-icons/md";

type As = "span" | "button" | "div";
type BaseProps<E extends As> = React.ComponentPropsWithoutRef<E>;
type Props<E extends As = "span"> = {
    hasNew: boolean;
    as?: E;
} & Omit<BaseProps<E>, "children">;

const NotificationIcon = <E extends As = "span">({
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
            <MdNotifications className="w-6 h-6 text-black dark:text-white group-hover:text-gray-700 dark:group-hover:text-white" />
            {hasNew && (
                <span className="absolute -top-0 -right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
            )}
        </Comp>
    );
};

export default NotificationIcon;
