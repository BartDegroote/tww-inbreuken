"use client";

import type { TekstSegment } from "@/bibliotheek";

type TekstMetOpmaakProps = {
  tekst: string;
  segmenten?: TekstSegment[];
  className?: string;
};

function geldigeSegmenten(
  tekst: string,
  segmenten?: TekstSegment[],
): TekstSegment[] {
  if (
    segmenten &&
    segmenten.length > 0 &&
    segmenten.some(
      (segment) => segment.tekst.length > 0,
    )
  ) {
    return segmenten;
  }

  return tekst
    ? [
        {
          tekst,
        },
      ]
    : [];
}

export default function TekstMetOpmaak({
  tekst,
  segmenten,
  className = "",
}: TekstMetOpmaakProps) {
  const weerTeGevenSegmenten =
    geldigeSegmenten(tekst, segmenten);

  return (
    <span
      className={`whitespace-pre-wrap ${className}`}
    >
      {weerTeGevenSegmenten.map(
        (segment, index) => (
          <span
            key={`${index}-${segment.tekst}`}
            className={
              segment.lijstaccent
                ? "rounded-sm bg-amber-300 px-0.5 font-bold text-slate-950 ring-1 ring-inset ring-amber-500"
                : [
                    segment.vet
                      ? "font-bold"
                      : "font-normal",
                    segment.donkergrijs
                      ? "text-slate-500"
                      : "text-slate-900",
                  ].join(" ")
            }
          >
            {segment.tekst}
          </span>
        ),
      )}
    </span>
  );
}
