"use client";

import { useState } from "react";

export function GallerySlideshow({ images }: { images: { src: string; alt: string }[] }) {
  const [index, setIndex] = useState(0);
  if (images.length === 0) return null;
  const current = images[index];
  return (
    <div className="mt-10">
      <div className="relative overflow-hidden rounded-xl border border-edge bg-panel">
        <img src={current.src} alt={current.alt} className="aspect-[16/9] max-h-[34rem] w-full object-contain" />
        {images.length > 1 && <><button type="button" aria-label="Previous image" onClick={() => setIndex((index - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 rounded-full bg-ink/80 px-4 py-2 text-2xl">‹</button><button type="button" aria-label="Next image" onClick={() => setIndex((index + 1) % images.length)} className="absolute right-3 top-1/2 rounded-full bg-ink/80 px-4 py-2 text-2xl">›</button></>}
      </div>
      <div className="mt-3 flex justify-center gap-2">{images.map((image, i) => <button key={image.src} type="button" aria-label={`Show image ${i + 1}`} onClick={() => setIndex(i)} className={`size-2 rounded-full ${i === index ? "bg-lime" : "bg-mist"}`} />)}</div>
    </div>
  );
}
