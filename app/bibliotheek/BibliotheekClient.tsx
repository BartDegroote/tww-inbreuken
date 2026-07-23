"use client";

import {
  useMemo,
  useRef,
  useState,
} from "react";

import type { Standaardinbreuk } from "@/bibliotheek";
import AppBalk from "@/app/componenten/AppBalk";

import {
  bewaarStandaardinbreuk,
  verwijderStandaardinbreuk,
} from "./actions";
import BibliotheekToolbar from "./componenten/BibliotheekToolbar";
import InbreukenLijst from "./componenten/InbreukenLijst";
import InbreukFormulier from "./componenten/InbreukFormulier";

export type WetgevingOptie = {
  id: string;
  naam: string;
};

export type BoekOptie = {
  id: string;
  naam: string;
  wetgevingId: string;
};

export type TitelOptie = {
  id: string;
  naam: string;
  boekId: string;
};

type BibliotheekClientProps = {
  startWetgevingen: WetgevingOptie[];
  startBoeken: BoekOptie[];
  startTitels: TitelOptie[];
  startInbreuken: Standaardinbreuk[];
};

function maakLegeInbreuk(): Standaardinbreuk {
  return {
    id: "",

    geverifieerd: false,

    wetgevingId: "",
    boekId: "",
    titelId: "",

    onderwerp: "",

    kernwoorden: [],

    omschrijving: "",
    omschrijvingOpmaak: [],

    situering: "",

    specifiekeElementenIngeschakeld: false,
    specifiekeElementenAlsSituering: false,
    specifiekeElementen: [],

    toelichting: "",

    aanvulling: "",
    aanvullingOpmaak: [],

    wettelijkeVerwijzing: "",
  };
}

function vergelijkTekst(
  eerste: string,
  tweede: string,
): number {
  return eerste.localeCompare(tweede, "nl-BE", {
    sensitivity: "base",
  });
}

