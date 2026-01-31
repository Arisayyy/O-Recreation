"use client";

import React, { useMemo, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { LinearIcon } from "@/app/components/icons/linear-icon";
import { StripeIcon } from "@/app/components/icons/stripe-icon";
import { GitHubIcon } from "@/app/components/icons/github-icon";
import { ExaIcon } from "@/app/components/icons/exa-icon";

type SettingsSection =
  | "preferences"
  | "profile"
  | "notifications"
  | "privacy"
  | "tools"
  | "automations"
  | "accounts";

type NavItem = {
  section: SettingsSection;
  label: string;
  icon: React.ReactNode;
  group?: "primary" | "integrations";
};

const NAV_ITEMS: readonly NavItem[] = [
  {
    section: "preferences",
    label: "Preferences",
    group: "primary",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden="true"
        className="size-4"
      >
        <path d="M6.5 2.25a.75.75 0 0 0-1.5 0v3a.75.75 0 0 0 1.5 0V4.5h6.75a.75.75 0 0 0 0-1.5H6.5v-.75ZM11 6.5a.75.75 0 0 0-1.5 0v3a.75.75 0 0 0 1.5 0v-.75h2.25a.75.75 0 0 0 0-1.5H11V6.5ZM5.75 10a.75.75 0 0 1 .75.75v.75h6.75a.75.75 0 0 1 0 1.5H6.5v.75a.75.75 0 0 1-1.5 0v-3a.75.75 0 0 1 .75-.75ZM2.75 7.25H8.5v1.5H2.75a.75.75 0 0 1 0-1.5ZM4 3H2.75a.75.75 0 0 0 0 1.5H4V3ZM2.75 11.5H4V13H2.75a.75.75 0 0 1 0-1.5Z" />
      </svg>
    ),
  },
  {
    section: "profile",
    label: "Profile",
    group: "primary",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden="true"
        className="size-4"
      >
        <path
          fillRule="evenodd"
          d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0Zm-5-2a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM8 9c-1.825 0-3.422.977-4.295 2.437A5.49 5.49 0 0 0 8 13.5a5.49 5.49 0 0 0 4.294-2.063A4.997 4.997 0 0 0 8 9Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    section: "notifications",
    label: "Notifications",
    group: "primary",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden="true"
        className="size-4"
      >
        <path
          fillRule="evenodd"
          d="M12 5a4 4 0 0 0-8 0v2.379a1.5 1.5 0 0 1-.44 1.06L2.294 9.707a1 1 0 0 0-.293.707V11a1 1 0 0 0 1 1h2a3 3 0 1 0 6 0h2a1 1 0 0 0 1-1v-.586a1 1 0 0 0-.293-.707L12.44 8.44A1.5 1.5 0 0 1 12 7.38V5Zm-5.5 7a1.5 1.5 0 0 0 3 0h-3Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    section: "privacy",
    label: "Privacy",
    group: "primary",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden="true"
        className="size-4"
      >
        <path
          fillRule="evenodd"
          d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11.5 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    section: "tools",
    label: "Tools",
    group: "integrations",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden="true"
        className="size-4"
      >
        <path
          fillRule="evenodd"
          d="M7.628 1.349a.75.75 0 0 1 .744 0l1.247.712a.75.75 0 1 1-.744 1.303L8 2.864l-.875.5a.75.75 0 0 1-.744-1.303l1.247-.712ZM4.65 3.914a.75.75 0 0 1-.279 1.023L4.262 5l.11.063a.75.75 0 0 1-.744 1.302l-.13-.073A.75.75 0 0 1 2 6.25V5a.75.75 0 0 1 .378-.651l1.25-.714a.75.75 0 0 1 1.023.279Zm6.698 0a.75.75 0 0 1 1.023-.28l1.25.715A.75.75 0 0 1 14 5v1.25a.75.75 0 0 1-1.499.042l-.129.073a.75.75 0 0 1-.744-1.302l.11-.063-.11-.063a.75.75 0 0 1-.28-1.023ZM6.102 6.915a.75.75 0 0 1 1.023-.279l.875.5.875-.5a.75.75 0 0 1 .744 1.303l-.869.496v.815a.75.75 0 0 1-1.5 0v-.815l-.869-.496a.75.75 0 0 1-.28-1.024ZM2.75 9a.75.75 0 0 1 .75.75v.815l.872.498a.75.75 0 0 1-.744 1.303l-1.25-.715A.75.75 0 0 1 2 11V9.75A.75.75 0 0 1 2.75 9Zm10.5 0a.75.75 0 0 1 .75.75V11a.75.75 0 0 1-.378.651l-1.25.715a.75.75 0 0 1-.744-1.303l.872-.498V9.75a.75.75 0 0 1 .75-.75Zm-4.501 3.708.126-.072a.75.75 0 0 1 .744 1.303l-1.247.712a.75.75 0 0 1-.744 0L6.38 13.94a.75.75 0 0 1 .744-1.303l.126.072a.75.75 0 0 1 1.498 0Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    section: "automations",
    label: "Automations",
    group: "integrations",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden="true"
        className="size-4"
      >
        <path
          fillRule="evenodd"
          d="M9.58 1.077a.75.75 0 0 1 .405.82L9.165 6h4.085a.75.75 0 0 1 .567 1.241l-6.5 7.5a.75.75 0 0 1-1.302-.638L6.835 10H2.75a.75.75 0 0 1-.567-1.241l6.5-7.5a.75.75 0 0 1 .897-.182Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    section: "accounts",
    label: "Accounts",
    group: "integrations",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden="true"
        className="size-4"
      >
        <path d="M8.5 4.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM10.9 12.006c.11.542-.348.994-.9.994H2c-.553 0-1.01-.452-.902-.994a5.002 5.002 0 0 1 9.803 0ZM14.002 12h-1.59a2.556 2.556 0 0 0-.04-.29 6.476 6.476 0 0 0-1.167-2.603 3.002 3.002 0 0 1 3.633 1.911c.18.522-.283.982-.836.982ZM12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      </svg>
    ),
  },
] as const;

