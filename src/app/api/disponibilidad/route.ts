import { NextResponse } from "next/server";
import { agendaDisponible } from "@/lib/fechas";
import { parametrosAgenda, ruta } from "@/lib/servidor";
import { obtenerStore } from "@/lib/store";

export const GET = ruta(async () => {
  const store = await obtenerStore();
  const [parametros, ocupados] = await Promise.all([parametrosAgenda(store), store.horariosOcupados()]);
  return NextResponse.json(
    { dias: agendaDisponible(parametros, ocupados) },
    { headers: { "Cache-Control": "no-store" } },
  );
});
