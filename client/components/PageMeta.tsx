import { useEffect } from "react";
import {
  SITE_ORIGIN,
  absoluteUrlForOg,
  defaultOgImageAbsolute,
} from "@/lib/siteMeta";

type PageMetaProps = {
  title: string;
  description: string;
  path: string;
  /** When false, does not set a canonical link (use for 404 and similar). Default true. */
  setCanonical?: boolean;
  /** Image for og:image / twitter:image; site default used when omitted. */
  image?: string | null;
  ogType?: "website" | "article";
  twitterCard?: "summary" | "summary_large_image";
  /** When true, sets robots to noindex,nofollow (overrides default index,follow). */
  noindex?: boolean;
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
 *
 * Note: Many social crawlers do not execute JavaScript; link previews may still show shell
 * defaults until prerender or server-injected tags exist.
 */
export default function PageMeta({
  title,
  description,
  path,
  setCanonical = true,
  image,
  ogType = "website",
  twitterCard,
  noindex = false,
}: PageMetaProps) {
  useEffect(() => {
    const prevTitle = document.title;
    const canonical = `${SITE_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
    const imageAbsolute =
      absoluteUrlForOg(image) ?? defaultOgImageAbsolute();
    const card: "summary" | "summary_large_image" =
      twitterCard ??
      (imageAbsolute ? "summary_large_image" : "summary");

    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta(
      "name",
      "robots",
      noindex ? "noindex, nofollow" : "index, follow"
    );

    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:type", ogType);
    upsertMeta("property", "og:image", imageAbsolute);

    upsertMeta("name", "twitter:card", card);
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", imageAbsolute);

    if (setCanonical) {
      upsertLink("canonical", canonical);
    }

    return () => {
      document.title = prevTitle;
    };
  }, [
    title,
    description,
    path,
    setCanonical,
    image,
    ogType,
    twitterCard,
    noindex,
  ]);

  return null;
}