function closeButtonClassName() {
  return [
    "group/button focus-visible:ring-neutral-strong",
    "absolute right-4 top-4 inline-flex shrink-0 cursor-pointer rounded-lg whitespace-nowrap",
    "transition-transform outline-none select-none focus-visible:ring-2",
    "size-7 min-w-7 min-h-7",
  ].join(" ");
}

function closeButtonBgClassName() {
  return [
    "absolute rounded-lg border transition-transform",
    "border-transparent bg-surface-strong opacity-0",
    "inset-2 blur-sm",
    "group-hover/button:opacity-100 group-hover/button:blur-none group-hover/button:inset-0",
    "group-active/button:inset-shadow-xs group-active/button:shadow-none",
  ].join(" ");
}

function navRowBgClassName() {
  return [
    "absolute bg-surface-subtle rounded-lg opacity-0 inset-1",
    "transition-transform",
    "group-hover/nav:opacity-100 group-hover/nav:inset-0",
    "group-active/nav:!inset-0.5",
  ].join(" ");
}

function NavRow({
  icon,
  label,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <div className="text-copy text-sm leading-[21px] group/nav relative z-0 flex items-center outline-none">
      <div
        aria-hidden="true"
        className={[
          "absolute rounded-lg transition-transform",
          active ? "bg-surface-subtle inset-0 opacity-100" : navRowBgClassName(),
        ].join(" ")}
      />
      <div className="relative z-2 flex w-full items-center gap-2 px-2 py-1.5">
        <div className="flex items-center gap-1">
          <span className="text-orchid-muted">{icon}</span>
          <span className="text-left text-orchid-ink">{label}</span>
        </div>
      </div>
    </div>
  );
}

function sectionTitle(section: SettingsSection) {
  const match = NAV_ITEMS.find((i) => i.section === section);
  return match?.label ?? "Settings";
}

function ExternalLinkIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      data-slot="icon"
      className={className}
    >
      <path d="M6.22 8.72a.75.75 0 0 0 1.06 1.06l5.22-5.22v1.69a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-.75-.75h-3.5a.75.75 0 0 0 0 1.5h1.69L6.22 8.72Z" />
      <path d="M3.5 6.75c0-.69.56-1.25 1.25-1.25H7A.75.75 0 0 0 7 4H4.75A2.75 2.75 0 0 0 2 6.75v4.5A2.75 2.75 0 0 0 4.75 14h4.5A2.75 2.75 0 0 0 12 11.25V9a.75.75 0 0 0-1.5 0v2.25c0 .69-.56 1.25-1.25 1.25h-4.5c-.69 0-1.25-.56-1.25-1.25v-4.5Z" />
    </svg>
  );
}

const toolConnectButtonBaseClassName = [
  "group/button focus-visible:ring-neutral-strong",
  "relative inline-flex shrink-0 cursor-pointer rounded-lg whitespace-nowrap",
  "transition-transform outline-none select-none focus-visible:ring-2",
  "h-7 px-1.5 gap-1",
].join(" ");

const toolConnectButtonBgClassName = [
  "absolute rounded-lg border transition-transform border-transparent bg-surface-strong opacity-0",
  "group-hover/button:opacity-100 group-hover/button:blur-none group-hover/button:inset-0 inset-2 blur-sm",
  "group-active/button:inset-shadow-xs dark:group-active/button:inset-shadow-xs-strong group-active/button:shadow-none",
].join(" ");

