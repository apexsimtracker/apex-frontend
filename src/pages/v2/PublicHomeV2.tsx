import PageMeta from "@/components/PageMeta";
import PublicHomeBrowseSectionV2 from "./public-home/PublicHomeBrowseSectionV2";
import PublicHomeFeatureGridV2 from "./public-home/PublicHomeFeatureGridV2";
import PublicHomeFinalCtaV2 from "./public-home/PublicHomeFinalCtaV2";
import PublicHomeFounderSectionV2 from "./public-home/PublicHomeFounderSectionV2";
import PublicHomeHeroV2 from "./public-home/PublicHomeHeroV2";
import PublicHomeInfoGridV2 from "./public-home/PublicHomeInfoGridV2";
import PublicHomeProSectionV2 from "./public-home/PublicHomeProSectionV2";
import PublicHomeSimsSectionV2 from "./public-home/PublicHomeSimsSectionV2";
import {
  PUBLIC_HOME_DESCRIPTION,
  PUBLIC_HOME_TITLE,
  PUBLIC_HOME_V2_PATH,
} from "./public-home/publicHomeV2Shared";

export default function PublicHomeV2() {
  return (
    <>
      <PageMeta
        title={PUBLIC_HOME_TITLE}
        description={PUBLIC_HOME_DESCRIPTION}
        path={PUBLIC_HOME_V2_PATH}
      />
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-6 py-8">
        <div className="relative space-y-10 overflow-hidden">
          <div
            className="pointer-events-none absolute -left-16 top-1/4 size-48 rounded-full opacity-40 blur-[64px] lg:size-64 lg:opacity-50"
            style={{
              background:
                "radial-gradient(closest-side, hsl(var(--v2-primary) / 0.12) 0%, transparent 75%)",
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-16 bottom-1/4 size-48 rounded-full opacity-40 blur-[64px] lg:size-64 lg:opacity-50"
            style={{
              background:
                "radial-gradient(closest-side, hsl(var(--v2-primary) / 0.12) 0%, transparent 75%)",
            }}
            aria-hidden
          />

          <PublicHomeHeroV2 />
          <PublicHomeFeatureGridV2 />
          <PublicHomeBrowseSectionV2 />
          <PublicHomeSimsSectionV2 />
          <PublicHomeFounderSectionV2 />
          <PublicHomeProSectionV2 />
          <PublicHomeInfoGridV2 />
          <PublicHomeFinalCtaV2 />
        </div>
      </div>
    </>
  );
}
