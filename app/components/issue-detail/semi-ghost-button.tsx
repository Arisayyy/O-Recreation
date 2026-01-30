import React from "react";

const keycapClass =
  "bg-surface-weak border-neutral text-orchid-placeholder shadow-xs";

export const semiGhostButtonBaseClass = [
  "group/button relative inline-flex h-7 shrink-0 cursor-pointer items-center rounded-lg",
  "whitespace-nowrap bg-transparent transition-transform outline-none select-none",
  "focus-visible:ring-2 focus-visible:ring-orchid-ink",
].join(" ");

export const semiGhostButtonBgClass = [
  "absolute inset-0 rounded-lg border border-transparent bg-surface-weak transition-transform",
  "group-hover/button:bg-surface-strong group-hover/button:border-neutral group-hover/button:shadow-xs",
  "group-active/button:inset-shadow-xs dark:group-active/button:inset-shadow-xs-strong group-active/button:shadow-none",
].join(" ");

export const semiGhostButtonInnerClass =
  "relative z-10 flex items-center gap-1 text-sm leading-[21px] text-copy";

export function SemiGhostButton({
  label,
  keycap,
  icon,
  disabled,
  className,
  type = "button",
}: {
  label?: string;
  keycap?: string;
  icon: React.ReactNode;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={[
        semiGhostButtonBaseClass,
        "px-1.5",
        disabled ? "cursor-not-allowed opacity-50" : "",
        className ?? "",
      ].join(" ")}
    >
      <div className={semiGhostButtonBgClass} />
      <div className={semiGhostButtonInnerClass + " pointer-events-none"}>
        <span className="block h-4 w-4 transition-transform">{icon}</span>
        {label ? (
          <div className="px-[2px] leading-[0px] transition-transform">
            {label}
          </div>
        ) : null}
        {keycap ? (
          <span
            className={[
              keycapClass,
              "inline-flex h-4 items-center rounded border px-1",
              "text-[12px] leading-[17.6px]",
            ].join(" ")}
          >
            {keycap}
          </span>
        ) : null}
      </div>
    </button>
  );
}

