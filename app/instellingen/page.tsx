import Link from "next/link";

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
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8">
        <Link href="/" className="text-sm font-medium text-blue-700 hover:underline">
          ← Terug naar beginscherm
        </Link>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
          <h1 className="text-3xl font-bold text-slate-900">Instellingen</h1>
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
              <input id="naam" name="naam" required defaultValue={gebruiker.naam} className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600" />
            </div>
            <div>
              <label htmlFor="gebruikersnaam" className="text-sm font-medium text-slate-700">Gebruikersnaam</label>
              <input id="gebruikersnaam" name="gebruikersnaam" required defaultValue={gebruiker.gebruikersnaam} autoComplete="username" className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600" />
            </div>
            <div>
              <label htmlFor="huidigWachtwoord" className="text-sm font-medium text-slate-700">Huidig wachtwoord</label>
              <input id="huidigWachtwoord" name="huidigWachtwoord" type="password" required autoComplete="current-password" className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600" />
            </div>
            <div>
              <label htmlFor="nieuwWachtwoord" className="text-sm font-medium text-slate-700">Nieuw wachtwoord <span className="font-normal text-slate-400">(optioneel)</span></label>
              <input id="nieuwWachtwoord" name="nieuwWachtwoord" type="password" minLength={5} autoComplete="new-password" className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600" />
            </div>
            <button className="w-full rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800">Instellingen opslaan</button>
          </form>
        </div>
      </div>
    </main>
  );
}
