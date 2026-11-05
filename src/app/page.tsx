import Link from "next/link";
import {
  Accessibility, ArrowRight, Bath, Building2, Car, Clock, Dumbbell, MapPin, MessageCircle, Phone, Route,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Photo, photos } from "@/components/photo";
import { Wordmark } from "@/components/wordmark";
import { GallerySlideshow } from "@/components/gallery-slideshow";
import { createClient } from "@/lib/supabase/server";
import { getContactInfo, getPublicPlans } from "@/lib/public-data";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic"; // plans and contact details are admin-editable

const facilities = [
  { title: "Upper-body equipment", text: "Stations and machines for chest, back, shoulders and arms." },
  { title: "Lower-body equipment", text: "Equipment for legs, glutes and calves." },
  { title: "Strength-training machines", text: "Plate-loaded machines for controlled, steady progress.", photo: photos.machines },
  { title: "Free weights and dumbbells", text: "Dumbbells, plates and benches, plus a turf lane for sled work.", photo: photos.turf },
];

const access = [
  { icon: Building2, title: "Ground-floor gym", text: "Everything is on one level. No stairs between you and your workout." },
  { icon: Accessibility, title: "Wheelchair-accessible ramp", text: "A ramp at the entrance gives step-free access." },
  { icon: Car, title: "Ample parking", text: "Space to park close to the entrance." },
  { icon: Route, title: "Near the main road", text: "Easy to reach and easy to find." },
  { icon: Bath, title: "Separate restrooms", text: "Separate male and female restrooms." },
];

const gallery = [photos.exterior, photos.wide, photos.turf, photos.machines, photos.reception];

