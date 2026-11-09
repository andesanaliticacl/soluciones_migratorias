import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refresca la sesión de Supabase de los administradores. No autoriza por sí mismo:
// cada página, acción y ruta de /admin llama a exigirAdmin o adminActual.
export async function proxy(request: NextRequest) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) return NextResponse.next();

  let respuesta = NextResponse.next({ request });
  const supabase = createServerClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (lista) => {
        lista.forEach(({ name, value }) => request.cookies.set(name, value));
        respuesta = NextResponse.next({ request });
        lista.forEach(({ name, value, options }) => respuesta.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();
  return respuesta;
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
