"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  herstelInspectie,
  verwijderInspectieDefinitief,
  verplaatsNaarPrullenmand,
} from "./actions";

export default function InspectieActies({
  inspectieId,
  verwijderd,
}: {
  inspectieId: string;
  verwijderd: boolean;
}) {
  const router = useRouter();
  const [bezig, startTransition] = useTransition();
  const [fout, setFout] = useState("");

  function voerUit(actie: () => Promise<void>) {
    setFout("");
    startTransition(async () => {
      try {
        await actie();
        router.refresh();
      } catch (error) {
        console.error(error);
        setFout("De actie kon niet worden uitgevoerd.");
      }
    });
  }

  if (verwijderd) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button
          disabled={bezig}
          onClick={() => voerUit(() => herstelInspectie(inspectieId))}
          className="rounded-lg border border-blue-300 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
        >
          Herstellen
        </button>
        <button
          disabled={bezig}
          onClick={() => {
            if (window.confirm("Deze inspectie en alle foto’s definitief verwijderen?")) {
              voerUit(() => verwijderInspectieDefinitief(inspectieId));
            }
          }}
          className="rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          Definitief verwijderen
        </button>
        {fout && <span className="text-sm text-red-700">{fout}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        disabled={bezig}
        onClick={() => {
          if (window.confirm("Deze inspectie naar de prullenmand verplaatsen?")) {
            voerUit(() => verplaatsNaarPrullenmand(inspectieId));
          }
        }}
        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        Verwijderen
      </button>
      {fout && <span className="text-sm text-red-700">{fout}</span>}
    </div>
  );
}
