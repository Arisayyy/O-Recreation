"use client";

import React, { useId, useMemo } from "react";
import { cn } from "@/lib/utils";

type MarbleCssVars = React.CSSProperties & {
  "--color-0"?: string;
  "--color-1"?: string;
  "--color-2"?: string;
};

function getNumber(name: string) {
  return Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function getUnit(number: number, range: number, index?: number) {
  const value = number % range;
  if (index && Math.floor((number / Math.pow(10, index)) % 10) % 2 === 0) {
    return -value;
  }
  return value;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const ELEMENTS = 3;
const SIZE = 80;

export function AvatarMarble({
  size = 80,
  id,
  name = "",
  // Default palette uses Orchid's theme variables (see `app/globals.css`).
  // Include CSS var fallbacks so the SVG never renders "empty".
  colors = ["var(--chart-3, #3b82f6)", "var(--chart-4, #f59e0b)", "var(--chart-5, #ef4444)"],
  className,
  showInitials = true,
}: {
  size?: number;
  /** Seed string used for the pattern (recommended: user ID). */
  id?: string;
  name?: string;
  colors?: string[];
  className?: string;
  showInitials?: boolean;
}) {
  // Deterministic seed: prefer ID (requested), otherwise fall back to name.
  const seed = (id && id.length > 0 ? id : name && name.length > 0 ? name : "Anonymous") as string;
  const numFromSeed = useMemo(() => getNumber(seed), [seed]);

  const properties = useMemo(() => {
    return Array.from({ length: ELEMENTS }, (_, i) => ({
      colorIndex: (numFromSeed + i) % colors.length,
      translateX: getUnit(numFromSeed * (i + 1), SIZE / 10, 1),
      translateY: getUnit(numFromSeed * (i + 1), SIZE / 10, 2),
      scale: 1.2 + getUnit(numFromSeed * (i + 1), SIZE / 20) / 10,
      rotate: getUnit(numFromSeed * (i + 1), 360, 1),
    }));
  }, [colors.length, numFromSeed]);

  const uid = useId().replace(/:/g, "");
  const maskId = `mask__marble_${uid}`;
  const filterId = `filter__marble_${uid}`;

  const initials = useMemo(() => {
    if (!name) return "";
    return getInitials(name);
  }, [name]);

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      data-testid="avatar-marble"
      className={cn("rounded-full", className)}
      style={
        {
          "--color-0": colors[properties[0].colorIndex],
          "--color-1": colors[properties[1].colorIndex],
          "--color-2": colors[properties[2].colorIndex],
        } as MarbleCssVars
      }
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={SIZE} height={SIZE}>
          <rect width={SIZE} height={SIZE} fill="white" />
        </mask>
        <filter id={filterId} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="7" result="effect1_foregroundBlur" />
        </filter>
      </defs>

      <g mask={`url(#${maskId})`}>
        {/* Background */}
        <rect width={SIZE} height={SIZE} fill="var(--color-0)" />

        {/* First overlay path */}
        <path
          filter={`url(#${filterId})`}
          style={{ mixBlendMode: "overlay", fill: "var(--color-1)" }}
          d="M32.414 59.35L50.376 70.5H72.5v-71H33.728L26.5 13.381l19.057 27.08L32.414 59.35z"
          transform={`translate(${properties[1].translateX} ${properties[1].translateY}) rotate(${properties[1].rotate} ${
            SIZE / 2
          } ${SIZE / 2}) scale(${properties[2].scale})`}
        />

        {/* Second overlay path */}
        <path
          filter={`url(#${filterId})`}
          style={{ fill: "var(--color-2)" }}
          d="M22.216 24L0 46.75l14.108 38.129L78 86l-3.081-59.276-22.378 4.005 12.972 20.186-23.35 27.395L22.215 24z"
          transform={`translate(${properties[2].translateX} ${properties[2].translateY}) rotate(${properties[2].rotate} ${
            SIZE / 2
          } ${SIZE / 2}) scale(${properties[2].scale})`}
        />

        {name && showInitials ? (
          <>
            {/* Semi-transparent backdrop for initials */}
            <rect
              width={SIZE}
              height={SIZE}
              fill="rgba(0, 0, 0, 0.25)"
              style={{ backdropFilter: "blur(2px)" }}
            />

            {/* Initials text */}
            <text
              x="50%"
              y="50%"
              dominantBaseline="central"
              textAnchor="middle"
              style={{
                fill: "white",
                fontFamily: "system-ui, -apple-system, sans-serif",
                fontWeight: 600,
                fontSize: `${SIZE * 0.35}px`,
              }}
            >
              {initials}
            </text>
          </>
        ) : null}
      </g>
    </svg>
  );
}

