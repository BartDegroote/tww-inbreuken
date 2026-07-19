import "server-only";

import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

const scrypt = promisify(scryptCallback);
const SESSIE_COOKIE = "tww_sessie";
const SESSIE_UREN = 12;

export type AangemeldeGebruiker = {
  id: string;
  gebruikersnaam: string;
  naam: string;
  wachtwoordWijzigingVereist: boolean;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashWachtwoord(wachtwoord: string): Promise<string> {
  const zout = randomBytes(16).toString("hex");
  const afgeleid = (await scrypt(wachtwoord, zout, 64)) as Buffer;

  return `scrypt$${zout}$${afgeleid.toString("hex")}`;
}

export async function controleerWachtwoord(
  wachtwoord: string,
  opgeslagenHash: string,
): Promise<boolean> {
  const [methode, zout, hash] = opgeslagenHash.split("$");

  if (methode !== "scrypt" || !zout || !hash) {
    return false;
  }

  const verwacht = Buffer.from(hash, "hex");
  const werkelijk = (await scrypt(wachtwoord, zout, verwacht.length)) as Buffer;

  return (
    verwacht.length === werkelijk.length &&
    timingSafeEqual(verwacht, werkelijk)
  );
}

export async function maakSessie(gebruikerId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const vervaltOp = new Date(
    Date.now() + SESSIE_UREN * 60 * 60 * 1000,
  );

  await prisma.sessie.create({
    data: {
      tokenHash: hashToken(token),
      vervaltOp,
      gebruikerId,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSIE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: vervaltOp,
  });
}

export async function huidigeGebruiker(): Promise<AangemeldeGebruiker | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSIE_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const sessie = await prisma.sessie.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { gebruiker: true },
  });

  if (!sessie || sessie.vervaltOp <= new Date()) {
    if (sessie) {
      await prisma.sessie.delete({ where: { id: sessie.id } });
    }

    cookieStore.delete(SESSIE_COOKIE);
    return null;
  }

  return {
    id: sessie.gebruiker.id,
    gebruikersnaam: sessie.gebruiker.gebruikersnaam,
    naam: sessie.gebruiker.naam,
    wachtwoordWijzigingVereist:
      sessie.gebruiker.wachtwoordWijzigingVereist,
  };
}

export async function vereisGebruiker(): Promise<AangemeldeGebruiker> {
  const gebruiker = await huidigeGebruiker();

  if (!gebruiker) {
    redirect("/login");
  }

  return gebruiker;
}

export async function wisHuidigeSessie(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSIE_COOKIE)?.value;

  if (token) {
    await prisma.sessie.deleteMany({
      where: { tokenHash: hashToken(token) },
    });
  }

  cookieStore.delete(SESSIE_COOKIE);
}
