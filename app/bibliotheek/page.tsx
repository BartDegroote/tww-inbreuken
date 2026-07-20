import { vereisGebruiker } from "@/lib/auth";
import { haalBibliotheekGegevensOp } from "@/lib/bibliotheek-data";

import BibliotheekClient from "./BibliotheekClient";

export const dynamic = "force-dynamic";

export default async function BibliotheekPagina() {
  await vereisGebruiker();

  const { wetgevingen, boeken, titels, inbreuken } =
    await haalBibliotheekGegevensOp();

  return (
    <BibliotheekClient
      startWetgevingen={wetgevingen}
      startBoeken={boeken}
      startTitels={titels}
      startInbreuken={inbreuken}
    />
  );
}
