/* eslint-disable react/no-danger */
"use client";
import React from "react";
import { useRouter } from "next/navigation";

const __css = `*,*::before,*::after{box-sizing:border-box;border-width:0;border-style:solid;border-color:currentColor;}


.x1 {
  flex: 0 0 auto;
  flex-shrink: 0;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  line-height: 24px;
  padding-bottom: 20px;
  padding-left: 24px;
  padding-right: 24px;
  padding-top: 20px;
  z-index: 50;
}

.x10 {
  display: block;
  fill: rgb(29, 33, 28);
  height: 16px;
  overflow: hidden;
  overflow-x: hidden;
  overflow-y: hidden;
  vertical-align: middle;
  width: 16px;
}

.x11 {
  fill: rgb(29, 33, 28);
}

.x12 {
  align-items: center;
  color: rgb(96, 101, 95);
  column-gap: 6px;
  display: flex;
  font-size: 14px;
  font-weight: 500;
  gap: 6px;
  line-height: 20px;
  place-items: center normal;
  position: relative;
  row-gap: 6px;
  transition-duration: 0.15s;
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.x13 {
  display: block;
  fill: rgb(96, 101, 95);
  height: 16px;
  overflow: hidden;
  overflow-x: hidden;
  overflow-y: hidden;
  vertical-align: middle;
  width: 16px;
}

.x14 {
  fill: rgb(96, 101, 95);
}

.x15 {
  align-items: center;
  column-gap: 8px;
  display: flex;
  flex: 1 1 0%;
  flex-basis: 0%;
  flex-grow: 1;
  gap: 8px;
  justify-content: flex-end;
  place-content: normal flex-end;
  place-items: center normal;
  row-gap: 8px;
}

.x16 {
  display: flex;
}

.x17 {
  align-items: center;
  background-color: rgba(0, 0, 0, 0);
  border-bottom-width: 0px;
  border-left-width: 0px;
  border-right-width: 0px;
  border-top-width: 0px;
  column-gap: 4px;
  display: flex;
  gap: 4px;
  border-radius: 3.35544e+07px;
  overflow: hidden;
  padding-bottom: 0px;
  padding-left: 0px;
  padding-right: 0px;
  padding-top: 0px;
  place-items: center normal;
  row-gap: 4px;
}

.x18 {
  align-items: center;
  color: rgb(29, 33, 28);
  display: flex;
  font-size: 14px;
  line-height: 21px;
  place-items: center normal;
  position: relative;
  z-index: 0;
}

.x19 {
  background-color: rgb(231, 233, 231);
  border-bottom-left-radius: 3.35544e+07px;
  border-bottom-right-radius: 3.35544e+07px;
  border-top-left-radius: 3.35544e+07px;
  border-top-right-radius: 3.35544e+07px;
  bottom: 4px;
  height: 32px;
  left: 4px;
  opacity: 0;
  position: absolute;
  right: 4px;
  top: 4px;
  transition-duration: 0.15s;
  transition-property: transform, translate, scale, rotate;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  width: 32px;
}

.x2 {
  align-items: center;
  display: flex;
  justify-content: space-between;
  place-content: normal space-between;
  place-items: center normal;
}

.x20 {
  align-items: center;
  column-gap: 8px;
  display: flex;
  gap: 8px;
  padding-bottom: 4px;
  padding-left: 4px;
  padding-right: 4px;
  padding-top: 4px;
  place-items: center normal;
  position: relative;
  row-gap: 8px;
  z-index: 2;
}

.x21 {
  align-items: center;
  background-color: rgb(255, 255, 255);
  border-bottom-color: rgb(223, 226, 223);
  border-bottom-left-radius: 3.35544e+07px;
  border-bottom-right-radius: 3.35544e+07px;
  border-bottom-style: solid;
  border-bottom-width: 1px;
  border-left-color: rgb(223, 226, 223);
  border-left-style: solid;
  border-left-width: 1px;
  border-right-color: rgb(223, 226, 223);
  border-right-style: solid;
  border-right-width: 1px;
  border-top-color: rgb(223, 226, 223);
  border-top-left-radius: 3.35544e+07px;
  border-top-right-radius: 3.35544e+07px;
  border-top-style: solid;
  border-top-width: 1px;
  display: flex;
  font-size: 10px;
  font-weight: 600;
  justify-content: center;
  line-height: 15px;
  overflow: hidden;
  overflow-x: hidden;
  overflow-y: hidden;
  place-content: normal center;
  place-items: center normal;
}

.x22 {
  align-items: center;
  display: grid;
  grid-template-columns: 32px;
  grid-template-rows: 32px;
  justify-items: center;
  place-items: center;
}

.x3 {
  align-items: flex-start;
  display: flex;
  flex: 1 1 0%;
  flex-basis: 0%;
  flex-grow: 1;
  place-items: flex-start normal;
}

.x4 {
  cursor: pointer;
  display: block;
  text-decoration: none;
  text-decoration-line: none;
}

.x5 {
  display: block;
  fill: none;
  height: 32px;
  overflow: hidden;
  overflow-x: hidden;
  overflow-y: hidden;
  vertical-align: middle;
  width: 32px;
}

.x6 {
  align-items: center;
  column-gap: 2px;
  display: flex;
  gap: 2px;
  justify-content: center;
  place-content: normal center;
  place-items: center normal;
  row-gap: 2px;
}

.x7 {
  cursor: pointer;
  display: block;
  padding-bottom: 6px;
  padding-left: 12px;
  padding-right: 12px;
  padding-top: 6px;
  position: relative;
  text-decoration: none;
  text-decoration-line: none;
}

.x8 {
  background-color: rgb(239, 241, 239);
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  bottom: 0px;
  height: 32px;
  left: 0px;
  position: absolute;
  right: 0px;
  top: 0px;
  width: 85.5469px;
}

.x9 {
  align-items: center;
  color: rgb(29, 33, 28);
  column-gap: 6px;
  display: flex;
  font-size: 14px;
  font-weight: 500;
  gap: 6px;
  line-height: 20px;
  place-items: center normal;
  position: relative;
  row-gap: 6px;
  transition-duration: 0.15s;
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
`;
const __html = `<nav class="x1">
      <div class="x2">
        <div class="x3">
          <a href="/mail/home" class="x4">
            <svg width="33" height="32" viewBox="0 0 33 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="x5">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M11.482 4.9941C11.482 9.92807 15.083 13.1935 16.1491 14.0522C16.3238 14.1928 16.5623 14.1928 16.737 14.0522C17.8031 13.1936 21.4042 9.92836 21.4042 4.9944C21.4042 1.56245 19.7713 -1.73564e-06 16.443 0C13.1147 -1.59101e-06 11.482 1.56215 11.482 4.9941Z" fill="currentColor"></path>
              <path fill-rule="evenodd" clip-rule="evenodd" d="M26.2426 8.53282C21.5811 10.0575 19.6088 14.5141 19.1271 15.8002C19.0481 16.0109 19.1218 16.2393 19.3087 16.363C20.4493 17.1184 24.647 19.557 29.3084 18.0323C32.5508 16.9718 33.5224 14.9257 32.4939 11.7392C31.4654 8.55276 29.485 7.47229 26.2426 8.53282Z" fill="currentColor"></path>
              <path fill-rule="evenodd" clip-rule="evenodd" d="M27.4606 23.758C24.5797 19.7663 19.7597 19.2552 18.3958 19.1914C18.1724 19.1809 17.9794 19.3221 17.9202 19.5392C17.559 20.8647 16.5523 25.637 19.4332 29.6287C21.4371 32.4052 23.6704 32.7031 26.3631 30.7338C29.0557 28.7644 29.4645 26.5345 27.4606 23.758Z" fill="currentColor"></path>
              <path fill-rule="evenodd" clip-rule="evenodd" d="M13.4528 29.6289C16.3337 25.6373 15.3271 20.8648 14.966 19.5393C14.9068 19.3221 14.7138 19.1809 14.4903 19.1914C13.1265 19.2552 8.30664 19.7661 5.42571 23.7577C3.4218 26.5342 3.83048 28.7644 6.52313 30.7338C9.21577 32.7031 11.4489 32.4054 13.4528 29.6289Z" fill="currentColor"></path>
              <path fill-rule="evenodd" clip-rule="evenodd" d="M3.57743 18.0322C8.23887 19.5569 12.4367 17.1184 13.5774 16.3631C13.7643 16.2393 13.838 16.0109 13.7591 15.8002C13.2774 14.5142 11.3053 10.0576 6.64384 8.53291C3.40145 7.47238 1.42072 8.55281 0.392221 11.7393C-0.63628 14.9257 0.335035 16.9717 3.57743 18.0322Z" fill="currentColor"></path>
            </svg>
          </a>
        </div>
        <div class="x6">
          <a href="/" class="x7">
            <div class="x8"></div>
            <span class="x9">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" class="x10">
                <path d="M8.543 2.232a.75.75 0 0 0-1.085 0l-5.25 5.5A.75.75 0 0 0 2.75 9H4v4a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1a1 1 0 1 1 2 0v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1V9h1.25a.75.75 0 0 0 .543-1.268l-5.25-5.5Z" class="x11"></path>
              </svg>
    Home
            </span>
          </a>
          <a href="/issues" class="x7">
            <span class="x12">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" class="x13">
                <path fill-rule="evenodd" d="M4.784 3A2.25 2.25 0 0 0 2.68 4.449L1.147 8.475A2.25 2.25 0 0 0 1 9.276v1.474A2.25 2.25 0 0 0 3.25 13h9.5A2.25 2.25 0 0 0 15 10.75V9.276c0-.274-.05-.545-.147-.801l-1.534-4.026A2.25 2.25 0 0 0 11.216 3H4.784Zm-.701 1.983a.75.75 0 0 1 .7-.483h6.433a.75.75 0 0 1 .701.483L13.447 9h-2.412a1 1 0 0 0-.832.445l-.406.61a1 1 0 0 1-.832.445h-1.93a1 1 0 0 1-.832-.445l-.406-.61A1 1 0 0 0 4.965 9H2.553l1.53-4.017Z" clip-rule="evenodd" class="x14"></path>
              </svg>
    Issues
            </span>
          </a>
          <a href="/mail/sent" class="x7">
            <span class="x12">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" class="x13">
                <path d="M2.87 2.298a.75.75 0 0 0-.812 1.021L3.39 6.624a1 1 0 0 0 .928.626H8.25a.75.75 0 0 1 0 1.5H4.318a1 1 0 0 0-.927.626l-1.333 3.305a.75.75 0 0 0 .811 1.022 24.89 24.89 0 0 0 11.668-5.115.75.75 0 0 0 0-1.175A24.89 24.89 0 0 0 2.869 2.298Z" class="x14"></path>
              </svg>
    Sent
            </span>
          </a>
          <a href="/mail/completed" class="x7">
            <span class="x12">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" class="x13">
                <path fill-rule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm3.844-8.791a.75.75 0 0 0-1.188-.918l-3.7 4.79-1.649-1.833a.75.75 0 1 0-1.114 1.004l2.25 2.5a.75.75 0 0 0 1.15-.043l4.25-5.5Z" clip-rule="evenodd" class="x14"></path>
              </svg>
    Done
            </span>
          </a>
        </div>
        <div class="x15">
          <div class="x16">
            <button type="button" aria-haspopup="menu" aria-expanded="false" id="_r_2_" class="x17">
              <div class="x18">
                <div class="x19"></div>
                <div class="x20">
                  <div class="x21">
                    <span class="x22">A</span>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </nav>`;

export function Navbar() {
  const router = useRouter();

  return (
    <>
      <style>{__css}</style>
      {/* display:contents avoids introducing a wrapper box in most layouts */}
      <div
        style={{ display: "contents" }}
        onClickCapture={(e) => {
          // Convert internal <a href="/..."> clicks into client-side transitions,
          // even though the navbar is rendered via dangerouslySetInnerHTML.
          const target = e.target as Element | null;
          const anchor = target?.closest("a");
          if (!anchor) return;
          if (anchor.getAttribute("target") === "_blank") return;
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

          const href = anchor.getAttribute("href");
          if (!href || !href.startsWith("/")) return;

          e.preventDefault();
          router.push(href);
        }}
        dangerouslySetInnerHTML={{ __html }}
      />
    </>
  );
}
