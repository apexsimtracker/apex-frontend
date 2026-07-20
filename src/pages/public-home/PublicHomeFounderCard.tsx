import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { getFounderPublicProfile } from "@/lib/api";
import {
  cardClassName,
  FOUNDER_CREDENTIALS,
  sectionEyebrowClassName,
} from "./publicHomeShared";

export default function PublicHomeFounderCard() {
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
          <h2 className="font-apex-headline text-lg font-semibold text-apex-on-surface">
            Hugo Cook
          </h2>
          <p className="mt-1 font-apex-body text-sm text-apex-on-surface-variant">
            Founder · Professional racing driver
          </p>
          <p className="mt-3 font-apex-body text-sm leading-relaxed text-apex-on-surface-variant">
            Founded by Hugo Cook — British GT with Barwell Motorsport. Apex
            exists because sim prep deserved the same seriousness as real-world
            racing.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {FOUNDER_CREDENTIALS.map((credential) => (
              <li
                key={credential}
                className="rounded-apex-sm border border-apex-outline-variant/15 bg-apex-surface-container px-3 py-1.5 font-apex-body text-xs text-apex-on-surface-variant"
              >
                {credential}
              </li>
            ))}
          </ul>
          <Link
            to="/about"
            className="mt-4 inline-flex items-center gap-1 font-apex-headline text-xs font-bold uppercase tracking-widest text-apex-primary transition-colors hover:text-apex-primary/80"
          >
            Read our story
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