export default function BibliotheekClient({
  startWetgevingen,
  startBoeken,
  startTitels,
  startInbreuken,
}: BibliotheekClientProps) {
  const [inbreuken, setInbreuken] =
    useState<Standaardinbreuk[]>(startInbreuken);

  const [
    geselecteerdeInbreuk,
    setGeselecteerdeInbreuk,
  ] = useState<Standaardinbreuk | null>(
    startInbreuken[0] ?? null,
  );

  const [
    filterWetgevingId,
    setFilterWetgevingId,
  ] = useState("");

  const [filterBoekId, setFilterBoekId] =
    useState("");

  const [filterTitelId, setFilterTitelId] =
    useState("");

  const [
    filterOnderwerp,
    setFilterOnderwerp,
  ] = useState("");

  const [
    filterKernwoord,
    setFilterKernwoord,
  ] = useState("");

  const formulierRef =
    useRef<HTMLElement | null>(null);

  function scrollNaarFormulier(): void {
    if (
      typeof window === "undefined" ||
      !window.matchMedia("(max-width: 1023px)")
        .matches
    ) {
      return;
    }

    window.requestAnimationFrame(() => {
      formulierRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  const kernwoordSuggesties = useMemo(() => {
    const uniekeKernwoorden =
      new Map<string, string>();

    for (const inbreuk of inbreuken) {
      for (const kernwoord of inbreuk.kernwoorden) {
        const opgeschoondKernwoord =
          kernwoord.trim();

        if (!opgeschoondKernwoord) {
          continue;
        }

        const sleutel =
          opgeschoondKernwoord.toLocaleLowerCase(
            "nl-BE",
          );

        if (!uniekeKernwoorden.has(sleutel)) {
          uniekeKernwoorden.set(
            sleutel,
            opgeschoondKernwoord,
          );
        }
      }
    }

    return [...uniekeKernwoorden.values()].sort(
      vergelijkTekst,
    );
  }, [inbreuken]);

  const onderwerpSuggestieBronnen = useMemo(
    () =>
      inbreuken.map((inbreuk) => ({
        wetgevingId: inbreuk.wetgevingId,
        boekId: inbreuk.boekId,
        titelId: inbreuk.titelId,
        onderwerp: inbreuk.onderwerp,
      })),
    [inbreuken],
  );

  const beschikbareOnderwerpen = useMemo(() => {
    const uniekeOnderwerpen =
      new Map<string, string>();

    for (const inbreuk of inbreuken) {
      const voldoetAanWetgeving =
        !filterWetgevingId ||
        inbreuk.wetgevingId ===
          filterWetgevingId;

      const voldoetAanBoek =
        !filterBoekId ||
        inbreuk.boekId === filterBoekId;

      const voldoetAanTitel =
        !filterTitelId ||
        inbreuk.titelId === filterTitelId;

      if (
        !voldoetAanWetgeving ||
        !voldoetAanBoek ||
        !voldoetAanTitel
      ) {
        continue;
      }

      const onderwerp = inbreuk.onderwerp.trim();

      if (!onderwerp) {
        continue;
      }

      const sleutel =
        onderwerp.toLocaleLowerCase("nl-BE");

      if (!uniekeOnderwerpen.has(sleutel)) {
        uniekeOnderwerpen.set(
          sleutel,
          onderwerp,
        );
      }
    }

    return [...uniekeOnderwerpen.values()].sort(
      vergelijkTekst,
    );
  }, [
    inbreuken,
    filterWetgevingId,
    filterBoekId,
    filterTitelId,
  ]);

  const zoekindexPerInbreukId = useMemo(() => {
    return new Map(
      inbreuken.map((inbreuk) => [
        inbreuk.id,
        {
          onderwerp: inbreuk.onderwerp
            .toLocaleLowerCase("nl-BE"),
          onderwerpExact: inbreuk.onderwerp
            .trim()
            .toLocaleLowerCase("nl-BE"),
          kernwoorden: inbreuk.kernwoorden.map(
            (kernwoord) =>
              kernwoord.toLocaleLowerCase("nl-BE"),
          ),
          omschrijving: inbreuk.omschrijving
            .toLocaleLowerCase("nl-BE"),
          situering: (inbreuk.situering ?? "")
            .toLocaleLowerCase("nl-BE"),
          specifiekeElementen:
            inbreuk.specifiekeElementen
              .map((element) => element.tekst)
              .join(" ")
              .toLocaleLowerCase("nl-BE"),
          toelichting: (inbreuk.toelichting ?? "")
            .toLocaleLowerCase("nl-BE"),
          aanvulling: (inbreuk.aanvulling ?? "")
            .toLocaleLowerCase("nl-BE"),
          wettelijkeVerwijzing:
            inbreuk.wettelijkeVerwijzing
              .toLocaleLowerCase("nl-BE"),
        },
      ]),
    );
  }, [inbreuken]);

  const gefilterdeInbreuken = useMemo(() => {
    const zoekterm = filterKernwoord
      .trim()
      .toLocaleLowerCase("nl-BE");

    const onderwerpFilter = filterOnderwerp
      .trim()
      .toLocaleLowerCase("nl-BE");

    return inbreuken.filter((inbreuk) => {
      const zoekindex =
        zoekindexPerInbreukId.get(inbreuk.id);

      if (!zoekindex) {
        return false;
      }

      const voldoetAanWetgeving =
        !filterWetgevingId ||
        inbreuk.wetgevingId ===
          filterWetgevingId;

      const voldoetAanBoek =
        !filterBoekId ||
        inbreuk.boekId === filterBoekId;

      const voldoetAanTitel =
        !filterTitelId ||
        inbreuk.titelId === filterTitelId;

      const voldoetAanOnderwerp =
        !onderwerpFilter ||
        zoekindex.onderwerpExact === onderwerpFilter;

      const voldoetAanZoekterm =
        !zoekterm ||
        zoekindex.kernwoorden.some((kernwoord) =>
          kernwoord.includes(zoekterm),
        ) ||
        zoekindex.onderwerp.includes(zoekterm) ||
        zoekindex.omschrijving.includes(zoekterm) ||
        zoekindex.situering.includes(zoekterm) ||
        zoekindex.specifiekeElementen.includes(
          zoekterm,
        ) ||
        zoekindex.toelichting.includes(zoekterm) ||
        zoekindex.aanvulling.includes(zoekterm) ||
        zoekindex.wettelijkeVerwijzing.includes(
          zoekterm,
        );

      return (
        voldoetAanWetgeving &&
        voldoetAanBoek &&
        voldoetAanTitel &&
        voldoetAanOnderwerp &&
        voldoetAanZoekterm
      );
    });
  }, [
    inbreuken,
    filterWetgevingId,
    filterBoekId,
    filterTitelId,
    filterOnderwerp,
    filterKernwoord,
    zoekindexPerInbreukId,
  ]);

  function selecteerInbreuk(
    inbreuk: Standaardinbreuk,
  ): void {
    setGeselecteerdeInbreuk(inbreuk);
    scrollNaarFormulier();
  }

  function maakNieuweInbreuk(): void {
    setGeselecteerdeInbreuk(
      maakLegeInbreuk(),
    );
    scrollNaarFormulier();
  }

  async function bewaarInbreuk(
    gewijzigdeInbreuk: Standaardinbreuk,
  ): Promise<void> {
    const opgeslagenInbreuk =
      await bewaarStandaardinbreuk(
        gewijzigdeInbreuk,
      );

    setInbreuken((huidigeInbreuken) => {
      const bestaatAl =
        huidigeInbreuken.some(
          (inbreuk) =>
            inbreuk.id === opgeslagenInbreuk.id,
        );

      if (bestaatAl) {
        return huidigeInbreuken.map(
          (inbreuk) =>
            inbreuk.id === opgeslagenInbreuk.id
              ? opgeslagenInbreuk
              : inbreuk,
        );
      }

      return [
        opgeslagenInbreuk,
        ...huidigeInbreuken,
      ];
    });

    setGeselecteerdeInbreuk(
      opgeslagenInbreuk,
    );
  }

  async function verwijderInbreuk(
    inbreukId: string,
  ): Promise<void> {
    await verwijderStandaardinbreuk(
      inbreukId,
    );

    setInbreuken((huidigeInbreuken) =>
      huidigeInbreuken.filter(
        (inbreuk) =>
          inbreuk.id !== inbreukId,
      ),
    );

    setGeselecteerdeInbreuk(
      (huidigeSelectie) =>
        huidigeSelectie?.id === inbreukId
          ? null
          : huidigeSelectie,
    );
  }

  function wijzigFilterWetgeving(
    wetgevingId: string,
  ): void {
    setFilterWetgevingId(wetgevingId);
    setFilterBoekId("");
    setFilterTitelId("");
    setFilterOnderwerp("");
  }

  function wijzigFilterBoek(
    boekId: string,
  ): void {
    setFilterBoekId(boekId);
    setFilterTitelId("");
    setFilterOnderwerp("");
  }

  function wijzigFilterTitel(
    titelId: string,
  ): void {
    setFilterTitelId(titelId);
    setFilterOnderwerp("");
  }

  function wisFilters(): void {
    setFilterWetgevingId("");
    setFilterBoekId("");
    setFilterTitelId("");
    setFilterOnderwerp("");
    setFilterKernwoord("");
  }

  return (
    <main className="tww-canvas min-h-screen">
      <div className="mx-auto max-w-screen-2xl space-y-5 p-4 sm:p-6 lg:p-8">
        <AppBalk terugLabel="Hoofdmenu" />

        <BibliotheekToolbar
          wetgevingen={startWetgevingen}
          boeken={startBoeken}
          titels={startTitels}
          beschikbareOnderwerpen={
            beschikbareOnderwerpen
          }
          filterWetgevingId={
            filterWetgevingId
          }
          filterBoekId={filterBoekId}
          filterTitelId={filterTitelId}
          filterOnderwerp={filterOnderwerp}
          filterKernwoord={filterKernwoord}
          onWijzigWetgeving={
            wijzigFilterWetgeving
          }
          onWijzigBoek={wijzigFilterBoek}
          onWijzigTitel={wijzigFilterTitel}
          onWijzigOnderwerp={
            setFilterOnderwerp
          }
          onWijzigKernwoord={
            setFilterKernwoord
          }
          onNieuweInbreuk={
            maakNieuweInbreuk
          }
          onWisFilters={wisFilters}
        />

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(18rem,0.85fr)_minmax(0,1.4fr)]">
          <section className="overflow-hidden rounded-2xl border border-white bg-white/95 shadow-[0_12px_38px_rgba(15,23,42,0.07)] lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:overscroll-contain lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden">
            <InbreukenLijst
              inbreuken={
                gefilterdeInbreuken
              }
              geselecteerdeId={
                geselecteerdeInbreuk?.id ??
                null
              }
              wetgevingen={
                startWetgevingen
              }
              boeken={startBoeken}
              titels={startTitels}
              onSelecteer={selecteerInbreuk}
            />
          </section>

          <section
            ref={formulierRef}
            className="scroll-mt-4 overflow-hidden rounded-2xl border border-white bg-white/95 shadow-[0_12px_38px_rgba(15,23,42,0.07)]"
          >
            <InbreukFormulier
              inbreuk={
                geselecteerdeInbreuk
              }
              wetgevingen={
                startWetgevingen
              }
              boeken={startBoeken}
              titels={startTitels}
              kernwoordSuggesties={
                kernwoordSuggesties
              }
              onderwerpSuggesties={
                onderwerpSuggestieBronnen
              }
              onBewaar={bewaarInbreuk}
              onVerwijder={
                verwijderInbreuk
              }
            />
          </section>
        </div>
      </div>
    </main>
  );
}
