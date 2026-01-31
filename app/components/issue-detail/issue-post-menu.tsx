"use client";

import React from "react";
import { Menu } from "@base-ui/react/menu";
import { CheckCircleIcon } from "@/app/components/icons/check-circle-icon";
import { ForwardIcon } from "@/app/components/icons/forward-icon";
import { TrashIcon } from "@/app/components/icons/trash-icon";

function menuPanelClassName() {
  // Keep this in sync with `AvatarMenu` so the menu looks identical.
  return [
    "bg-surface border-neutral z-50 min-w-48 overflow-hidden",
    "rounded-xl border p-0.5 outline-none",
    "font-orchid-ui leading-6",
    "shadow-[0_1px_1px_0_rgb(0_0_0/0.02),0_4px_8px_0_rgb(0_0_0/0.04)]",
    "transition-[transform,scale,opacity] duration-150 ease-out",
    "group-data-[starting-style]:scale-90 group-data-[starting-style]:opacity-0",
    "group-data-[ending-style]:scale-90 group-data-[ending-style]:opacity-0",
    "origin-[var(--transform-origin)] group-data-[instant]:duration-0",
  ].join(" ");
}

function menuItemBgClassName() {
  return [
    "absolute bg-surface-subtle rounded-lg opacity-0 inset-1",
    "transition-transform",
    "group-hover/zhover:opacity-100 group-hover/zhover:inset-0",
    "group-data-[highlighted]/zhover:opacity-100 group-data-[highlighted]/zhover:inset-0",
    "group-active/zhover:!inset-0.5",
  ].join(" ");
}

function MenuRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="text-copy text-sm leading-[21px] group/zhover relative z-0 flex items-center outline-none">
      <div aria-hidden="true" className={menuItemBgClassName()} />
      <div className="relative z-2 flex w-full items-center gap-2 px-2 py-1.5">
        <span className="text-orchid-muted">{icon}</span>
        <span className="flex-1 text-left text-orchid-ink">{label}</span>
      </div>
    </div>
  );
}

function TriggerButton({ children }: { children: React.ReactNode }) {
  // Match `SquareHoverButton` styling from `thread-message.tsx`.
  return (
    <span className="group/button relative inline-flex size-7 min-h-7 min-w-7 shrink-0 cursor-pointer rounded-lg whitespace-nowrap outline-none transition-transform select-none focus-visible:ring-2 focus-visible:ring-neutral-strong">
      <span
        aria-hidden="true"
        className={[
          "absolute rounded-lg border transition-transform",
          "border-transparent bg-surface-strong opacity-0",
          "inset-2 blur-sm",
          "group-hover/button:opacity-100 group-hover/button:blur-none group-hover/button:inset-0",
          "group-active/button:inset-shadow-xs group-active/button:shadow-none",
        ].join(" ")}
      />
      <span className="relative z-10 flex w-full items-center justify-center text-orchid-muted group-hover/button:text-orchid-ink">
        {children}
      </span>
    </span>
  );
}

export function IssuePostMenu({
  align = "end",
  onDoneAction,
  onForwardAction,
  onDeleteAction,
  onOpenChangeAction,
}: {
  align?: "start" | "center" | "end";
  onDoneAction?: () => void;
  onForwardAction?: () => void;
  onDeleteAction?: () => void;
  onOpenChangeAction?: (open: boolean) => void;
}) {
  return (
    <Menu.Root onOpenChange={onOpenChangeAction}>
      <Menu.Trigger aria-label="More">
        <TriggerButton>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
            className="size-4 transition-transform"
          >
            <path d="M2 8a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM6.5 8a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM12.5 6.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
          </svg>
        </TriggerButton>
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner side="bottom" align={align} className="z-80">
          <Menu.Popup className="group outline-none">
            <div className={menuPanelClassName()}>
              <div className="hide-scrollbar flex max-h-72 flex-col gap-0.5 overflow-auto select-none [--lh:1lh]">
                <Menu.Item className="group/zhover outline-none" onClick={onDoneAction}>
                  <button className="w-full outline-none" data-tabindex="" tabIndex={-1} type="button">
                    <MenuRow icon={<CheckCircleIcon className="size-4" />} label="Done" />
                  </button>
                </Menu.Item>

                <Menu.Item className="group/zhover outline-none" onClick={onForwardAction}>
                  <button className="w-full outline-none" data-tabindex="" tabIndex={-1} type="button">
                    <MenuRow icon={<ForwardIcon className="size-4" />} label="Forward" />
                  </button>
                </Menu.Item>

                <Menu.Separator className="border-neutral border-t" />

                <Menu.Item className="group/zhover outline-none" onClick={onDeleteAction}>
                  <button className="w-full outline-none" data-tabindex="" tabIndex={-1} type="button">
                    <MenuRow icon={<TrashIcon className="size-4" />} label="Delete" />
                  </button>
                </Menu.Item>
              </div>
            </div>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

