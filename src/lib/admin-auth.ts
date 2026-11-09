import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { esDemo, obtenerStore } from "./store";

const COOKIE_DEMO = "migratoria_demo_admin";

export async function clienteSesion() {
  const almacen = await cookies();
  return createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => almacen.getAll(),
      setAll: (lista) => {
        // En un Server Component no se pueden escribir cookies; de refrescarlas se encarga src/proxy.ts.
        try {
          lista.forEach(({ name, value, options }) => almacen.set(name, value, options));
        } catch {}
      },
    },
  });
}

export interface AdminActual {
  id: string;
  correo: string;
}

export async function adminActual(): Promise<AdminActual | null> {
  if (esDemo()) {
    const almacen = await cookies();
    return almacen.get(COOKIE_DEMO)?.value === "1" ? { id: "demo", correo: "demo@local" } : null;
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) return null;

  const supabase = await clienteSesion();
  // getUser valida el JWT contra Supabase; getSession solo leería la cookie sin verificarla.
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const store = await obtenerStore();
  if (!(await store.esAdmin(data.user.id))) return null;
  return { id: data.user.id, correo: data.user.email ?? "admin" };
}

export async function exigirAdmin(): Promise<AdminActual> {
  const admin = await adminActual();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function entrarDemo() {
  if (!esDemo()) throw new Error("Solo disponible en modo demo");
  const almacen = await cookies();
  almacen.set(COOKIE_DEMO, "1", { httpOnly: true, sameSite: "lax", path: "/" });
}

export async function salirDemo() {
  const almacen = await cookies();
  almacen.delete(COOKIE_DEMO);
}
