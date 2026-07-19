import { redirect } from "next/navigation";

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
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-700 text-xs font-black tracking-wider text-white">
            TWW
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              WebApp TWW
            </h1>
            <p className="text-sm text-slate-500">
              Veilig aanmelden
            </p>
          </div>
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
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
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
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button className="w-full rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800">
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
