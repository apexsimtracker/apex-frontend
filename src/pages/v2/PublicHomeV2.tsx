import PageMeta from "@/components/PageMeta";
import PublicHomeBrowseSectionV2 from "./public-home/PublicHomeBrowseSectionV2";
import PublicHomeFeatureGridV2 from "./public-home/PublicHomeFeatureGridV2";
import PublicHomeFinalCtaV2 from "./public-home/PublicHomeFinalCtaV2";
import PublicHomeFounderCardV2 from "./public-home/PublicHomeFounderCardV2";
import PublicHomeFaqStripV2 from "./public-home/PublicHomeFaqStripV2";
import PublicHomeHeroV2 from "./public-home/PublicHomeHeroV2";
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
      <div className="relative w-full overflow-x-hidden">
        <div
          className="pointer-events-none absolute left-0 top-0 h-[min(42vw,18rem)] w-[min(40vw,17rem)] -translate-x-1/4 translate-y-1/3 rounded-full opacity-[0.16] blur-[72px] sm:opacity-[0.2] lg:h-[22rem] lg:w-[20rem] lg:opacity-[0.24] lg:blur-[88px]"
          style={{
            background:
              "radial-gradient(closest-side, hsl(var(--v2-primary) / 0.14) 0%, hsl(var(--v2-primary) / 0.06) 58%, transparent 75%)",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute right-0 top-0 h-[min(42vw,18rem)] w-[min(40vw,17rem)] translate-x-1/4 translate-y-1/3 rounded-full opacity-[0.16] blur-[72px] sm:opacity-[0.2] lg:h-[22rem] lg:w-[20rem] lg:opacity-[0.24] lg:blur-[88px]"
          style={{
            background:
              "radial-gradient(closest-side, hsl(var(--v2-primary) / 0.14) 0%, hsl(var(--v2-primary) / 0.06) 58%, transparent 75%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col space-y-8 px-6 py-8">
          <PublicHomeHeroV2 />
          <PublicHomeFeatureGridV2 />
          <PublicHomeBrowseSectionV2 />
          <PublicHomeSimsSectionV2 />
          <PublicHomeFounderCardV2 />
          <PublicHomeProSectionV2 />
          <PublicHomeFaqStripV2 />
          <PublicHomeFinalCtaV2 />
        </div>
      </div>
    </>
  );
}
