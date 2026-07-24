"use client";

import { useMemo } from "react";

import type {
  BoekOptie,
  TitelOptie,
  WetgevingOptie,
} from "../BibliotheekClient";

import type { Standaardinbreuk } from "@/bibliotheek";
import {
  isVerborgenAfdeling,
  isWelzijnswet,
} from "@/bibliotheek/welzijnswet";
import TekstMetOpmaak from "@/app/bibliotheek/TekstMetOpmaak";

type InbreukenLijstProps = {
  inbreuken: Standaardinbreuk[];
  geselecteerdeId: string | null;

  wetgevingen: WetgevingOptie[];
  boeken: BoekOptie[];
  titels: TitelOptie[];

  onSelecteer: (
    inbreuk: Standaardinbreuk,
  ) => void;
};

export default function InbreukenLijst({
  inbreuken,
  geselecteerdeId,
  wetgevingen,
  boeken,
  titels,
  onSelecteer,
}: InbreukenLijstProps) {
  const wetgevingNaamPerId = useMemo(
    () =>
      new Map(
        wetgevingen.map((wetgeving) => [
          wetgeving.id,
          wetgeving.naam,
        ]),
      ),
    [wetgevingen],
  );

  const boekNaamPerId = useMemo(
    () =>
      new Map(
        boeken.map((boek) => [
          boek.id,
          boek.naam,
        ]),
      ),
    [boeken],
  );

  const titelNaamPerId = useMemo(
    () =>
      new Map(
        titels.map((titel) => [
          titel.id,
          titel.naam,
        ]),
      ),
    [titels],
  );

  function zoekWetgevingNaam(
    wetgevingId: string,
  ): string {
    return (
      wetgevingNaamPerId.get(wetgevingId) ??
      "Onbekende wetgeving"
    );
  }

  function zoekBoekNaam(
    boekId: string,
  ): string {
    return (
      boekNaamPerId.get(boekId) ??
      "Onbekend boek"
    );
  }

  function zoekTitelNaam(
    titelId: string,
  ): string {
    return (
      titelNaamPerId.get(titelId) ??
      "Onbekende titel"
    );
  }

  return (
    <div>
      <div className="border-b border-slate-200 p-5">
        <h2 className="text-lg font-semibold text-slate-900">
          Standaardinbreuken
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {inbreuken.length}{" "}
          {inbreuken.length === 1
            ? "standaardinbreuk gevonden"
            : "standaardinbreuken gevonden"}
        </p>
      </div>

      <div className="p-5">
        {inbreuken.length === 0 ? (
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-sm text-slate-500">
              Er zijn geen standaardinbreuken
              die aan de gekozen filters
              voldoen.
            </p>
          </div>
        ) : (
          <ol className="space-y-3">
            {inbreuken.map((inbreuk) => {
              const isGeselecteerd =
                geselecteerdeId === inbreuk.id;

              const wetgevingNaam =
                zoekWetgevingNaam(
                  inbreuk.wetgevingId,
                );

              const boekNaam = zoekBoekNaam(
                inbreuk.boekId,
              );

              const titelNaam =
                zoekTitelNaam(
                  inbreuk.titelId,
                );
              const welzijnswet =
                isWelzijnswet(
                  inbreuk.wetgevingId,
                );
              const toonTitel =
                !welzijnswet ||
                !isVerborgenAfdeling(
                  inbreuk.titelId,
                );

              return (
                <li key={inbreuk.id}>
                  <button
                    type="button"
                    onClick={() =>
                      onSelecteer(inbreuk)
                    }
                    className={`w-full rounded-xl border p-4 text-left shadow-sm transition ${
                      isGeselecteerd
                        ? inbreuk.geverifieerd
                          ? "border-emerald-600 bg-emerald-100 ring-1 ring-emerald-600"
                          : "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                        : inbreuk.geverifieerd
                          ? "border-emerald-400 bg-emerald-100 hover:border-emerald-500 hover:bg-emerald-200"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-start justify-between gap-2 text-xs font-semibold uppercase leading-5 tracking-wide text-slate-500">
                      <span>
                        {inbreuk.inbreukType ===
                          "EAO_CODES" && (
                          <span className="mr-2 inline-flex rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold tracking-normal text-amber-800">
                            EAO-codes
                          </span>
                        )}
                        {wetgevingNaam}
                        {" · "}
                        {boekNaam}
                        {toonTitel &&
                          ` · ${titelNaam}`}
                      </span>

                      {inbreuk.inspecteurInfoIngeschakeld &&
                        inbreuk.inspecteurInfo?.trim() && (
                        <span
                          aria-label="Info voor inspecteur beschikbaar"
                          title="Info voor inspecteur beschikbaar"
                          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-sky-400 bg-sky-50 text-[10px] font-bold normal-case tracking-normal text-sky-700"
                        >
                          i
                        </span>
                      )}
                    </span>

                    <span className="mt-2 block">
                      {!welzijnswet &&
                        inbreuk.onderwerp.trim() && (
                        <span className="block text-sm font-semibold text-slate-800">
                          {inbreuk.onderwerp}
                        </span>
                      )}

                      <TekstMetOpmaak
                        tekst={inbreuk.omschrijving}
                        segmenten={
                          inbreuk.omschrijvingOpmaak
                        }
                        className="mt-1 block text-sm leading-5"
                      />
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
