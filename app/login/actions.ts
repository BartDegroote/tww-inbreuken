"use server";

import { redirect } from "next/navigation";

import {
  controleerWachtwoord,
  maakSessie,
  wisHuidigeSessie,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function tekst(formData: FormData, naam: string): string {
  const waarde = formData.get(naam);
  return typeof waarde === "string" ? waarde.trim() : "";
}

export async function aanmelden(formData: FormData) {
  const gebruikersnaam = tekst(formData, "gebruikersnaam");
  const wachtwoord = tekst(formData, "wachtwoord");
  const gebruiker = await prisma.gebruiker.findFirst({
    where: { gebruikersnaam: { equals: gebruikersnaam, mode: "insensitive" } },
  });

  if (gebruiker?.geblokkeerdTot && gebruiker.geblokkeerdTot > new Date()) {
    redirect("/login?fout=Te%20veel%20mislukte%20pogingen.%20Probeer%20later%20opnieuw.");
  }

  if (
    !gebruiker ||
    !(await controleerWachtwoord(wachtwoord, gebruiker.wachtwoordHash))
  ) {
    if (gebruiker) {
      const aantal = gebruiker.mislukteAanmeldingen + 1;
      await prisma.gebruiker.update({
        where: { id: gebruiker.id },
        data: {
          mislukteAanmeldingen: aantal >= 5 ? 0 : aantal,
          geblokkeerdTot:
            aantal >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
        },
      });
    }
    redirect("/login?fout=Ongeldige%20aanmeldgegevens");
  }

  await prisma.gebruiker.update({
    where: { id: gebruiker.id },
    data: { mislukteAanmeldingen: 0, geblokkeerdTot: null },
  });
  await maakSessie(gebruiker.id);
  redirect("/");
}

export async function afmelden() {
  await wisHuidigeSessie();
  redirect("/login");
}
