import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { LogoLockup } from '../components/Icon';
import { Badge, SectionHeading } from '../components/ui';
import { applyMeta } from '../lib/seo';
import { CITIES } from '../lib/taxonomy';

const VALUES = [
  {
    icon: 'shield-check' as const,
    title: 'We visit before we publish',
    body: 'Someone from our team stands in the room, checks the water tank and the meters, and photographs what is actually there. A listing only gets the Verified mark after that.',
    tone: 'bg-jade-600',
  },
  {
    icon: 'tag' as const,
    title: 'The full cost, up front',
    body: 'Rent, deposit, service charge, water and how electricity is billed — all on the listing. No "small extras" that appear on the day you move in.',
    tone: 'bg-crimson-600',
  },
  {
    icon: 'users' as const,
    title: 'No commission from tenants',
    body: 'We are paid by owners, never by the people looking for a home. So nobody here has a reason to push you into a place that does not suit you.',
    tone: 'bg-marigold-500',
  },
  {
    icon: 'clock' as const,
    title: 'Listings that expire',
    body: 'Every listing ages out unless the owner renews it. You should not be calling about a flat that went six months ago.',
    tone: 'bg-navy-700',
  },
];

export function About() {
  useEffect(() => {
    applyMeta({
      title: 'About us',
      description: 'SK Real Estate Pvt. Ltd. — a Kathmandu Valley property company that visits every listing, publishes the full cost and takes no commission from tenants.',
    });
  }, []);

  return (
    <div>
      <section className="bg-navy-900 text-white relative overflow-hidden">
        <div className="absolute -top-32 -right-24 w-[30rem] h-[30rem] rounded-full bg-crimson-600/20 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 py-16 sm:py-24">
          <div className="inline-flex bg-white rounded-2xl px-5 py-4 mb-6 shadow-lift">
            <LogoLockup className="h-14" />
          </div>
          <div>
            <Badge tone="bg-white/12 text-marigold-200 border border-white/15">Since 2020</Badge>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mt-5 leading-tight">
            Renting in Kathmandu should not be this hard
          </h1>
          <p className="mt-6 text-[17px] text-navy-100 leading-relaxed max-w-2xl">
            SK Real Estate Pvt. Ltd. started because finding a flat here meant three weeks of
            phone calls, listings that went months ago, and a commission demand at the end of
            it. We built the site we wished existed.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
        <SectionHeading title="How we work" sub="Four rules we do not bend on." />
        <div className="grid gap-5 sm:grid-cols-2">
          {VALUES.map((v) => (
            <div key={v.title} className="card p-6">
              <span className={`w-11 h-11 rounded-xl grid place-items-center text-white mb-4 ${v.tone}`}>
                <Icon name={v.icon} className="w-[22px] h-[22px]" />
              </span>
              <h3 className="font-bold text-[17px] mb-2">{v.title}</h3>
              <p className="text-[14.5px] text-brick-800 leading-relaxed">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-brick-100 border-y border-brick-200 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading title="Where we cover" sub="The valley, properly — not just the central few areas." />
          <div className="grid gap-5 sm:grid-cols-3">
            {CITIES.map((c) => (
              <div key={c.name} className="card p-5">
                <div className="flex items-baseline gap-2 mb-3">
                  <h3 className="font-bold text-lg">{c.name}</h3>
                  <span className="text-[13px] text-brick-600" lang="ne">{c.nameNe}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {c.areas.map((a) => (
                    <Link
                      key={a}
                      to={`/listings?areas=${encodeURIComponent(a)}`}
                      className="text-[12.5px] px-2 py-1 rounded-md bg-brick-100 hover:bg-navy-900 hover:text-white transition-colors"
                    >
                      {a}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-16 sm:py-20 text-center">
        <h2 className="text-3xl font-bold">Looking to rent out your place?</h2>
        <p className="text-brick-800 mt-3 text-[16px] max-w-xl mx-auto leading-relaxed">
          Post it yourself in under three minutes, or call us and we will come, photograph it
          and write the listing for you.
        </p>
        <div className="flex flex-wrap gap-3 justify-center mt-7">
          <Link to="/post" className="btn-primary btn-lg">
            <Icon name="plus" className="w-4.5 h-4.5" strokeWidth={2.4} /> Post a property
          </Link>
          <Link to="/contact" className="btn-outline btn-lg">Talk to our team</Link>
        </div>
      </section>
    </div>
  );
}
