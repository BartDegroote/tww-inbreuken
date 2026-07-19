"use server";

import { redirect } from "next/navigation";

import {
  controleerWachtwoord,
  hashWachtwoord,
  maakSessie,
  vereisGebruiker,
  wisHuidigeSessie,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function waarde(formData: FormData, veld: string) {
  const invoer = formData.get(veld);
  return typeof invoer === "string" ? invoer.trim() : "";
}

export async function wijzigAccount(formData: FormData) {
  const aangemeld = await vereisGebruiker();
  const gebruiker = await prisma.gebruiker.findUnique({ where: { id: aangemeld.id } });

  if (!gebruiker) redirect("/login");

  const naam = waarde(formData, "naam");
  const gebruikersnaam = waarde(formData, "gebruikersnaam");
  const huidigWachtwoord = waarde(formData, "huidigWachtwoord");
  const nieuwWachtwoord = waarde(formData, "nieuwWachtwoord");

  if (!naam || gebruikersnaam.length < 2) {
    redirect("/instellingen?fout=Naam%20en%20gebruikersnaam%20zijn%20verplicht.");
  }

  if (!(await controleerWachtwoord(huidigWachtwoord, gebruiker.wachtwoordHash))) {
    redirect("/instellingen?fout=Het%20huidige%20wachtwoord%20is%20niet%20correct.");
  }

  if (nieuwWachtwoord && nieuwWachtwoord.length < 5) {
    redirect("/instellingen?fout=Het%20nieuwe%20wachtwoord%20moet%20minstens%205%20tekens%20bevatten.");
  }

  const bestaand = await prisma.gebruiker.findFirst({
    where: {
      gebruikersnaam: { equals: gebruikersnaam, mode: "insensitive" },
      id: { not: gebruiker.id },
    },
    select: { id: true },
  });

  if (bestaand) {
    redirect("/instellingen?fout=Deze%20gebruikersnaam%20bestaat%20al.");
  }

  await prisma.gebruiker.update({
    where: { id: gebruiker.id },
    data: {
      naam,
      gebruikersnaam,
      ...(nieuwWachtwoord
        ? {
            wachtwoordHash: await hashWachtwoord(nieuwWachtwoord),
            wachtwoordWijzigingVereist: false,
          }
        : {}),
    },
  });

  if (nieuwWachtwoord) {
    await prisma.sessie.deleteMany({ where: { gebruikerId: gebruiker.id } });
    await wisHuidigeSessie();
    await maakSessie(gebruiker.id);
  }

  redirect("/instellingen?succes=Instellingen%20opgeslagen.");
}
