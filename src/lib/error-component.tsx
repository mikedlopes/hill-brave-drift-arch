import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-fg">
      <span className="text-filament" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="text-lg font-medium">Something went wrong</h1>
      <p className="max-w-md text-sm leading-relaxed break-words text-muted">
        {error.message || "Reload the page and try again. Your printable STLs are unchanged."}
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-2 flex min-h-11 items-center justify-center rounded-sm bg-filament px-4 text-sm font-medium text-filament-fg hover:bg-filament-deep"
      >
        Reload
      </button>
    </main>
  );
}
