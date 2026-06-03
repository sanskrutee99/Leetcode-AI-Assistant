import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ContentApp } from "./ContentApp.jsx";
import contentCss from "./content.css?inline";
import sharedCss from "../styles/shared.css?inline";

const HOST_ID = "leetcode-ai-extension-root";
const STYLE_ID = "leetcode-ai-extension-styles";

/** Prefix selectors so LeetCode global CSS cannot override our UI */
function scopeStyles(css) {
  return css
    .replace(/:host/g, `#${HOST_ID}`)
    .replace(/(^|\})\s*([^@{}][^{}/]*)\{/g, (match, brace, selectors) => {
      const scoped = selectors
        .split(",")
        .map((sel) => {
          const s = sel.trim();
          if (!s || s.startsWith(`#${HOST_ID}`)) return s;
          return `#${HOST_ID} ${s}`;
        })
        .join(", ");
      return `${brace} ${scoped}{`;
    });
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `${scopeStyles(sharedCss)}\n${contentCss}`;
  document.head.appendChild(style);
}

function mount() {
  if (document.getElementById(HOST_ID)) return;

  injectStyles();

  const host = document.createElement("div");
  host.id = HOST_ID;
  document.documentElement.appendChild(host);

  createRoot(host).render(
    <StrictMode>
      <ContentApp />
    </StrictMode>
  );
}

function scheduleMount() {
  if (document.getElementById(HOST_ID)) return;
  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", () => setTimeout(mount, 300), {
      once: true,
    });
  } else {
    setTimeout(mount, 300);
  }
}

export function onExecute() {
  scheduleMount();
}

scheduleMount();

const observer = new MutationObserver(() => {
  if (
    location.pathname.includes("/problems/") &&
    !document.getElementById(HOST_ID)
  ) {
    scheduleMount();
  }
});
observer.observe(document.documentElement, { childList: true, subtree: true });
