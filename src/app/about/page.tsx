import Link from 'next/link';
import { ArrowRight, Sparkles, Layers, ShieldCheck, HeartHandshake, Compass } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="container-page py-12 lg:py-20 max-w-4xl">
      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <p className="eyebrow">The POSTERraxx Ethos</p>
        <h1 className="text-3xl sm:text-5xl font-display mt-3 mb-6 leading-tight">
          Art that changes how your home feels.
        </h1>
        <p className="text-base text-ink/70 leading-relaxed font-sans">
          We started POSTERraxx with a straightforward belief: great walls shouldn’t require expensive gallery art auctions or flimsy rolled mass prints.
        </p>
      </div>

      {/* Story Sections */}
      <div className="space-y-16">
        {/* Section 1: The Craft */}
        <section className="border-t border-line pt-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-4">
              <span className="text-xs font-mono text-accent">01 / ARCHIVAL CRAFT</span>
              <h2 className="text-2xl font-display mt-1 text-ink">Museum Grade, Made to Last</h2>
            </div>
            <div className="md:col-span-8 space-y-4 text-sm text-ink/70 leading-relaxed">
              <p>
                Every single poster is printed on-demand in our Bangalore workshop using 12-color archival pigment inks. Unlike conventional commercial dye printing that fades in months, pigment giclée bonds into the cotton fiber matrix, rated for 100+ years of vibrant color retention.
              </p>
              <p>
                We stock three calibrated paper stocks: our signature 300 GSM ultra-matte, high-density luster glossy, and a tactile cold-press watercolor textured cotton paper.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Handcrafted Frames */}
        <section className="border-t border-line pt-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-4">
              <span className="text-xs font-mono text-accent">02 / SUSTAINABLE FRAMING</span>
              <h2 className="text-2xl font-display mt-1 text-ink">Real Wood & Precision Fit</h2>
            </div>
            <div className="md:col-span-8 space-y-4 text-sm text-ink/70 leading-relaxed">
              <p>
                Our frames are milled from sustainably harvested solid timber — never synthetic hollow plastic moldings. We fit each piece with optically clear, shatter-resistant acrylic glass that provides 90% UV shielding while protecting your art during courier transit.
              </p>
              <p>
                Each framed print arrives fully assembled with stainless steel pre-attached hanging hardware, ready to hang straight out of the box.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Pillars Grid */}
        <section className="border-t border-line pt-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="border border-line rounded-sm p-6 bg-white">
              <Layers size={22} className="text-accent mb-3" />
              <h3 className="text-base font-display text-ink mb-1.5">300 GSM Stocks</h3>
              <p className="text-xs text-ink/60 leading-relaxed">
                Heavyweight cotton substrate with zero show-through and pure colour gamut accuracy.
              </p>
            </div>

            <div className="border border-line rounded-sm p-6 bg-white">
              <ShieldCheck size={22} className="text-accent mb-3" />
              <h3 className="text-base font-display text-ink mb-1.5">Crash-Proof Transit</h3>
              <p className="text-xs text-ink/60 leading-relaxed">
                Multi-layered corrugated reinforced mailers with corner protectors to ensure zero transit creases.
              </p>
            </div>

            <div className="border border-line rounded-sm p-6 bg-white">
              <Compass size={22} className="text-accent mb-3" />
              <h3 className="text-base font-display text-ink mb-1.5">Curated Collections</h3>
              <p className="text-xs text-ink/60 leading-relaxed">
                Spanning Japanese Anime, Cinema Noir, F1 Racing, Bauhaus Minimalist, and bespoke custom prints.
              </p>
            </div>
          </div>
        </section>

        {/* Call to action */}
        <section className="bg-ink text-paper rounded-sm p-8 sm:p-12 text-center mt-12">
          <p className="eyebrow text-accent">Ready to upgrade your space?</p>
          <h2 className="text-2xl sm:text-3xl font-display mt-2 mb-6">
            Discover prints curated for your aesthetic.
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/shop" className="btn btn-accent text-xs gap-2">
              Explore Catalog <ArrowRight size={14} />
            </Link>
            <Link href="/custom" className="btn btn-ghost text-xs text-paper border-paper/30 hover:border-paper">
              Create Custom Print
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
