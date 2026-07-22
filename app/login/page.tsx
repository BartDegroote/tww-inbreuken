import { redirect } from "next/navigation";

import TwwMerk from "@/app/componenten/TwwMerk";
import { huidigeGebruiker } from "@/lib/auth";
import { aanmelden } from "./actions";

export const dynamic = "force-dynamic";

type LoginProps = {
  searchParams: Promise<{ fout?: string }>;
};

export default async function LoginPagina({ searchParams }: LoginProps) {
  if (await huidigeGebruiker()) {
    redirect("/");
  }

  const parameters = await searchParams;

  return (
    <main className="tww-canvas relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10">
      <div aria-hidden="true" className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-200/70" />
      <div className="relative w-full max-w-md rounded-3xl border border-white bg-white/90 p-7 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur sm:p-9">
        <TwwMerk />

        <div className="mt-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">
            Veilig aanmelden
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Ga verder naar je inspectiewerkplek.
          </p>
        </div>

        {parameters.fout && (
          <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {parameters.fout}
          </p>
        )}

        <form action={aanmelden} className="mt-7 space-y-5">
          <div>
            <label htmlFor="gebruikersnaam" className="text-sm font-medium text-slate-700">
              Gebruikersnaam
            </label>
            <input
              id="gebruikersnaam"
              name="gebruikersnaam"
              required
              autoComplete="username"
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label htmlFor="wachtwoord" className="text-sm font-medium text-slate-700">
              Wachtwoord
            </label>
            <input
              id="wachtwoord"
              name="wachtwoord"
              type="password"
              required
              autoComplete="current-password"
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <button className="min-h-12 w-full rounded-xl bg-gradient-to-r from-blue-700 to-blue-800 px-5 py-3 font-bold text-white shadow-[0_10px_25px_rgba(29,78,216,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(29,78,216,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
            Aanmelden
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-slate-500">
          Door aan te melden gebruik je alleen de noodzakelijke sessiecookie.{" "}
          <a href="/privacy" className="font-medium text-blue-700 hover:underline">Privacyinformatie</a>
        </p>
      </div>
    </main>
  );
}
