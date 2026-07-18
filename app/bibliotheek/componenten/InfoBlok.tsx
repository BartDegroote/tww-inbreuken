import type { ReactNode } from "react";

type InfoBlokProps = {
  children: ReactNode;
};

export default function InfoBlok({ children }: InfoBlokProps) {
  return (
    <aside className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-300 text-sm font-bold text-slate-700"
        >
          i
        </span>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-700">
            Extra informatie
          </p>

          <div className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-500">
            {children}
          </div>
        </div>
      </div>
    </aside>
  );
}