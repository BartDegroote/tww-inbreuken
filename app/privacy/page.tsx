import Link from "next/link";

export const metadata = { title: "Privacy · WebApp TWW" };

export default function PrivacyPagina() {
  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
        <Link href="/" className="text-sm font-medium text-blue-700 hover:underline">← Terug</Link>
        <article className="mt-6 rounded-xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
          <h1 className="text-3xl font-bold text-slate-900">Privacy en gegevensbescherming</h1>
          <p className="mt-5 leading-7 text-slate-600">
            WebApp TWW is een interne inspectietoepassing. De organisatie die de inspectie uitvoert is de verwerkingsverantwoordelijke. Bart Degroote beheert de toepassing; privacyverzoeken verlopen via de gebruikelijke contactkanalen van de verantwoordelijke organisatie.
          </p>

          <div className="mt-8 space-y-7 text-sm leading-6 text-slate-600">
            <section>
              <h2 className="text-lg font-bold text-slate-900">Welke gegevens?</h2>
              <p className="mt-2">Inspectiegegevens, bedrijfs- en adresgegevens, vaststellingen, namen van inspecteurs, foto’s en technische aanmeld- en sessiegegevens. Voeg alleen gegevens toe die noodzakelijk zijn voor de inspectie.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold text-slate-900">Doel en rechtsgrond</h2>
              <p className="mt-2">De gegevens worden uitsluitend gebruikt voor inspectie, opvolging en verslaggeving. De verantwoordelijke organisatie bepaalt en documenteert per inspectie de toepasselijke rechtsgrond, bijvoorbeeld een wettelijke taak of verplichting.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold text-slate-900">Bewaring</h2>
              <p className="mt-2">Actieve dossiers worden bewaard zolang dit noodzakelijk is voor inspectie- en dossierverplichtingen. Verwijderde dossiers blijven maximaal 30 dagen in de prullenmand en worden daarna met hun foto’s definitief verwijderd.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold text-slate-900">Verwerkers</h2>
              <p className="mt-2">Supabase verwerkt de databasegegevens in de gekozen EU-regio. Vercel host de webtoepassing en is ingesteld op Dublin. GitHub kan uitsluitend broncode bevatten; databestanden en omgevingsgeheimen horen daar niet thuis.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold text-slate-900">Rechten en incidenten</h2>
              <p className="mt-2">Betrokkenen kunnen volgens de toepasselijke regels inzage, correctie, beperking of verwijdering vragen. Meld verlies, foutieve verzending of ongeoorloofde toegang onmiddellijk aan de verantwoordelijke organisatie zodat de meldplicht kan worden beoordeeld.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold text-slate-900">Cookies</h2>
              <p className="mt-2">De app gebruikt alleen een strikt noodzakelijke, beveiligde sessiecookie voor de login en geen advertentie- of analysecookies.</p>
            </section>
          </div>
        </article>
      </div>
    </main>
  );
}
