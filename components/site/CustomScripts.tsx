import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getPublicSiteScripts } from "@/lib/site-settings.functions";

const HEAD_MARK = "data-custom-head-scripts";
const BODY_MARK = "data-custom-body-scripts";

/**
 * Injects admin-configured Header/Footer HTML snippets
 * (e.g. Google Analytics, GTM, Facebook Pixel) into document.head
 * and the end of document.body. Runs once on the client.
 */
export function CustomScripts() {
  const fetchScripts = useServerFn(getPublicSiteScripts);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { head_scripts, body_scripts } = await fetchScripts();
        if (cancelled) return;
        inject(document.head, head_scripts ?? "", HEAD_MARK);
        inject(document.body, body_scripts ?? "", BODY_MARK);
      } catch {
        /* ignore — scripts are optional */
      }
    })();
    return () => { cancelled = true; };
  }, [fetchScripts]);
  return null;
}

function inject(target: HTMLElement, html: string, mark: string) {
  // Clean previously-injected nodes so hot updates don't stack.
  target.querySelectorAll(`[${mark}]`).forEach((n) => n.remove());
  const trimmed = html.trim();
  if (!trimmed) return;
  const tpl = document.createElement("template");
  tpl.innerHTML = trimmed;
  tpl.content.querySelectorAll("script").forEach((oldScript) => {
    const s = document.createElement("script");
    for (const { name, value } of Array.from(oldScript.attributes)) s.setAttribute(name, value);
    s.text = oldScript.textContent ?? "";
    oldScript.replaceWith(s);
  });
  Array.from(tpl.content.childNodes).forEach((node) => {
    if (node.nodeType === 1) (node as HTMLElement).setAttribute(mark, "");
    target.appendChild(node);
  });
}
