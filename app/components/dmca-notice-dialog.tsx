"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getAnonymousIdentity, getOrCreateDeviceId } from "@/app/lib/replicate/anonymousIdentity";
import { AvatarMarble } from "@/app/components/avatar-marble";

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

const dialogActionButtonBaseClassName = [
  "group/button focus-visible:ring-neutral-strong",
  "relative inline-flex shrink-0 cursor-pointer rounded-lg whitespace-nowrap",
  "transition-transform outline-none select-none focus-visible:ring-2",
  "h-7 px-1.5",
].join(" ");

const dialogSecondaryButtonBgClassName = [
  "absolute rounded-lg border transition-transform bg-surface-weak border-transparent inset-0",
  "group-hover/button:bg-surface-strong group-hover/button:border-neutral group-hover/button:shadow-xs",
  "group-active/button:inset-shadow-xs dark:group-active/button:inset-shadow-xs-strong group-active/button:shadow-none",
].join(" ");

const dialogPrimaryButtonBgClassName = [
  "absolute rounded-lg border transition-transform inset-0",
  "bg-gradient-to-t from-surface to-surface border-neutral shadow-xs",
  "group-hover/button:to-surface-weak dark:group-hover/button:to-surface-strong",
  "group-active/button:inset-shadow-xs dark:group-active/button:inset-shadow-xs-strong group-active/button:shadow-none",
  "group-active/button:to-surface-subtle",
].join(" ");

const dialogActionButtonInnerClassName =
  "relative z-10 flex items-center gap-1 text-[14px] leading-[21px] text-orchid-ink";

type DmcaStep = 1 | 2 | 3 | 4 | 5;

function normalizePhrase(input: string): string {
  return input.trim().replace(/\s+/g, " ").toLowerCase();
}

function IdentityPill({
  deviceId,
  name,
  color,
}: {
  deviceId: string;
  name: string;
  color: string;
}) {
  return (
    <div className="bg-surface-strong flex items-center rounded-full p-1 whitespace-nowrap">
      <p className="px-1 text-sm leading-[21px] text-orchid-ink m-0">
        <span className="inline-flex items-center gap-2">
          <span className="bg-surface border-neutral text-orchid-ink flex items-center justify-center overflow-hidden border font-semibold rounded-full size-4 min-w-4 min-h-4 text-[10px] leading-[15px]">
            <AvatarMarble
              size={16}
              id={deviceId}
              name={name}
              showInitials={false}
              className="block size-4"
            />
          </span>
          <span className="inline-block size-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="min-w-0 truncate">{name}</span>
        </span>
      </p>
    </div>
  );
}