function ToolRow({
  icon,
  label,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <div className="bg-surface-strong flex items-center gap-3 rounded-lg p-3">
      {icon}
      <div className="flex-1">
        <div className="text-[14px] leading-[21px] text-orchid-ink">{label}</div>
        <div className="text-[12px] leading-[17.6px] text-orchid-muted">{description}</div>
      </div>
      <button type="button" className={toolConnectButtonBaseClassName} onClick={() => {}}>
        <div aria-hidden="true" className={toolConnectButtonBgClassName} />
        <div className="relative z-10 flex items-center gap-1 text-[14px] leading-[21px] text-orchid-muted group-hover/button:text-orchid-ink">
          <div className="px-0.5 leading-[0px] transition-transform">Connect</div>
          <ExternalLinkIcon className="size-4 transition-transform" />
        </div>
      </button>
    </div>
  );
}

export function SettingsDialog({
  open,
  onOpenChangeAction,
  initialSection = "profile",
}: {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  initialSection?: SettingsSection;
}) {
  const [section, setSection] = useState<SettingsSection>(initialSection);

  const primaryItems = useMemo(() => NAV_ITEMS.filter((i) => i.group === "primary"), []);
  const integrationItems = useMemo(() => NAV_ITEMS.filter((i) => i.group === "integrations"), []);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        onOpenChangeAction(next);
        if (!next) {
          // Reset on close so it always opens to a predictable section.
          setSection(initialSection);
        }
      }}
      modal="trap-focus"
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[90] bg-black/40" />
        <Dialog.Viewport className="fixed inset-0 z-[100] grid place-items-center p-4">
          <Dialog.Popup
            className={[
              "font-orchid-ui leading-6",
              "w-[min(768px,calc(100vw-32px))] h-[min(450px,calc(100vh-32px))]",
              "rounded-[var(--radius-orchid-prompt-outer)] border border-neutral bg-surface outline-none",
              "shadow-[0_1px_1px_0_rgb(0_0_0_/0.02),0_4px_8px_-4px_rgb(0_0_0_/0.04),0_16px_24px_-8px_rgb(0_0_0_/0.06)]",
              "relative overflow-hidden p-0.5",
              "animate-[orchid-dialog-content-in_150ms_ease-out]",
            ].join(" ")}
            initialFocus={true}
            finalFocus={false}
          >
            <Dialog.Close aria-label="Close" className={closeButtonClassName()}>
              <div aria-hidden="true" className={closeButtonBgClassName()} />
              <div className="relative z-10 flex w-full items-center justify-center text-orchid-muted group-hover/button:text-orchid-ink">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  aria-hidden="true"
                  className="size-4 transition-transform"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z"
                  />
                </svg>
              </div>
            </Dialog.Close>

            <div className="flex h-full w-full">
              {/* Left nav */}
              <div className="flex w-[200px] flex-col gap-3 p-[18px]">
                <div className="flex flex-col gap-1">
                  {primaryItems.map((item) => (
                    <button
                      key={item.section}
                      type="button"
                      className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-neutral-strong"
                      onClick={() => setSection(item.section)}
                    >
                      <NavRow icon={item.icon} label={item.label} active={section === item.section} />
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1 px-3 py-0">
                    <span className="text-[12px] leading-[17.6px] text-orchid-muted">Integrations</span>
                  </div>
                  {integrationItems.map((item) => (
                    <button
                      key={item.section}
                      type="button"
                      className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-neutral-strong"
                      onClick={() => setSection(item.section)}
                    >
                      <NavRow icon={item.icon} label={item.label} active={section === item.section} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="h-full w-px bg-surface-strong" />

              {/* Right content */}
              <div className="flex-1 p-[18px]">
                <div className="flex flex-col gap-[18px]">
                  {section === "tools" ? (
                    <>
                      <div className="flex flex-col gap-0.5">
                        <Dialog.Title className="text-sm leading-[21px] text-orchid-ink">
                          Tools
                        </Dialog.Title>
                        <Dialog.Description className="text-sm leading-[21px] text-orchid-muted">
                          Connect your favourite apps to use from within Orchid
                        </Dialog.Description>
                      </div>

                      <div className="flex flex-col gap-3">
                        <ToolRow
                          icon={<LinearIcon className="rounded-md size-8" />}
                          label="Linear"
                          description="View and manage open issues"
                        />
                        <ToolRow
                          icon={<StripeIcon className="rounded-md size-8" />}
                          label="Stripe"
                          description="Manage your invoices from within Orchid"
                        />
                        <ToolRow
                          icon={<GitHubIcon className="rounded-md size-8" />}
                          label="GitHub"
                          description="View and manage open PRs and issues"
                        />
                        <ToolRow
                          icon={<ExaIcon className="rounded-md size-8" />}
                          label="Exa"
                          description="Search the web and cite sources"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      <Dialog.Title className="text-sm leading-[21px] text-orchid-ink">
                        {sectionTitle(section)}
                      </Dialog.Title>
                      <Dialog.Description className="text-sm leading-[21px] text-orchid-muted">
                        {sectionTitle(section)} settings coming soon
                      </Dialog.Description>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

