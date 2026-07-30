import AppBalk from "@/app/componenten/AppBalk";
import { vereisGebruiker } from "@/lib/auth";

import { wijzigAccount } from "./actions";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ fout?: string; succes?: string }>;
};

export default async function InstellingenPagina({ searchParams }: Props) {
  const gebruiker = await vereisGebruiker();
  const melding = await searchParams;

  return (
    <main className="tww-canvas min-h-screen">
      <div className="mx-auto max-w-2xl px-5 pb-8 pt-6 sm:px-8">
        <AppBalk />

        <div className="mt-5 rounded-2xl border border-white bg-white/95 p-7 shadow-[0_14px_45px_rgba(15,23,42,0.07)] sm:p-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Instellingen</h1>
          <p className="mt-2 text-slate-500">Wijzig je naam en aanmeldgegevens.</p>

          {melding.fout && (
            <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{melding.fout}</p>
          )}
          {melding.succes && (
            <p className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{melding.succes}</p>
          )}

          <form action={wijzigAccount} className="mt-7 space-y-5">
            <div>
              <label htmlFor="naam" className="text-sm font-medium text-slate-700">Naam</label>
              <input id="naam" name="naam" required defaultValue={gebruiker.naam} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100" />
            </div>
            <div>
              <label htmlFor="gebruikersnaam" className="text-sm font-medium text-slate-700">Gebruikersnaam</label>
              <input id="gebruikersnaam" name="gebruikersnaam" required defaultValue={gebruiker.gebruikersnaam} autoComplete="username" className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100" />
            </div>
            <div>
              <label htmlFor="huidigWachtwoord" className="text-sm font-medium text-slate-700">Huidig wachtwoord</label>
              <input id="huidigWachtwoord" name="huidigWachtwoord" type="password" required autoComplete="current-password" className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100" />
            </div>
            <div>
              <label htmlFor="nieuwWachtwoord" className="text-sm font-medium text-slate-700">Nieuw wachtwoord <span className="font-normal text-slate-400">(optioneel)</span></label>
              <input id="nieuwWachtwoord" name="nieuwWachtwoord" type="password" minLength={5} autoComplete="new-password" className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100" />
            </div>
            <button className="min-h-12 w-full rounded-xl bg-gradient-to-r from-blue-700 to-blue-800 px-5 py-3 font-bold text-white shadow-[0_10px_25px_rgba(29,78,216,0.18)] transition hover:-translate-y-0.5">Instellingen opslaan</button>
          </form>
        </div>
      </div>
    </main>
  );
}
