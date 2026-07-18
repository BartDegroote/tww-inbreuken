"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { Standaardinbreuk } from "@/bibliotheek";

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
  onderwerp: string;
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
    wetgevingId: "",
    boekId: "",
    titelId: "",
    kernwoorden: [],
    omschrijving: "",
    omschrijvingOpmaak: [],
    situering: "",
    toelichting: "",
    aanvulling: "",
    aanvullingOpmaak: [],
    wettelijkeVerwijzing: "",
  };
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

  const kernwoordSuggesties = useMemo(() => {
    const uniekeKernwoorden = new Map<
      string,
      string
    >();

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
      (eerste, tweede) =>
        eerste.localeCompare(tweede, "nl-BE", {
          sensitivity: "base",
        }),
    );
  }, [inbreuken]);

  const gefilterdeInbreuken = useMemo(() => {
    const zoekterm = filterKernwoord
      .trim()
      .toLocaleLowerCase("nl-BE");

    return inbreuken.filter((inbreuk) => {
      const titel = startTitels.find(
        (item) => item.id === inbreuk.titelId,
      );

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
        !filterOnderwerp ||
        titel?.onderwerp === filterOnderwerp;

      const voldoetAanZoekterm =
        !zoekterm ||
        inbreuk.kernwoorden.some((kernwoord) =>
          kernwoord
            .toLocaleLowerCase("nl-BE")
            .includes(zoekterm),
        ) ||
        inbreuk.omschrijving
          .toLocaleLowerCase("nl-BE")
          .includes(zoekterm) ||
        (inbreuk.situering ?? "")
          .toLocaleLowerCase("nl-BE")
          .includes(zoekterm) ||
        (inbreuk.toelichting ?? "")
          .toLocaleLowerCase("nl-BE")
          .includes(zoekterm) ||
        (inbreuk.aanvulling ?? "")
          .toLocaleLowerCase("nl-BE")
          .includes(zoekterm) ||
        inbreuk.wettelijkeVerwijzing
          .toLocaleLowerCase("nl-BE")
          .includes(zoekterm) ||
        (titel?.onderwerp ?? "")
          .toLocaleLowerCase("nl-BE")
          .includes(zoekterm);

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
    startTitels,
    filterWetgevingId,
    filterBoekId,
    filterTitelId,
    filterOnderwerp,
    filterKernwoord,
  ]);

  function selecteerInbreuk(
    inbreuk: Standaardinbreuk,
  ): void {
    setGeselecteerdeInbreuk(inbreuk);
  }

  function maakNieuweInbreuk(): void {
    setGeselecteerdeInbreuk(
      maakLegeInbreuk(),
    );
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
            inbreuk.id ===
            opgeslagenInbreuk.id
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
  }

  function wisFilters(): void {
    setFilterWetgevingId("");
    setFilterBoekId("");
    setFilterTitelId("");
    setFilterOnderwerp("");
    setFilterKernwoord("");
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-screen-2xl space-y-5 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            ← Terug naar hoofdmenu
          </Link>
        </div>

        <BibliotheekToolbar
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

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(22rem,0.9fr)_minmax(32rem,1.4fr)]">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <InbreukenLijst
              inbreuken={
                gefilterdeInbreuken
              }
              geselecteerdeId={
                geselecteerdeInbreuk?.id ??
                null
              }
              onSelecteer={selecteerInbreuk}
            />
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm xl:sticky xl:top-6">
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