export function DmcaNoticeDialog({
  open,
  onOpenChangeAction,
}: {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
}) {
  const logDmcaFinish = useMutation((api as any).dmca?.logFinish);
  const deviceId = useMemo(() => getOrCreateDeviceId(), []);
  const me = useMemo(() => getAnonymousIdentity(), []);
  const myName = me.name ?? "Anonymous";
  const myColor = me.color ?? "#6366f1";
  const [step, setStep] = useState<DmcaStep>(1);
  const [phrase, setPhrase] = useState("");
  const requiredPhrase = "DMCA Arisay Now";
  const phrasePanelRef = useRef<HTMLDivElement | null>(null);
  const submitButtonRef = useRef<HTMLButtonElement | null>(null);
  const [nearSubmit, setNearSubmit] = useState(false);
  const [scaredAngleDeg, setScaredAngleDeg] = useState(0);
  const [isHoveringSubmit, setIsHoveringSubmit] = useState(false);
  const [isHoveringNvm, setIsHoveringNvm] = useState(false);

  const title = useMemo(() => {
    if (step === 1) return "Submit DMCA notice to Arisay";
    if (step === 2) return "Verify & Confirm";
    if (step === 3) return "Final confirmation";
    if (step === 4) return "Air support";
    return "Mission update";
  }, [step]);

  const description = useMemo(() => {
    if (step === 1) {
      return "If you are so inclined as to initiate an extravagantly formal DMCA-ish communiqué against the earth citizen named Arisay for some allegedly infringing something-or-other within this very repository, you may proceed. A subsequent step will invite you to solemnly re-affirm your intent with maximal ceremonial seriousness.";
    }
    if (step === 2) {
      return "Before continuing, please confirm you understand this is a legal request and that your submission is accurate to the best of your knowledge.";
    }
    return "";
  }, [step]);

  const canSubmit = normalizePhrase(phrase) === normalizePhrase(requiredPhrase);

  useEffect(() => {
    if (step !== 3) {
      setNearSubmit(false);
      setScaredAngleDeg(0);
      setIsHoveringSubmit(false);
      setIsHoveringNvm(false);
      return;
    }
  }, [step]);

  useEffect(() => {
    // Emoji shenanigans are only allowed once the phrase is correct.
    if (!canSubmit) {
      setNearSubmit(false);
      setScaredAngleDeg(0);
      setIsHoveringSubmit(false);
      setIsHoveringNvm(false);
    }
  }, [canSubmit]);

  const updatePeekFromPointer = (clientX: number, clientY: number, target: EventTarget | null) => {
    if (step !== 3) return;
    const btn = submitButtonRef.current;
    if (!btn) return;
    const phrasePanel = phrasePanelRef.current;
    if (phrasePanel && target && phrasePanel.contains(target as Node)) {
      setNearSubmit(false);
      setScaredAngleDeg(0);
      return;
    }
    const r = btn.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;

    const dx = cx - clientX;
    const dy = cy - clientY;
    const dist = Math.hypot(dx, dy);

    // "Get close": within ~110px of the submit button center.
    const near = dist <= 110;

    // Rotate the emoji slightly to "glance" toward the button.
    // Clamp to keep it subtle / readable.
    const angle = Math.max(-18, Math.min(18, (Math.atan2(dy, dx) * 180) / Math.PI));

    setNearSubmit(near);
    setScaredAngleDeg(angle);
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        onOpenChangeAction(next);
        if (!next) {
          setStep(1);
          setPhrase("");
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
              "w-[min(448px,calc(100vw-32px))] h-auto max-h-[calc(100vh-32px)]",
              "rounded-[var(--radius-orchid-prompt-outer)] border border-neutral bg-surface outline-none",
              "shadow-[0_1px_1px_0_rgb(0_0_0_/0.02),0_4px_8px_-4px_rgb(0_0_0_/0.04),0_16px_24px_-8px_rgb(0_0_0_/0.06)]",
              "relative overflow-hidden p-0.5",
              "animate-[orchid-dialog-content-in_150ms_ease-out]",
            ].join(" ")}
            initialFocus={true}
            finalFocus={false}
            onPointerMove={(e) => updatePeekFromPointer(e.clientX, e.clientY, e.target)}
            onPointerLeave={() => {
              setNearSubmit(false);
              setScaredAngleDeg(0);
            }}
          >
            {/* Little scared friend peeking from behind the dialog (final step only). */}
            {/*
              - 😄 appears when hovering the "nvm" button
              - 😰 appears when hovering/approaching Submit (but NOT while hovering the phrase panel)
            */}
            <div
              aria-hidden="true"
              className={[
                "pointer-events-none absolute -left-3 bottom-6 select-none",
                // Behind the content, but still inside the clipped dialog box.
                "z-0",
                "transition-all duration-200 ease-out",
                step === 3 && canSubmit && (isHoveringNvm || nearSubmit || isHoveringSubmit)
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-3",
              ].join(" ")}
              style={{ transform: `rotate(${isHoveringNvm ? 0 : scaredAngleDeg}deg)` }}
            >
              <div className="text-[32px] leading-none">
                {isHoveringNvm ? "😄" : "😰"}
              </div>
            </div>

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

            <div className="flex flex-col gap-4 p-6">
              <div className="flex flex-col gap-2">
                <Dialog.Title className="m-0 text-orchid-ink font-medium">{title}</Dialog.Title>
                {description ? (
                  <Dialog.Description className="m-0 text-sm leading-[21px] text-orchid-muted">
                    {description}
                  </Dialog.Description>
                ) : null}
              </div>

              {step === 2 ? (
                <>
                  <div className="rounded-lg border border-neutral bg-surface-weak p-3 text-sm leading-[21px] text-orchid-ink">
                    <div className="font-medium">Target</div>
                    <div className="mt-1 text-orchid-muted">
                      The next click will dispatch a dramatically bureaucratic takedown-shaped gesture toward the earth
                      citizen known as <span className="text-orchid-ink">Arisay</span>. Are you confident this is the
                      GitHub repository you intended to point your paperwork cannon at?
                    </div>
                    <div className="mt-2">
                      <a
                        href="https://github.com/Arisayyy/O-Recreation"
                        target="_blank"
                        rel="noreferrer"
                        className="break-all text-orchid-ink underline underline-offset-2 decoration-neutral hover:decoration-neutral-strong"
                      >
                        https://github.com/Arisayyy/O-Recreation
                      </a>
                    </div>
                  </div>
                </>
              ) : step === 3 ? (
                <div ref={phrasePanelRef} className="rounded-lg border border-neutral bg-surface-weak p-3">
                  <label className="block text-sm leading-[21px] text-orchid-ink font-medium">
                    Type this phrase to unlock the big red button
                  </label>
                  <div className="mt-1 text-sm leading-[21px] text-orchid-muted">
                    Enter: <span className="text-orchid-ink">{requiredPhrase}</span>
                  </div>
                  <input
                    value={phrase}
                    onChange={(e) => setPhrase(e.currentTarget.value)}
                    placeholder={requiredPhrase}
                    autoComplete="off"
                    spellCheck={false}
                    className={[
                      "mt-3 w-full rounded-lg border border-surface-strong bg-surface px-3 py-2",
                      "text-sm leading-[21px] text-orchid-ink",
                      "focus:border-neutral focus:outline-none",
                    ].join(" ")}
                  />
                </div>
              ) : step === 4 ? (
                <div className="flex flex-col gap-3">
                  <div className="rounded-lg border border-neutral bg-surface-weak p-3 text-sm leading-[21px] text-orchid-ink">
                    Boss, we’ve got Arisay’s house in sight. Just give the order and we’ll handle the rest.
                  </div>
                  <div className="overflow-hidden rounded-lg border border-neutral bg-black">
                    <video src="/videos/heli.mp4" controls playsInline className="block h-auto w-full" />
                  </div>
                </div>
              ) : step === 5 ? (
                <div className="flex flex-col gap-3">
                  <div className="rounded-lg border border-neutral bg-surface-weak p-3 text-sm leading-[21px] text-orchid-ink">
                    Arisay has been successfully detained and is no longer a threat to Earth. Agent SAMA stopped by to
                    pay him a visit.
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm leading-[21px] text-orchid-muted">Filed by</div>
                    <IdentityPill deviceId={deviceId} name={myName} color={myColor} />
                  </div>
                  <div className="overflow-hidden rounded-lg border border-neutral bg-black max-h-[42vh]">
                    <video
                      src="/videos/badending.mp4"
                      controls
                      playsInline
                      className="block h-auto w-full max-h-[42vh] object-contain"
                    />
                  </div>
                </div>
              ) : null}

              <div className="flex justify-end gap-2">
                {step === 5 ? null : step === 2 || step === 3 || step === 4 ? (
                  <Dialog.Close
                    className={dialogActionButtonBaseClassName}
                    onMouseEnter={() => setIsHoveringNvm(true)}
                    onMouseLeave={() => setIsHoveringNvm(false)}
                    onFocus={() => setIsHoveringNvm(true)}
                    onBlur={() => setIsHoveringNvm(false)}
                  >
                    <div aria-hidden="true" className={dialogSecondaryButtonBgClassName} />
                    <div className={dialogActionButtonInnerClassName}>
                      <div className="px-0.5 leading-[0px] transition-transform">
                        {step === 2 ? "Abort" : step === 4 ? "Abort, I don’t want this" : "nvm"}
                      </div>
                    </div>
                  </Dialog.Close>
                ) : (
                  <Dialog.Close className={dialogActionButtonBaseClassName}>
                    <div aria-hidden="true" className={dialogSecondaryButtonBgClassName} />
                    <div className={dialogActionButtonInnerClassName}>
                      <div className="px-0.5 leading-[0px] transition-transform">Cancel</div>
                    </div>
                  </Dialog.Close>
                )}

                {step === 1 ? (
                  <button
                    type="button"
                    className={dialogActionButtonBaseClassName}
                    onClick={() => setStep(2)}
                  >
                    <div aria-hidden="true" className={dialogPrimaryButtonBgClassName} />
                    <div className={dialogActionButtonInnerClassName}>
                      <div className="px-0.5 leading-[0px] transition-transform">Continue</div>
                    </div>
                  </button>
                ) : step === 2 ? (
                  <button
                    type="button"
                    className={dialogActionButtonBaseClassName}
                    onClick={() => setStep(3)}
                  >
                    <div aria-hidden="true" className={dialogPrimaryButtonBgClassName} />
                    <div className={dialogActionButtonInnerClassName}>
                      <div className="px-0.5 leading-[0px] transition-transform">Continue</div>
                    </div>
                  </button>
                ) : step === 3 ? (
                  <button
                    type="button"
                    disabled={!canSubmit}
                    className={[
                      dialogActionButtonBaseClassName,
                      !canSubmit ? "cursor-not-allowed opacity-50 pointer-events-none" : "",
                    ].join(" ")}
                    ref={submitButtonRef}
                    onMouseEnter={() => setIsHoveringSubmit(true)}
                    onMouseLeave={() => setIsHoveringSubmit(false)}
                    onFocus={() => setIsHoveringSubmit(true)}
                    onBlur={() => setIsHoveringSubmit(false)}
                    onClick={() => setStep(4)}
                  >
                    <div aria-hidden="true" className={dialogPrimaryButtonBgClassName} />
                    <div className={dialogActionButtonInnerClassName}>
                      <div className="px-0.5 leading-[0px] transition-transform">Continue</div>
                    </div>
                  </button>
                ) : step === 4 ? (
                  <button
                    type="button"
                    className={dialogActionButtonBaseClassName}
                    onClick={() => setStep(5)}
                  >
                    <div aria-hidden="true" className={dialogPrimaryButtonBgClassName} />
                    <div className={dialogActionButtonInnerClassName}>
                      <div className="px-0.5 leading-[0px] transition-transform">DO IT!</div>
                    </div>
                  </button>
                ) : (
                  <button
                    type="button"
                    className={dialogActionButtonBaseClassName}
                    onClick={() => {
                      try {
                        void logDmcaFinish({
                          repo: "https://github.com/Arisayyy/O-Recreation",
                          deviceId,
                          userName: myName,
                          userColor: myColor,
                          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
                        });
                      } catch {
                        // best-effort
                      }
                      // TODO: wire to real DMCA submission endpoint.
                      onOpenChangeAction(false);
                      setStep(1);
                      setPhrase("");
                    }}
                  >
                    <div aria-hidden="true" className={dialogPrimaryButtonBgClassName} />
                    <div className={dialogActionButtonInnerClassName}>
                      <div className="px-0.5 leading-[0px] transition-transform">Finish</div>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

