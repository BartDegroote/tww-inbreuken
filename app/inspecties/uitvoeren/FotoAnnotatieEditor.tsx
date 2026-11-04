"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

type FotoBron = {
  naam: string;
  url?: string;
  bestand?: File;
};

type Punt = {
  x: number;
  y: number;
};

type Pijl = {
  begin: Punt;
  einde: Punt;
};

type FotoAnnotatieEditorProps = {
  foto: FotoBron;
  onAnnuleren: () => void;
  onOpslaan: (bestand: File) => void;
};

const MAXIMALE_AFBEELDINGSAFMETING = 2400;

function begrens(waarde: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, waarde));
}

function aangeduideBestandsnaam(naam: string): string {
  const zonderExtensie = naam.replace(/\.[^.]+$/, "");
  const basis = zonderExtensie.replace(/-aangeduid$/i, "");
  return `${basis}-aangeduid.jpg`;
}

function tekenPijl(
  context: CanvasRenderingContext2D,
  pijl: Pijl,
  korteZijde: number,
) {
  const hoek = Math.atan2(
    pijl.einde.y - pijl.begin.y,
    pijl.einde.x - pijl.begin.x,
  );
  const lijndikte = begrens(korteZijde * 0.012, 9, 30);
  const randdikte = begrens(lijndikte * 0.48, 4, 12);
  const pijlpuntLengte = begrens(korteZijde * 0.065, 38, 150);
  const pijlpuntHoek = Math.PI / 6.5;

  const tekenLijnen = (kleur: string, breedte: number) => {
    context.beginPath();
    context.moveTo(pijl.begin.x, pijl.begin.y);
    context.lineTo(pijl.einde.x, pijl.einde.y);
    context.moveTo(pijl.einde.x, pijl.einde.y);
    context.lineTo(
      pijl.einde.x -
        pijlpuntLengte * Math.cos(hoek - pijlpuntHoek),
      pijl.einde.y -
        pijlpuntLengte * Math.sin(hoek - pijlpuntHoek),
    );
    context.moveTo(pijl.einde.x, pijl.einde.y);
    context.lineTo(
      pijl.einde.x -
        pijlpuntLengte * Math.cos(hoek + pijlpuntHoek),
      pijl.einde.y -
        pijlpuntLengte * Math.sin(hoek + pijlpuntHoek),
    );
    context.strokeStyle = kleur;
    context.lineWidth = breedte;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.stroke();
  };

  // De witte buitenrand houdt de rode pijl zichtbaar op zowel donkere als
  // lichte foto's.
  tekenLijnen("#ffffff", lijndikte + randdikte * 2);
  tekenLijnen("#ef233c", lijndikte);
}

