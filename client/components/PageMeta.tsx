import { useEffect } from "react";
import { SITE_ORIGIN } from "@/lib/siteMeta";

type PageMetaProps = {
  title: string;
  description: string;
  path: string;
  /** When false, does not set a canonical link (use for 404 and similar). Default true. */
  setCanonical?: boolean;
};

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Sets document title and SEO meta tags for SPA routes. Restores the previous title on unmount.
 */
export default function PageMeta({
  title,
  description,
  path,
  setCanonical = true,
}: PageMetaProps) {
  useEffect(() => {
    const prevTitle = document.title;
    const canonical = `${SITE_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;

    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:type", "website");
    if (setCanonical) {
      upsertLink("canonical", canonical);
    }

    return () => {
      document.title = prevTitle;
    };
  }, [title, description, path, setCanonical]);

  return null;
}
