"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Menu } from "@base-ui/react/menu";
import { BugIcon } from "@/app/components/icons/bug-icon";
import { LogoutIcon } from "@/app/components/icons/logout-icon";
import { MailIcon } from "@/app/components/icons/mail-icon";
import { MonitorIcon } from "@/app/components/icons/monitor-icon";
import { MoonIcon } from "@/app/components/icons/moon-icon";
import { SettingsIcon } from "@/app/components/icons/settings-icon";
import { SunIcon } from "@/app/components/icons/sun-icon";

type ThemePreference = "system" | "light" | "dark";

const THEME_STORAGE_KEY = "orchid:theme";

function applyThemePreference(pref: ThemePreference) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  if (pref === "system") {
    delete root.dataset.theme;
    root.style.colorScheme = "";
    return;
  }

  root.dataset.theme = pref;
  root.style.colorScheme = pref;
}

function getStoredThemePreference(): ThemePreference | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (v === "system" || v === "light" || v === "dark") return v;
    return null;
  } catch {
    return null;
  }
}

function setStoredThemePreference(pref: ThemePreference) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    // ignore
  }
}

function menuPanelClassName() {
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
  // Matches the hover/highlight background in other menus (see `menu-dropdown.tsx`).
  return [
    "absolute bg-surface-subtle rounded-lg opacity-0 inset-1",
    "transition-transform",
    "group-hover/zhover:opacity-100 group-hover/zhover:inset-0",
    "group-data-[highlighted]/zhover:opacity-100 group-data-[highlighted]/zhover:inset-0",
    "group-active/zhover:!inset-0.5",
  ].join(" ");
}

function MenuRow({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
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

export function AvatarMenu({
  avatarInitial = "A",
  align = "end",
}: {
  avatarInitial?: string;
  align?: "start" | "center" | "end";
}) {
  const [theme, setTheme] = useState<ThemePreference>("system");

  useEffect(() => {
    const stored = getStoredThemePreference();
    if (stored) setTheme(stored);
    applyThemePreference(stored ?? "system");
  }, []);

  useEffect(() => {
    setStoredThemePreference(theme);
    applyThemePreference(theme);
  }, [theme]);

  const themeIndex = useMemo(() => {
    if (theme === "system") return 0;
    if (theme === "light") return 1;
    return 2;
  }, [theme]);

  return (
    <Menu.Root>
      <Menu.Trigger className="inline-flex cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-orchid-border">
        <span className="relative inline-flex items-center text-[14px] leading-[21px] text-orchid-ink">
          <span className="absolute inset-1 rounded-full bg-orchid-surface-2 opacity-0" />

          <span className="relative z-10 p-1">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-orchid-border bg-white text-[10px] font-semibold leading-[15px] text-orchid-ink">
              {avatarInitial}
            </span>
          </span>
        </span>
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner side="bottom" align={align} className="z-80">
          <Menu.Popup className="group outline-none">
            <div className={menuPanelClassName()}>
              <div className="hide-scrollbar flex max-h-72 flex-col gap-0.5 overflow-auto select-none [--lh:1lh]">
                <Menu.Item className="group/zhover outline-none" onClick={() => window.alert("TODO: send a test email")}>
                  <button className="w-full outline-none" data-tabindex="" tabIndex={-1} type="button">
                    <MenuRow icon={<MailIcon className="size-4" />} label="Send Test Email" />
                  </button>
                </Menu.Item>

                <Menu.Item className="group/zhover outline-none" onClick={() => window.alert("TODO: report a bug")}>
                  <button className="w-full outline-none" data-tabindex="" tabIndex={-1} type="button">
                    <MenuRow icon={<BugIcon className="size-4" />} label="Report Bug" />
                  </button>
                </Menu.Item>

                <Menu.Separator className="border-neutral border-t" />

                <Menu.Item className="group/zhover outline-none" onClick={() => window.alert("TODO: open settings")}>
                  <button className="w-full outline-none" data-tabindex="" tabIndex={-1} type="button">
                    <MenuRow icon={<SettingsIcon className="size-4" />} label="Settings" />
                  </button>
                </Menu.Item>

                <Menu.Item
                  className="group/zhover outline-none"
                  onClick={() => {
                    try {
                      window.localStorage.removeItem("orchid:deviceId");
                    } catch {
                      // ignore
                    }
                    window.location.reload();
                  }}
                >
                  <button className="w-full outline-none" data-tabindex="" tabIndex={-1} type="button">
                    <MenuRow icon={<LogoutIcon className="size-4" />} label="Logout" />
                  </button>
                </Menu.Item>

                <Menu.Separator className="border-neutral border-t" />

                <div className="rounded-lg p-0.5">
                  <div className="relative grid grid-cols-3 rounded-full">
                    <div
                      aria-hidden="true"
                      className="absolute inset-y-0 left-0 m-0.5 h-7 w-1/3 rounded-md bg-surface-subtle transition-transform duration-150 ease-in-out"
                      style={{ transform: `translateX(${themeIndex * 100}%)` }}
                    />

                    <button
                      type="button"
                      className={[
                        "relative z-10 flex h-7 items-center justify-center rounded-md border-2 border-transparent p-0 leading-none",
                        theme === "system" ? "text-orchid-ink" : "text-orchid-muted",
                      ].join(" ")}
                      onClick={() => setTheme("system")}
                    >
                      <MonitorIcon className="size-4 block translate-y-[1.75px]" />
                    </button>

                    <button
                      type="button"
                      className={[
                        "relative z-10 flex h-7 items-center justify-center rounded-md border-2 border-transparent p-0 leading-none",
                        theme === "light" ? "text-orchid-ink" : "text-orchid-muted",
                      ].join(" ")}
                      onClick={() => setTheme("light")}
                    >
                      <SunIcon className="size-4 block translate-y-[1.75px]" />
                    </button>

                    <button
                      type="button"
                      className={[
                        "relative z-10 flex h-7 items-center justify-center rounded-md border-2 border-transparent p-0 leading-none",
                        theme === "dark" ? "text-orchid-ink" : "text-orchid-muted",
                      ].join(" ")}
                      onClick={() => setTheme("dark")}
                    >
                      <MoonIcon className="size-4 block translate-y-[1.75px]" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

