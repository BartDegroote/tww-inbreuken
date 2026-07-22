import Link from "next/link";

type TwwMerkProps = {
  href?: string;
  compact?: boolean;
};

function MerkInhoud({ compact = false }: Pick<TwwMerkProps, "compact">) {
  return (
    <span className="inline-flex min-w-0 items-center gap-3">
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-[11px] font-black tracking-[0.12em] text-white shadow-[0_8px_24px_rgba(29,78,216,0.22)]">
        <span className="absolute -right-3 -top-3 h-7 w-7 rounded-full border border-white/25" />
        TWW
      </span>

      <span className="min-w-0">
        <span className="block truncate text-sm font-extrabold tracking-tight text-slate-950 sm:text-base">
          WebApp TWW
        </span>
        {!compact && (
          <span className="mt-0.5 block truncate text-xs font-medium text-slate-500">
            Inspectie &amp; verslaggeving
          </span>
        )}
      </span>
    </span>
  );
}

export default function TwwMerk({ href, compact = false }: TwwMerkProps) {
  if (href) {
    return (
      <Link
        href={href}
        aria-label="Naar het hoofdmenu"
        className="rounded-xl outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        <MerkInhoud compact={compact} />
      </Link>
    );
  }

  return <MerkInhoud compact={compact} />;
}
