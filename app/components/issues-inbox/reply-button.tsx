export function ReplyButton({ label }: { label: string }) {
  // Visual-only for now (no interaction hooks).
  return (
    <button
      type="button"
      className={[
        "group/button relative inline-flex h-8 flex-none cursor-pointer items-center",
        "rounded-orchid-pill px-2 whitespace-nowrap outline-none transition-transform select-none",
        "focus-visible:ring-2 focus-visible:ring-orchid-ink",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "absolute inset-0 rounded-orchid-pill border border-neutral bg-gradient-to-t from-surface to-surface shadow-xs",
          "transition-transform group-hover/button:to-surface-weak",
          "group-active/button:inset-shadow-xs group-active/button:shadow-none group-active/button:to-surface-subtle",
        ].join(" ")}
      />
      <span className="relative z-10 inline-flex items-center gap-1 text-sm leading-[21px] text-orchid-ink">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
          className="h-4 w-4 overflow-hidden"
        >
          <path
            fillRule="evenodd"
            d="M12.5 9.75A2.75 2.75 0 0 0 9.75 7H4.56l2.22 2.22a.75.75 0 1 1-1.06 1.06l-3.5-3.5a.75.75 0 0 1 0-1.06l3.5-3.5a.75.75 0 0 1 1.06 1.06L4.56 5.5h5.19a4.25 4.25 0 0 1 0 8.5h-1a.75.75 0 0 1 0-1.5h1a2.75 2.75 0 0 0 2.75-2.75Z"
            clipRule="evenodd"
          />
        </svg>
        <span className="px-[2px]">{label}</span>
      </span>
    </button>
  );
}

