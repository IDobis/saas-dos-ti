import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { BASE, tokenStore } from "@/lib/api";

/** Chama `atualizar` quando algum chamado da organização muda, e ao reconectar (eventos perdidos). */
export function useChamadosAoVivo(atualizar: () => void) {
  const ref = useRef(atualizar);
  useEffect(() => {
    ref.current = atualizar;
  });

  useEffect(() => {
    const socket = io(new URL(BASE, window.location.href).origin, {
      auth: (enviar) => enviar({ token: tokenStore.get() }),
    });
    let espera: number | undefined;
    // junta rajadas de eventos numa consulta só
    const avisar = () => {
      window.clearTimeout(espera);
      espera = window.setTimeout(() => ref.current(), 300);
    };
    socket.on("chamados", avisar);
    socket.io.on("reconnect", avisar);
    return () => {
      window.clearTimeout(espera);
      socket.disconnect();
    };
  }, []);
}
