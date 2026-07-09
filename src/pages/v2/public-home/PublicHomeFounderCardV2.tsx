import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { getFounderPublicProfile } from "@/lib/api";
import {
  cardClassName,
  FOUNDER_CREDENTIALS,
  sectionEyebrowClassName,
} from "./publicHomeV2Shared";

export default function PublicHomeFounderCardV2() {
  const { data: founder } = useQuery({
    queryKey: ["publicProfile", "founder"],
    queryFn: getFounderPublicProfile,
    staleTime: 5 * 60_000,
  });

  return (
    <section className={cardClassName}>
      <p className={sectionEyebrowClassName}>The founder</p>
      <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start">
        <UserAvatar
          name="Hugo Cook"
          avatarUrl={founder?.avatarUrl}
          size="lg"
          alt="Hugo Cook"
        />
        <div className="min-w-0 flex-1">
          <h2 className="font-v2-headline text-lg font-semibold text-v2-on-surface">
            Hugo Cook
          </h2>
          <p className="mt-1 font-v2-body text-sm text-v2-on-surface-variant">
            Founder · Professional racing driver
          </p>
          <p className="mt-3 font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
            Founded by Hugo Cook — British GT with Barwell Motorsport. Apex
            exists because sim prep deserved the same seriousness as real-world
            racing.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {FOUNDER_CREDENTIALS.map((credential) => (
              <li
                key={credential}
                className="rounded-v2-sm border border-v2-outline-variant/15 bg-v2-surface-container px-3 py-1.5 font-v2-body text-xs text-v2-on-surface-variant"
              >
                {credential}
              </li>
            ))}
          </ul>
          <Link
            to="/v2/about"
            className="mt-4 inline-flex items-center gap-1 font-v2-headline text-xs font-bold uppercase tracking-widest text-v2-primary transition-colors hover:text-v2-primary/80"
          >
            Read our story
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
