import { cn } from "@/lib/utils";

export function Marcador({ cor, children }: { cor: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-foreground">
      <span className={cn("size-2.5 shrink-0 rounded-full", cor)} aria-hidden="true" />
      {children}
    </span>
  );
}
