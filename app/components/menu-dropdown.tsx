"use client";

import React, { useMemo, useRef } from "react";
import { Menu } from "@base-ui/react/menu";

export type MenuDropdownItem<TValue extends string> = {
  value: TValue;
  label: string;
};

export function MenuDropdown<TValue extends string>({
  value,
  items,
  onChangeAction,
  triggerClassName,
  trigger,
  align = "start",
  numericKeycaps = false,
  numericHotkeys = false,
}: {
  value: TValue;
  items: ReadonlyArray<MenuDropdownItem<TValue>>;
  onChangeAction: (next: TValue) => void;
  triggerClassName?: string;
  trigger: React.ReactNode;
  align?: "start" | "center" | "end";
  numericKeycaps?: boolean;
  numericHotkeys?: boolean;
}) {
  const actionsRef = useRef<{ close?: () => void } | null>(null);
  const numericKeycapForIndex = useMemo(() => {
    return (idx: number) => {
      // We intentionally support only 1-9 here; add more if we ever exceed 9 items.
      const n = idx + 1;
      if (n < 1 || n > 9) return null;
      return String(n);
    };
  }, []);

  return (
    <Menu.Root actionsRef={actionsRef as any}>
      <Menu.Trigger className={triggerClassName}>{trigger}</Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner side="bottom" align={align} className="z-[9999]">
          <Menu.Popup
            className="group outline-none"
            onKeyDown={(e) => {
              if (!numericHotkeys) return;
              if (e.defaultPrevented) return;
              if (e.metaKey || e.ctrlKey || e.altKey) return;

              // Only handle 1-9 while the menu is open.
              if (!/^[1-9]$/.test(e.key)) return;
              const idx = Number(e.key) - 1;
              const opt = items[idx];
              if (!opt) return;

              e.preventDefault();
              e.stopPropagation();
              onChangeAction(opt.value);
              actionsRef.current?.close?.();
            }}
          >
            <div className="bg-surface border-neutral z-50 min-w-48 overflow-hidden rounded-xl border p-0.5 shadow-lg outline-none transition-[transform,scale,opacity] duration-150 ease-out group-data-[starting-style]:scale-90 group-data-[starting-style]:opacity-0 group-data-[ending-style]:scale-90 group-data-[ending-style]:opacity-0 origin-[var(--transform-origin)] group-data-[instant]:duration-0">
              <div className="hide-scrollbar flex max-h-60 flex-col gap-0.5 overflow-auto select-none [--lh:1lh]">
                {items.map((opt, idx) => (
                  <Menu.Item
                    key={opt.value}
                    className="group/zhover outline-none"
                    onClick={() => onChangeAction(opt.value)}
                  >
                    <button className="w-full outline-none" data-tabindex="" tabIndex={-1}>
                      <div className="">
                        <div className="text-copy text-sm leading-[21px] group/zhover relative z-0 flex items-center outline-none">
                          <div className="absolute transition-transform group-hover/zhover:opacity-100 bg-surface-subtle rounded-lg group-hover/zhover:inset-0 inset-1 opacity-0 group-data-[highlighted]/zhover:opacity-100 group-data-[highlighted]/zhover:inset-0 group-active/zhover:!inset-0.5" />
                          <div className="relative z-2 flex w-full items-center gap-2 cursor-pointer px-2 py-1.5 transition-colors">
                            <span className="flex-1 text-left">{opt.label}</span>
                            <span className="flex items-center gap-1">
                              {opt.value === value ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 16 16"
                                  fill="currentColor"
                                  aria-hidden="true"
                                  data-slot="icon"
                                  className="size-3"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              ) : null}
                              {(() => {
                                if (!numericKeycaps) return null;
                                const cap = numericKeycapForIndex(idx);
                                if (!cap) return null;
                                return (
                                  <span
                                    className={[
                                      "bg-surface-weak border-neutral text-orchid-placeholder shadow-xs",
                                      "inline-flex h-4 items-center rounded border px-1",
                                      "text-[12px] leading-[17.6px]",
                                    ].join(" ")}
                                  >
                                    {cap}
                                  </span>
                                );
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  </Menu.Item>
                ))}
              </div>
            </div>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

