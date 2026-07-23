"use client";

import {
  isVerborgenAfdeling,
  isWelzijnswet,
} from "@/bibliotheek/welzijnswet";

type WetgevingOptie = {
  id: string;
  naam: string;
};

type BoekOptie = {
  id: string;
  naam: string;
  wetgevingId: string;
};

type TitelOptie = {
  id: string;
  naam: string;
  boekId: string;
};

type BibliotheekToolbarProps = {
  wetgevingen: WetgevingOptie[];
  boeken: BoekOptie[];
  titels: TitelOptie[];
  beschikbareOnderwerpen: string[];

  filterWetgevingId: string;
  filterBoekId: string;
  filterTitelId: string;
  filterOnderwerp: string;
  filterKernwoord: string;

  onWijzigWetgeving: (wetgevingId: string) => void;
  onWijzigBoek: (boekId: string) => void;
  onWijzigTitel: (titelId: string) => void;
  onWijzigOnderwerp: (onderwerp: string) => void;
  onWijzigKernwoord: (kernwoord: string) => void;

  onNieuweInbreuk: () => void;
  onWisFilters: () => void;
};

const veldStijl =
  "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

export default function BibliotheekToolbar({
  wetgevingen,
  boeken,
  titels,
  beschikbareOnderwerpen,
  filterWetgevingId,
  filterBoekId,
  filterTitelId,
  filterOnderwerp,
  filterKernwoord,
  onWijzigWetgeving,
  onWijzigBoek,
  onWijzigTitel,
  onWijzigOnderwerp,
  onWijzigKernwoord,
  onNieuweInbreuk,
  onWisFilters,
}: BibliotheekToolbarProps) {
  const beschikbareBoeken = filterWetgevingId
    ? boeken.filter(
        (boek) =>
          boek.wetgevingId === filterWetgevingId,
      )
    : boeken;

  const beschikbareTitels = filterBoekId
    ? titels.filter(
        (titel) =>
          titel.boekId === filterBoekId &&
          !isVerborgenAfdeling(titel.id),
      )
    : filterWetgevingId
      ? titels.filter((titel) =>
          !isVerborgenAfdeling(titel.id) &&
          beschikbareBoeken.some(
            (boek) => boek.id === titel.boekId,
          ),
        )
      : titels.filter(
          (titel) =>
            !isVerborgenAfdeling(titel.id),
        );

  const welzijnswetGeselecteerd =
    isWelzijnswet(filterWetgevingId);
  const eersteNiveauLabel =
    filterWetgevingId
      ? welzijnswetGeselecteerd
        ? "Hoofdstuk"
        : "Boek"
      : "Boek / hoofdstuk";
  const tweedeNiveauLabel =
    filterWetgevingId
      ? welzijnswetGeselecteerd
        ? "Afdeling"
        : "Titel"
      : "Titel / afdeling";

  function wijzigWetgeving(
    wetgevingId: string,
  ): void {
    onWijzigWetgeving(wetgevingId);
    onWijzigBoek("");
    onWijzigTitel("");
    onWijzigOnderwerp("");
  }

  function wijzigBoek(
    boekId: string,
  ): void {
    onWijzigBoek(boekId);
    onWijzigTitel("");
    onWijzigOnderwerp("");
  }

  function wijzigTitel(
    titelId: string,
  ): void {
    onWijzigTitel(titelId);
    onWijzigOnderwerp("");
  }

  const filtersActief =
    filterWetgevingId.length > 0 ||
    filterBoekId.length > 0 ||
    filterTitelId.length > 0 ||
    filterOnderwerp.length > 0 ||
    filterKernwoord.trim().length > 0;

  return (
    <section className="rounded-2xl border border-white bg-white/95 shadow-[0_12px_38px_rgba(15,23,42,0.07)]">
      <div className="border-b border-slate-200 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">
              Bibliotheek standaardinbreuken
            </h1>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Filter de bibliotheek volgens de
              juridische structuur of voeg een
              nieuwe standaardinbreuk toe.
            </p>
          </div>

          <button
            type="button"
            onClick={onNieuweInbreuk}
            className="min-h-11 rounded-xl bg-gradient-to-r from-blue-700 to-blue-800 px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(29,78,216,0.18)] transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            Nieuwe standaardinbreuk
          </button>
        </div>
      </div>

      <div
        className={`grid gap-4 p-5 sm:grid-cols-2 ${
          welzijnswetGeselecteerd
            ? "xl:grid-cols-4"
            : "xl:grid-cols-5"
        }`}
      >
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Wetgeving
          </span>

          <select
            value={filterWetgevingId}
            onChange={(event) =>
              wijzigWetgeving(
                event.target.value,
              )
            }
            className={veldStijl}
          >
            <option value="">
              Alle wetgevingen
            </option>

            {wetgevingen.map(
              (wetgeving) => (
                <option
                  key={wetgeving.id}
                  value={wetgeving.id}
                >
                  {wetgeving.naam}
                </option>
              ),
            )}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            {eersteNiveauLabel}
          </span>

          <select
            value={filterBoekId}
            onChange={(event) =>
              wijzigBoek(event.target.value)
            }
            className={veldStijl}
            disabled={
              beschikbareBoeken.length === 0
            }
          >
            <option value="">
              Alle{" "}
              {welzijnswetGeselecteerd
                ? "hoofdstukken"
                : filterWetgevingId
                  ? "boeken"
                  : "boeken / hoofdstukken"}
            </option>

            {beschikbareBoeken.map(
              (boek) => (
                <option
                  key={boek.id}
                  value={boek.id}
                >
                  {boek.naam}
                </option>
              ),
            )}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            {tweedeNiveauLabel}
          </span>

          <select
            value={filterTitelId}
            onChange={(event) =>
              wijzigTitel(event.target.value)
            }
            className={veldStijl}
            disabled={
              beschikbareTitels.length === 0
            }
          >
            <option value="">
              Alle{" "}
              {welzijnswetGeselecteerd
                ? "afdelingen"
                : filterWetgevingId
                  ? "titels"
                  : "titels / afdelingen"}
            </option>

            {beschikbareTitels.map(
              (titel) => (
                <option
                  key={titel.id}
                  value={titel.id}
                >
                  {titel.naam}
                </option>
              ),
            )}
          </select>
        </label>

        {!welzijnswetGeselecteerd && (
          <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Onderwerp
          </span>

          <select
            value={filterOnderwerp}
            onChange={(event) =>
              onWijzigOnderwerp(
                event.target.value,
              )
            }
            className={veldStijl}
            disabled={
              beschikbareOnderwerpen.length ===
              0
            }
          >
            <option value="">
              Alle onderwerpen
            </option>

            {beschikbareOnderwerpen.map(
              (onderwerp) => (
                <option
                  key={onderwerp}
                  value={onderwerp}
                >
                  {onderwerp}
                </option>
              ),
            )}
          </select>
          </label>
        )}

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Kernwoord
          </span>

          <input
            type="search"
            value={filterKernwoord}
            onChange={(event) =>
              onWijzigKernwoord(
                event.target.value,
              )
            }
            placeholder="Zoeken..."
            className={veldStijl}
          />
        </label>
      </div>

      {filtersActief && (
        <div className="border-t border-slate-200 px-5 py-3">
          <button
            type="button"
            onClick={onWisFilters}
            className="min-h-10 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Alle filters wissen
          </button>
        </div>
      )}
    </section>
  );
}
