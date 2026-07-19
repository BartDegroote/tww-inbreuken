"use client";

import type {
  BoekOptie,
  TitelOptie,
  WetgevingOptie,
} from "../BibliotheekClient";

import type { Standaardinbreuk } from "@/bibliotheek";

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
  function zoekWetgevingNaam(
    wetgevingId: string,
  ): string {
    return (
      wetgevingen.find(
        (wetgeving) =>
          wetgeving.id === wetgevingId,
      )?.naam ?? "Onbekende wetgeving"
    );
  }

  function zoekBoekNaam(
    boekId: string,
  ): string {
    return (
      boeken.find(
        (boek) => boek.id === boekId,
      )?.naam ?? "Onbekend boek"
    );
  }

  function zoekTitelNaam(
    titelId: string,
  ): string {
    return (
      titels.find(
        (titel) => titel.id === titelId,
      )?.naam ?? "Onbekende titel"
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

              return (
                <li key={inbreuk.id}>
                  <button
                    type="button"
                    onClick={() =>
                      onSelecteer(inbreuk)
                    }
                    className={`w-full rounded-lg border p-4 text-left transition ${
                      isGeselecteerd
                        ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {wetgevingNaam}
                    </span>

                    <span className="mt-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {boekNaam}
                      {" · "}
                      {titelNaam}
                    </span>

                    {inbreuk.onderwerp.trim() && (
                      <span className="mt-2 block text-sm font-semibold text-slate-800">
                        {inbreuk.onderwerp}
                      </span>
                    )}

                    <span className="mt-2 block whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {inbreuk.omschrijving}
                    </span>

                    {inbreuk
                      .specifiekeElementenIngeschakeld &&
                      inbreuk
                        .specifiekeElementen
                        .length > 0 && (
                        <span className="mt-3 block rounded-lg bg-slate-50 p-3">
                          <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Specifieke elementen
                          </span>

                          <span className="mt-2 block">
                            {inbreuk.specifiekeElementen
                              .slice(0, 3)
                              .map(
                                (
                                  element,
                                  index,
                                ) => (
                                  <span
                                    key={
                                      element.id ||
                                      `${inbreuk.id}-${index}`
                                    }
                                    className="mt-1 block text-sm leading-5 text-slate-600"
                                  >
                                    •{" "}
                                    {
                                      element.tekst
                                    }
                                  </span>
                                ),
                              )}

                            {inbreuk
                              .specifiekeElementen
                              .length > 3 && (
                              <span className="mt-1 block text-xs font-medium text-slate-500">
                                +
                                {inbreuk
                                  .specifiekeElementen
                                  .length - 3}{" "}
                                extra
                              </span>
                            )}
                          </span>
                        </span>
                      )}

                    {inbreuk.kernwoorden.length >
                      0 && (
                      <span className="mt-3 flex flex-wrap gap-1.5">
                        {inbreuk.kernwoorden
                          .slice(0, 4)
                          .map(
                            (kernwoord) => (
                              <span
                                key={
                                  kernwoord
                                }
                                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
                              >
                                {kernwoord}
                              </span>
                            ),
                          )}

                        {inbreuk.kernwoorden
                          .length > 4 && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                            +
                            {inbreuk
                              .kernwoorden
                              .length - 4}
                          </span>
                        )}
                      </span>
                    )}
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