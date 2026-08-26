import type JSZip from "jszip";

export const ROKEN_SJABLOON_PAD =
  "/sjablonen/105-roken-sjabloon.dotx";
export const ROKEN_SJABLOON_SHA256 =
  "f30193f277b1bc3b943e5905ba8b4bebc31213b84ee03c528929528499591902";
export const MAX_WORD_LOCATIE_BREEDTESCORE = 63.5;
export const MAX_FLOW_VOLGNUMMER_TEKENS = 8;

export type RokenRapportGegevens = {
  onderneming: string;
  straatEnNummer: string;
  postcode: string;
  plaats: string;
  kboNummer: string;
  flow: string;
  rapportDatum: string;
  vaststellingsDatum: string;
  werkruimte: string;
  locatie: string;
  tijdstip: string;
  nummerplaat: string;
};

export async function controleerRokenSjabloonIntegriteit(
  sjabloon: ArrayBuffer,
): Promise<void> {
  const hash = await globalThis.crypto.subtle.digest("SHA-256", sjabloon);
  const hashHex = Array.from(new Uint8Array(hash), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

  if (hashHex !== ROKEN_SJABLOON_SHA256) {
    throw new Error(
      "Het Word-sjabloon wijkt af van het goedgekeurde origineel. De brief werd daarom niet aangemaakt.",
    );
  }
}

type TekstNode = {
  begin: number;
  inhoudBegin: number;
  inhoudEinde: number;
  einde: number;
  tekst: string;
};

function decodeerXmlTekst(waarde: string): string {
  return waarde.replace(
    /&(?:amp|lt|gt|quot|apos);|&#(?:x[0-9a-fA-F]+|[0-9]+);/g,
    (entiteit) => {
      if (entiteit === "&amp;") return "&";
      if (entiteit === "&lt;") return "<";
      if (entiteit === "&gt;") return ">";
      if (entiteit === "&quot;") return '"';
      if (entiteit === "&apos;") return "'";

      const hexadecimaal = entiteit.startsWith("&#x");
      const code = Number.parseInt(
        entiteit.slice(hexadecimaal ? 3 : 2, -1),
        hexadecimaal ? 16 : 10,
      );

      return Number.isFinite(code)
        ? String.fromCodePoint(code)
        : entiteit;
    },
  );
}

function encodeerXmlTekst(waarde: string): string {
  return waarde
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function leesTekstNodes(xmlFragment: string): TekstNode[] {
  const nodes: TekstNode[] = [];
  const patroon = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g;

  for (const match of xmlFragment.matchAll(patroon)) {
    if (match.index === undefined) continue;

    const volledigeNode = match[0];
    const gecodeerdeTekst = match[1];
    const openingsEinde = volledigeNode.indexOf(">") + 1;
    const inhoudBegin = match.index + openingsEinde;

    nodes.push({
      begin: match.index,
      inhoudBegin,
      inhoudEinde: inhoudBegin + gecodeerdeTekst.length,
      einde: match.index + volledigeNode.length,
      tekst: decodeerXmlTekst(gecodeerdeTekst),
    });
  }

  return nodes;
}

function vervangEersteVoorkomenInAlinea(
  alineaXml: string,
  zoektekst: string,
  nieuweTekst: string,
): { xml: string; vervangen: boolean } {
  const nodes = leesTekstNodes(alineaXml);
  const zichtbareTekst = nodes.map((node) => node.tekst).join("");
  const begin = zichtbareTekst.indexOf(zoektekst);

  if (begin < 0) {
    return { xml: alineaXml, vervangen: false };
  }

  const einde = begin + zoektekst.length;
  let tekenPositie = 0;
  let beginNode = -1;
  let eindeNode = -1;
  let beginOffset = 0;
  let eindeOffset = 0;

  nodes.forEach((node, index) => {
    const nodeBegin = tekenPositie;
    const nodeEinde = tekenPositie + node.tekst.length;

    if (beginNode < 0 && begin >= nodeBegin && begin < nodeEinde) {
      beginNode = index;
      beginOffset = begin - nodeBegin;
    }

    if (eindeNode < 0 && einde > nodeBegin && einde <= nodeEinde) {
      eindeNode = index;
      eindeOffset = einde - nodeBegin;
    }

    tekenPositie = nodeEinde;
  });

  if (beginNode < 0 || eindeNode < 0) {
    throw new Error(`De invulplaats “${zoektekst}” kon niet veilig worden verwerkt.`);
  }

  const aanpassingen: Array<{
    begin: number;
    einde: number;
    inhoud: string;
  }> = [];

  for (let index = beginNode; index <= eindeNode; index += 1) {
    const node = nodes[index];
    const voorvoegsel =
      index === beginNode ? node.tekst.slice(0, beginOffset) : "";
    const achtervoegsel =
      index === eindeNode ? node.tekst.slice(eindeOffset) : "";

    aanpassingen.push({
      begin: node.inhoudBegin,
      einde: node.inhoudEinde,
      inhoud: encodeerXmlTekst(
        index === beginNode
          ? `${voorvoegsel}${nieuweTekst}${achtervoegsel}`
          : achtervoegsel,
      ),
    });
  }

  let aangepast = alineaXml;

  for (const aanpassing of aanpassingen.reverse()) {
    aangepast =
      aangepast.slice(0, aanpassing.begin) +
      aanpassing.inhoud +
      aangepast.slice(aanpassing.einde);
  }

  return { xml: aangepast, vervangen: true };
}

function vervangOverWordRuns(
  xml: string,
  zoektekst: string,
  nieuweTekst: string,
): { xml: string; aantal: number } {
  let aantal = 0;

  const aangepast = xml.replace(
    /<w:p\b[\s\S]*?<\/w:p>/g,
    (oorspronkelijkeAlinea) => {
      let alinea = oorspronkelijkeAlinea;

      while (true) {
        const resultaat = vervangEersteVoorkomenInAlinea(
          alinea,
          zoektekst,
          nieuweTekst,
        );

        if (!resultaat.vervangen) break;

        alinea = resultaat.xml;
        aantal += 1;
      }

      return alinea;
    },
  );

  return { xml: aangepast, aantal };
}

function pasVervangingToe(
  xml: string,
  zoektekst: string,
  nieuweTekst: string,
  verwachtAantal: number,
): string {
  const resultaat = vervangOverWordRuns(xml, zoektekst, nieuweTekst);

  if (resultaat.aantal !== verwachtAantal) {
    throw new Error(
      `Het Word-sjabloon bevat ${resultaat.aantal} in plaats van ${verwachtAantal} verwachte invulplaats(en) voor “${zoektekst}”.`,
    );
  }

  return resultaat.xml;
}

function verplichtZipOnderdeel(zip: JSZip, pad: string) {
  const onderdeel = zip.file(pad);

  if (!onderdeel) {
    throw new Error(`Het Word-sjabloon mist het onderdeel “${pad}”.`);
  }

  return onderdeel;
}

export function formatteerRapportDatum(datum = new Date()): string {
  return [
    String(datum.getDate()).padStart(2, "0"),
    String(datum.getMonth() + 1).padStart(2, "0"),
    String(datum.getFullYear()),
  ].join("/");
}

function veiligeBestandsnaam(waarde: string): string {
  return (
    waarde
      .normalize("NFKC")
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "rapport"
  );
}

export function maakRokenWordBestandsnaam(
  flow: string,
  onderneming: string,
): string {
  const flowDeel = veiligeBestandsnaam(flow.replaceAll("/", " "));
  const ondernemingDeel = veiligeBestandsnaam(onderneming.toUpperCase());

  return `${flowDeel} 105 ${ondernemingDeel}.docx`;
}

export async function maakRokenDocxBuffer(
  sjabloon: ArrayBuffer,
  gegevens: RokenRapportGegevens,
): Promise<ArrayBuffer> {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(sjabloon);
  const documentOnderdeel = verplichtZipOnderdeel(zip, "word/document.xml");
  const footerOnderdeel = verplichtZipOnderdeel(zip, "word/footer1.xml");
  const contentTypesOnderdeel = verplichtZipOnderdeel(zip, "[Content_Types].xml");

  let documentXml = await documentOnderdeel.async("string");
  let footerXml = await footerOnderdeel.async("string");
  let contentTypesXml = await contentTypesOnderdeel.async("string");

  const postcodePlaats = `${gegevens.postcode} ${gegevens.plaats}`.trim();

  documentXml = pasVervangingToe(
    documentXml,
    "Bedrijfsnaam",
    gegevens.onderneming,
    1,
  );
  documentXml = pasVervangingToe(
    documentXml,
    "Straat nummer",
    gegevens.straatEnNummer,
    1,
  );
  documentXml = pasVervangingToe(
    documentXml,
    "Postcode Plaats",
    postcodePlaats,
    1,
  );
  documentXml = pasVervangingToe(
    documentXml,
    "****.***.***",
    gegevens.kboNummer,
    1,
  );
  documentXml = pasVervangingToe(
    documentXml,
    "02/2026/****",
    gegevens.flow,
    2,
  );
  documentXml = pasVervangingToe(
    documentXml,
    "**/**/****",
    gegevens.rapportDatum,
    1,
  );
  documentXml = pasVervangingToe(
    documentXml,
    "**/**/2026",
    gegevens.vaststellingsDatum,
    1,
  );
  // De juridische alinea's worden niet vervangen: ze blijven exact zoals in
  // het goedgekeurde Word-sjabloon, inclusief opmaak en paginabudget.
  documentXml = pasVervangingToe(
    documentXml,
    "Cabine van een bedrijfswagen",
    gegevens.werkruimte,
    1,
  );
  documentXml = pasVervangingToe(
    documentXml,
    "*** ter hoogte van ****",
    gegevens.locatie,
    1,
  );
  documentXml = pasVervangingToe(
    documentXml,
    "**u**",
    gegevens.tijdstip,
    1,
  );
  documentXml = pasVervangingToe(
    documentXml,
    "*-***-***",
    gegevens.nummerplaat,
    1,
  );
  footerXml = pasVervangingToe(
    footerXml,
    "02/2026/****",
    gegevens.flow,
    1,
  );

  const templateContentType =
    "application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml";
  const documentContentType =
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml";

  if (!contentTypesXml.includes(templateContentType)) {
    throw new Error("Het aangeleverde bestand is niet langer het verwachte Word-sjabloon.");
  }

  contentTypesXml = contentTypesXml.replace(
    templateContentType,
    documentContentType,
  );

  zip.file("word/document.xml", documentXml);
  zip.file("word/footer1.xml", footerXml);
  zip.file("[Content_Types].xml", contentTypesXml);

  return zip.generateAsync({
    type: "arraybuffer",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}
