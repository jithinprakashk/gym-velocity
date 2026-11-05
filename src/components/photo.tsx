import Image from "next/image";

/** Real gym photos. Source files are small, so they are shown at modest sizes and never upscaled past their frame. */
export const photos = {
  wide: { src: "/images/gym/interior-wide-lights.jpg", w: 408, h: 510, alt: "Velocity gym floor with lime turf, benches, racks and glowing ceiling lights" },
  turf: { src: "/images/gym/interior-turf-lane.jpg", w: 407, h: 510, alt: "Central turf lane with a sled and dumbbells, machines on both sides" },
  reception: { src: "/images/gym/interior-reception.jpg", w: 408, h: 510, alt: "Reception desk and open training floor" },
  machines: { src: "/images/equipment/plate-loaded-machines.jpg", w: 638, h: 510, alt: "Plate-loaded machines, weight plates and large windows" },
  exterior: { src: "/images/facilities/exterior-night-entrance.jpg", w: 637, h: 510, alt: "Velocity entrance at night with the lit VELOCITY sign and landscaped walkway" },
} as const;

export function Photo({
  photo,
  className = "",
  sizes = "(min-width: 1024px) 33vw, 100vw",
  priority = false,
}: {
  photo: (typeof photos)[keyof typeof photos];
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <Image src={photo.src} alt={photo.alt} width={photo.w} height={photo.h} sizes={sizes} priority={priority} unoptimized className={className} />
  );
}
