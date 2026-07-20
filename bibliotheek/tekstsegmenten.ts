import type { TekstSegment } from "./types";

export function leesTekstSegmenten(
  waarde: unknown,
): TekstSegment[] {
  if (!Array.isArray(waarde)) {
    return [];
  }

  const resultaat: TekstSegment[] = [];

  for (const item of waarde) {
    if (
      !item ||
      typeof item !== "object" ||
      Array.isArray(item)
    ) {
      continue;
    }

    const segment = item as Record<string, unknown>;

    if (
      typeof segment.tekst !== "string" ||
      segment.tekst.length === 0
    ) {
      continue;
    }

    resultaat.push({
      tekst: segment.tekst,
      ...(segment.vet === true
        ? { vet: true }
        : {}),
      ...(segment.donkergrijs === true
        ? { donkergrijs: true }
        : {}),
    });
  }

  return resultaat;
}