export default async function HomePage() {
  const supabase = await createClient();
  const [contact, plans, { data: galleryImages }] = await Promise.all([
    getContactInfo(),
    getPublicPlans(),
    supabase.from("gallery_images").select("storage_path, title").eq("active", true).order("sort_order").order("created_at", { ascending: false }),
  ]);
  const uploadedGallery = (galleryImages ?? []).map((image) => ({
    src: supabase.storage.from("gallery").getPublicUrl(image.storage_path).data.publicUrl,
    alt: image.title || "Velocity gym gallery",
  }));

  return (
    <>
      <SiteHeader />
      <main id="main">
        {/* Hero */}
        <section className="border-b border-edge">
          <div className="container-x grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.15fr_1fr] lg:py-20">
            <div>
              <h1 className="text-[3.4rem] leading-[0.9] sm:text-8xl lg:text-9xl">
                Build strength.
                <br />
                Own your pace.
              </h1>
              <p className="mt-6 max-w-md text-lg text-mist">
                Your fitness journey starts here. Train better, feel stronger and achieve your goals at Velocity.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/#contact" className="btn btn-primary">Join Now</Link>
                <Link href="/#facilities" className="btn btn-ghost">Explore Facilities</Link>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <Photo photo={photos.wide} priority sizes="(min-width: 1024px) 40vw, 90vw" className="aspect-[4/5] w-full rounded-xl border border-edge object-cover" />
              <Photo photo={photos.turf} sizes="30vw" className="absolute -bottom-6 -left-3 hidden aspect-[4/5] w-40 rounded-lg border-4 border-ink object-cover sm:block lg:-left-10 lg:w-48" />
            </div>
          </div>
        </section>

        {/* About */}
        <section id="about" className="container-x grid gap-10 py-16 sm:py-20 lg:grid-cols-2 lg:items-center">
          <Photo photo={photos.exterior} className="w-full rounded-xl border border-edge object-cover" />
          <div>
            <h2 className="text-5xl sm:text-6xl">A gym built for everyone</h2>
            <p className="mt-5 max-w-prose text-lg text-mist">
              Velocity is a modern unisex gym with equipment for upper-body and lower-body workouts, a spacious training floor and free weights.
              Come as you are, train at your own pace and build strength at your own speed.
            </p>
            <p className="mt-4 max-w-prose text-mist">Closed on Sundays and gym holidays.</p>
          </div>
        </section>

        {/* Facilities */}
        <section id="facilities" className="border-y border-edge bg-panel py-16 sm:py-20">
          <div className="container-x">
            <h2 className="text-5xl sm:text-6xl">Equipment and facilities</h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {facilities.map((f) => (
                <article key={f.title} className="overflow-hidden rounded-xl border border-edge bg-ink">
                  {"photo" in f && f.photo && (
                    <Photo photo={f.photo} sizes="(min-width: 640px) 45vw, 100vw" className="aspect-[16/10] w-full object-cover" />
                  )}
                  <div className="p-6">
                    <Dumbbell aria-hidden className="size-6 text-lime" />
                    <h3 className="mt-3 text-3xl">{f.title}</h3>
                    <p className="mt-2 text-mist">{f.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Accessibility and convenience */}
        <section id="access" className="container-x py-16 sm:py-20">
          <h2 className="max-w-3xl text-5xl sm:text-7xl">Ground floor. Ramp access. Room to park.</h2>
          <p className="mt-5 max-w-prose text-lg text-mist">
            Getting in should never be the hard part of a workout. Velocity is designed so more people can train comfortably.
          </p>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {access.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-xl border border-edge bg-panel p-6">
                <Icon aria-hidden className="size-8 text-lime" />
                <h3 className="mt-4 text-2xl">{title}</h3>
                <p className="mt-2 text-mist">{text}</p>
              </li>
            ))}
            <li className="grid place-items-center rounded-xl border border-dashed border-edge p-6 text-center text-sm text-mist">
              Photos of the ramp and parking area coming soon
            </li>
          </ul>
        </section>

        {/* Membership */}
        <section id="membership" className="border-y border-edge bg-panel py-16 sm:py-20">
          <div className="container-x">
            <h2 className="text-5xl sm:text-6xl">Membership</h2>
            {plans.length === 0 ? (
              <p className="mt-5 max-w-prose text-lg text-mist">
                Membership options and current rates are available at the front desk. Get in touch and we will help you pick the right one.
              </p>
            ) : (
              <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {plans.map((p) => (
                  <li key={p.id} className="flex flex-col rounded-xl border border-edge bg-ink p-6">
                    <h3 className="text-3xl">{p.name}</h3>
                    <p className="mt-3 font-display text-5xl font-extrabold text-lime">{formatINR(Number(p.default_fee))}</p>
                    <p className="mt-3 text-mist">
                      {p.model === "calendar"
                        ? `Valid for ${p.duration_months} ${p.duration_months === 1 ? "month" : "months"} from your start date.`
                        : `${p.total_days} gym days. Only the days you attend are counted.`}
                    </p>
                    {p.description && <p className="mt-2 text-mist">{p.description}</p>}
                  </li>
                ))}
              </ul>
            )}
            <Link href="/#contact" className="btn btn-primary mt-8">
              Join Now <ArrowRight aria-hidden className="size-5" />
            </Link>
          </div>
        </section>

        {/* Gallery */}
        <section id="gallery" className="container-x py-16 sm:py-20">
          <h2 className="text-5xl sm:text-6xl">Gallery</h2>
          <GallerySlideshow images={uploadedGallery} />
          <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {gallery.map((p, i) => (
              <li key={p.src} className={i === 0 ? "col-span-2 lg:col-span-1" : ""}>
                <Photo photo={p} sizes="(min-width: 1024px) 33vw, 50vw" className="aspect-[4/5] h-full w-full rounded-lg border border-edge object-cover" />
              </li>
            ))}
          </ul>
        </section>

        {/* Contact */}
        <section id="contact" className="border-t border-edge bg-panel py-16 sm:py-20">
          <div className="container-x grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-5xl sm:text-6xl">Visit Velocity</h2>
              <p className="mt-4 max-w-prose text-lg text-mist">Walk in, call or message us to join. New memberships are set up by our staff.</p>
            </div>
            <ul className="space-y-5">
              <ContactRow icon={MapPin} label="Address" value={contact.address} placeholder="Address coming soon" href={contact.maps_url} linkText="Open in Google Maps" />
              <ContactRow icon={Phone} label="Phone" value={contact.phone} placeholder="Phone number coming soon" href={contact.phone ? `tel:${contact.phone.replace(/\s/g, "")}` : ""} />
              <ContactRow icon={MessageCircle} label="WhatsApp" value={contact.whatsapp} placeholder="WhatsApp number coming soon" href={contact.whatsapp ? `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}` : ""} linkText="Message on WhatsApp" />
              <ContactRow icon={Clock} label="Hours" value={contact.hours} placeholder="Hours coming soon. Closed on Sundays and gym holidays." />
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t border-edge py-10">
        <div className="container-x flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <Wordmark />
          <p className="text-sm text-mist">Build strength. Own your pace.</p>
        </div>
      </footer>
    </>
  );
}

function ContactRow({
  icon: Icon, label, value, placeholder, href, linkText,
}: {
  icon: typeof MapPin; label: string; value: string; placeholder: string; href?: string; linkText?: string;
}) {
  return (
    <li className="flex gap-4">
      <Icon aria-hidden className="mt-1 size-6 shrink-0 text-lime" />
      <div>
        <p className="text-sm font-medium text-mist">{label}</p>
        <p className={value ? "text-lg" : "text-lg text-mist"}>{value || placeholder}</p>
        {href && value !== undefined && (linkText || value) && (
          <a href={href} className="text-sm text-lime underline underline-offset-4">{linkText ?? "Call now"}</a>
        )}
      </div>
    </li>
  );
}
