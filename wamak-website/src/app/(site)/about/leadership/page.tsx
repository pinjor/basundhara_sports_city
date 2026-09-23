import type { Metadata } from "next";
import { Monogram } from "@/components/brand/Monogram";
import { CTABanner } from "@/components/sections/CTABanner";
import { PageHero } from "@/components/sections/PageHero";
import { DraftBadge } from "@/components/ui/DraftBadge";
import { leadershipMessages } from "@/content/pages";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Leadership",
  description: "Messages from the Chairman, Md. Wazed Ali, and the Managing Director, Khandaker Maruf Hossain, of WAMAK GROUP.",
  alternates: { canonical: "/about/leadership" },
};

const [chairman, md] = site.leadership;

function Message({
  person,
  message,
  id,
}: {
  person: (typeof site.leadership)[number];
  message: { title: string; paragraphs: string[] };
  id: string;
}) {
  return (
    <article aria-labelledby={id} className="grid-site gap-y-8 border-t border-line py-16 md:py-20">
      <div className="col-span-full sm:col-span-2 md:col-span-3 lg:col-span-4">
        <Monogram initials={person.initials} name={person.name} className="max-w-72" />
        <p className="mt-5 font-display text-body-l font-semibold text-navy-900">{person.name}</p>
        <p className="text-small text-ink-600">
          {person.role}, {site.name}
        </p>
      </div>
      <div className="col-span-full md:col-span-5 lg:col-span-7 lg:col-start-6">
        <DraftBadge />
        <h2 id={id} className="mt-6 text-h2">
          {message.title}
        </h2>
        {message.paragraphs.map((p) => (
          <p key={p.slice(0, 24)} className="mt-5 measure text-body-l text-ink-900">
            {p}
          </p>
        ))}
        <p className="mt-8 font-display font-semibold text-navy-900">{person.name}</p>
        <p className="text-small text-ink-600">
          {person.role}, {site.name}, {site.location}
        </p>
      </div>
    </article>
  );
}

export default function LeadershipPage() {
  return (
    <>
      <PageHero
        crumbs={[
          { name: "About", href: "/about" },
          { name: "Leadership", href: "/about/leadership" },
        ]}
        title="Leadership"
        intro={`${site.name} is led by its Chairman, ${chairman.name}, and its Managing Director, ${md.name}.`}
        divider={false}
      />
      <section className="surface-ivory pb-12">
        <div className="container-site">
          <Message person={chairman} message={leadershipMessages.chairman} id="chairman-message" />
          <Message person={md} message={leadershipMessages.md} id="md-message" />
        </div>
      </section>
      <CTABanner />
    </>
  );
}
