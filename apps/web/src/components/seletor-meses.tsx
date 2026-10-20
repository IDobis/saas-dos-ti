"use client";

import { useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function iso(ano: number, mes: number) {
  return `${ano}-${String(mes + 1).padStart(2, "0")}`;
}

function partes(valor: string) {
  const [ano, mes] = valor.split("-").map(Number);
  return { ano, mes: mes - 1 };
}

function deslocar(valor: string, meses: number) {
  const { ano, mes } = partes(valor);
  const data = new Date(ano, mes + meses, 1);
  return iso(data.getFullYear(), data.getMonth());
}

function distancia(de: string, ate: string) {
  const a = partes(de);
  const b = partes(ate);
  return (b.ano - a.ano) * 12 + (b.mes - a.mes) + 1;
}

function rotulo(de: string, ate: string) {
  const a = partes(de);
  const b = partes(ate);
  if (de === ate) return `${MESES[a.mes]} ${a.ano}`;
  if (a.ano === b.ano) return `${MESES[a.mes]} – ${MESES[b.mes]} ${b.ano}`;
  return `${MESES[a.mes]} ${a.ano} – ${MESES[b.mes]} ${b.ano}`;
}

export function SeletorMeses({
  de,
  ate,
  max,
  onChange,
}: {
  de: string;
  ate: string;
  /** Último mês selecionável (YYYY-MM). */
  max: string;
  onChange: (de: string, ate: string) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [ano, setAno] = useState(() => partes(ate).ano);
  const [ancora, setAncora] = useState<string | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);
  const anoMax = partes(max).ano;

  const atalhos = [
    { rotulo: "3 meses", de: deslocar(max, -2) },
    { rotulo: "6 meses", de: deslocar(max, -5) },
    { rotulo: "12 meses", de: deslocar(max, -11) },
    { rotulo: "Este ano", de: iso(anoMax, 0) },
  ];

  // Enquanto escolhe o fim, o intervalo acompanha o cursor.
  const [inicio, fim] = ancora && sobre ? [ancora, sobre].sort() : [de, ate];

  function alternar(proximo: boolean) {
    setAberto(proximo);
    if (proximo) setAno(partes(ate).ano);
    setAncora(null);
    setSobre(null);
  }

  function escolher(mes: string) {
    if (!ancora) {
      setAncora(mes);
      setSobre(mes);
      onChange(mes, mes);
      return;
    }
    const [a, b] = [ancora, mes].sort();
    onChange(a, b);
    alternar(false);
  }

  return (
    <Popover.Root open={aberto} onOpenChange={alternar}>
      <Popover.Trigger
        className={cn(
          "flex h-10 w-full items-center gap-2.5 rounded-lg border border-input bg-card px-3 text-left text-sm transition-colors outline-none",
          "hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:bg-muted/60 dark:bg-input/30",
        )}
      >
        <CalendarRange className="size-4 text-muted-foreground" />
        <span className="flex-1 font-medium">{rotulo(de, ate)}</span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {distancia(de, ate)} {distancia(de, ate) === 1 ? "mês" : "meses"}
        </span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} align="start" className="z-50">
          <Popover.Popup
            className={cn(
              "w-(--anchor-width) min-w-72 origin-(--transform-origin) rounded-2xl p-3 text-sm outline-none",
              "border border-white/70 bg-white/60 shadow-[0_12px_40px_-8px_rgb(0_0_0/0.18),inset_0_1px_0_rgb(255_255_255/0.8)] backdrop-blur-2xl backdrop-saturate-150",
              "dark:border-white/10 dark:bg-neutral-900/55 dark:shadow-[0_12px_40px_-8px_rgb(0_0_0/0.6),inset_0_1px_0_rgb(255_255_255/0.07)]",
              "duration-150 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            )}
          >
            <div className="flex items-center justify-between pb-2">
              <BotaoAno aria-label="Ano anterior" onClick={() => setAno(ano - 1)}>
                <ChevronLeft className="size-4" />
              </BotaoAno>
              <span className="font-medium tabular-nums">{ano}</span>
              <BotaoAno aria-label="Próximo ano" onClick={() => setAno(ano + 1)} disabled={ano >= anoMax}>
                <ChevronRight className="size-4" />
              </BotaoAno>
            </div>

            <div className="grid grid-cols-3 gap-1" onMouseLeave={() => ancora && setSobre(ancora)}>
              {MESES.map((nome, i) => {
                const mes = iso(ano, i);
                const ponta = mes === inicio || mes === fim;
                const meio = mes > inicio && mes < fim;
                return (
                  <button
                    key={mes}
                    type="button"
                    disabled={mes > max}
                    onClick={() => escolher(mes)}
                    onMouseEnter={() => ancora && setSobre(mes)}
                    className={cn(
                      "relative h-9 rounded-lg capitalize transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                      "disabled:pointer-events-none disabled:opacity-30",
                      ponta && "bg-primary font-medium text-primary-foreground shadow-sm",
                      meio && "bg-primary/10 dark:bg-white/10",
                      !ponta && !meio && "hover:bg-black/5 dark:hover:bg-white/10",
                    )}
                  >
                    {nome}
                    {mes === max && (
                      <span
                        aria-hidden="true"
                        className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-brand-amber"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex items-center gap-1 border-t border-black/5 pt-3 dark:border-white/10">
              {ancora ? (
                <p className="px-1 text-xs text-muted-foreground">Agora escolha o mês final</p>
              ) : (
                atalhos.map((atalho) => {
                  const ativo = de === atalho.de && ate === max;
                  return (
                    <button
                      key={atalho.rotulo}
                      type="button"
                      onClick={() => {
                        onChange(atalho.de, max);
                        alternar(false);
                      }}
                      className={cn(
                        "flex-1 rounded-md px-1.5 py-1 text-xs whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                        ativo
                          ? "bg-foreground/10 font-medium text-foreground dark:bg-white/15"
                          : "text-muted-foreground hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10",
                      )}
                    >
                      {atalho.rotulo}
                    </button>
                  );
                })
              )}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function BotaoAno(props: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      {...props}
      className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-black/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:opacity-30 dark:hover:bg-white/10"
    />
  );
}
