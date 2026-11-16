import Image from "next/image";

type GfxPanelProps = {
  src: string;
  alt: string;
  eyebrow: string;
  title: string;
  text: string;
  reverse?: boolean;
};

export function GfxPanel({
  src,
  alt,
  eyebrow,
  title,
  text,
  reverse = false,
}: GfxPanelProps) {
  return (
    <section
      className={reverse ? "gfx-panel gfx-panel--reverse" : "gfx-panel"}
    >
      <div className="gfx-panel__media">
        <Image
          src={src}
          alt={alt}
          width={1280}
          height={720}
          sizes="(max-width: 860px) 100vw, 56vw"
          className="gfx-panel__image"
        />
      </div>
      <div className="gfx-panel__copy">
        <p className="section__eyebrow">{eyebrow}</p>
        <h2 className="section__title">{title}</h2>
        <p className="section__lede gfx-panel__lede">{text}</p>
      </div>
    </section>
  );
}