export default function FotoAnnotatieEditor({
  foto,
  onAnnuleren,
  onOpslaan,
}: FotoAnnotatieEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const afbeeldingRef = useRef<HTMLImageElement | null>(null);
  const pijlenRef = useRef<Pijl[]>([]);
  const actievePijlRef = useRef<Pijl | null>(null);
  const actievePointerRef = useRef<number | null>(null);
  const [pijlen, setPijlen] = useState<Pijl[]>([]);
  const [geladen, setGeladen] = useState(false);
  const [bezigMetOpslaan, setBezigMetOpslaan] = useState(false);
  const [fout, setFout] = useState("");

  const tekenCanvas = useCallback((tijdelijkePijl: Pijl | null = null) => {
    const canvas = canvasRef.current;
    const afbeelding = afbeeldingRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !afbeelding || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(afbeelding, 0, 0, canvas.width, canvas.height);

    const korteZijde = Math.min(canvas.width, canvas.height);
    pijlenRef.current.forEach((pijl) =>
      tekenPijl(context, pijl, korteZijde),
    );
    if (tijdelijkePijl) tekenPijl(context, tijdelijkePijl, korteZijde);
  }, []);

  useEffect(() => {
    let geannuleerd = false;
    let objectUrl = "";

    async function laadFoto() {
      try {
        setFout("");
        let blob: Blob | undefined = foto.bestand;

        if (!blob && foto.url) {
          const response = await fetch(foto.url);
          if (!response.ok) {
            throw new Error("De foto kon niet worden geopend.");
          }
          blob = await response.blob();
        }

        if (!blob) throw new Error("De foto kon niet worden geopend.");

        objectUrl = URL.createObjectURL(blob);
        const afbeelding = new Image();
        afbeelding.decoding = "async";
        afbeelding.src = objectUrl;
        await afbeelding.decode();

        if (geannuleerd) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const langsteZijde = Math.max(
          afbeelding.naturalWidth,
          afbeelding.naturalHeight,
        );
        const schaal = Math.min(
          1,
          MAXIMALE_AFBEELDINGSAFMETING / langsteZijde,
        );
        canvas.width = Math.max(
          1,
          Math.round(afbeelding.naturalWidth * schaal),
        );
        canvas.height = Math.max(
          1,
          Math.round(afbeelding.naturalHeight * schaal),
        );
        afbeeldingRef.current = afbeelding;
        tekenCanvas();
        setGeladen(true);
      } catch (error) {
        if (!geannuleerd) {
          setFout(
            error instanceof Error
              ? error.message
              : "De foto kon niet worden geopend.",
          );
        }
      }
    }

    void laadFoto();

    return () => {
      geannuleerd = true;
      afbeeldingRef.current = null;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [foto.bestand, foto.url, tekenCanvas]);

  useEffect(() => {
    const vorigeOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const sluitMetEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !bezigMetOpslaan) onAnnuleren();
    };
    window.addEventListener("keydown", sluitMetEscape);

    return () => {
      document.body.style.overflow = vorigeOverflow;
      window.removeEventListener("keydown", sluitMetEscape);
    };
  }, [bezigMetOpslaan, onAnnuleren]);

  function canvasPunt(event: ReactPointerEvent<HTMLCanvasElement>): Punt {
    const canvas = event.currentTarget;
    const rechthoek = canvas.getBoundingClientRect();

    return {
      x:
        (event.clientX - rechthoek.left) *
        (canvas.width / rechthoek.width),
      y:
        (event.clientY - rechthoek.top) *
        (canvas.height / rechthoek.height),
    };
  }

  function startPijl(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!geladen) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const begin = canvasPunt(event);
    actievePointerRef.current = event.pointerId;
    actievePijlRef.current = { begin, einde: begin };
    tekenCanvas(actievePijlRef.current);
  }

  function verplaatsPijl(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (actievePointerRef.current !== event.pointerId) return;
    event.preventDefault();
    const actievePijl = actievePijlRef.current;
    if (!actievePijl) return;

    actievePijlRef.current = {
      ...actievePijl,
      einde: canvasPunt(event),
    };
    tekenCanvas(actievePijlRef.current);
  }

  function voltooiPijl(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (actievePointerRef.current !== event.pointerId) return;
    event.preventDefault();
    const canvas = event.currentTarget;
    const actievePijl = actievePijlRef.current;

    actievePointerRef.current = null;
    actievePijlRef.current = null;
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }

    if (!actievePijl) {
      tekenCanvas();
      return;
    }

    const afstand = Math.hypot(
      actievePijl.einde.x - actievePijl.begin.x,
      actievePijl.einde.y - actievePijl.begin.y,
    );
    const minimaleAfstand =
      (18 * canvas.width) / canvas.getBoundingClientRect().width;

    if (afstand < minimaleAfstand) {
      tekenCanvas();
      return;
    }

    const volgendePijlen = [...pijlenRef.current, actievePijl];
    pijlenRef.current = volgendePijlen;
    setPijlen(volgendePijlen);
    tekenCanvas();
  }

  function annuleerActievePijl(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (actievePointerRef.current !== event.pointerId) return;
    actievePointerRef.current = null;
    actievePijlRef.current = null;
    tekenCanvas();
  }

  function maakLaatstePijlOngedaan() {
    const volgendePijlen = pijlenRef.current.slice(0, -1);
    pijlenRef.current = volgendePijlen;
    setPijlen(volgendePijlen);
    tekenCanvas();
  }

  function wisPijlen() {
    pijlenRef.current = [];
    setPijlen([]);
    tekenCanvas();
  }

  async function slaFotoOp() {
    const canvas = canvasRef.current;
    if (!canvas || pijlenRef.current.length === 0) return;

    setBezigMetOpslaan(true);
    setFout("");

    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (resultaat) =>
            resultaat
              ? resolve(resultaat)
              : reject(new Error("De aangeduide foto kon niet worden gemaakt.")),
          "image/jpeg",
          0.92,
        );
      });
      onOpslaan(
        new File([blob], aangeduideBestandsnaam(foto.naam), {
          type: "image/jpeg",
        }),
      );
    } catch (error) {
      setFout(
        error instanceof Error
          ? error.message
          : "De aangeduide foto kon niet worden gemaakt.",
      );
      setBezigMetOpslaan(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 p-2 backdrop-blur-sm sm:p-5">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="foto-annotatie-titel"
        className="flex max-h-[calc(100dvh-1rem)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl sm:max-h-[calc(100dvh-2.5rem)]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              Foto aanduiden
            </p>
            <h2
              id="foto-annotatie-titel"
              className="mt-1 truncate text-lg font-bold text-slate-950 sm:text-xl"
            >
              {foto.naam}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Sleep van de staart naar het punt dat je wilt aanduiden.
            </p>
          </div>

          <button
            type="button"
            onClick={onAnnuleren}
            disabled={bezigMetOpslaan}
            aria-label="Foto sluiten zonder wijzigingen"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-2xl text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
          >
            ×
          </button>
        </header>

        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-auto bg-slate-950 p-2 sm:p-4">
          {!geladen && !fout && (
            <p className="rounded-lg bg-white/10 px-4 py-3 text-sm font-semibold text-white">
              Foto laden…
            </p>
          )}

          {fout ? (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
              {fout}
            </p>
          ) : (
            <canvas
              ref={canvasRef}
              role="img"
              aria-label="Foto waarop je een rode pijl met witte rand kunt tekenen"
              onPointerDown={startPijl}
              onPointerMove={verplaatsPijl}
              onPointerUp={voltooiPijl}
              onPointerCancel={annuleerActievePijl}
              className={`max-h-[calc(100dvh-15rem)] max-w-full select-none object-contain shadow-2xl [touch-action:none] ${
                geladen ? "cursor-crosshair" : "invisible"
              }`}
            />
          )}
        </div>

        <footer className="border-t border-slate-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                <span className="h-3 w-3 rounded-full border-2 border-white bg-[#ef233c] shadow" />
                Rode pijl met witte rand
              </span>
              <button
                type="button"
                onClick={maakLaatstePijlOngedaan}
                disabled={pijlen.length === 0 || bezigMetOpslaan}
                className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Ongedaan maken
              </button>
              <button
                type="button"
                onClick={wisPijlen}
                disabled={pijlen.length === 0 || bezigMetOpslaan}
                className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Pijlen wissen
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
              <button
                type="button"
                onClick={onAnnuleren}
                disabled={bezigMetOpslaan}
                className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Annuleren
              </button>
              <button
                type="button"
                onClick={() => void slaFotoOp()}
                disabled={pijlen.length === 0 || bezigMetOpslaan || !geladen}
                className="min-h-11 rounded-lg bg-blue-700 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {bezigMetOpslaan ? "Foto verwerken…" : "Aanduiding opslaan"}
              </button>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}
