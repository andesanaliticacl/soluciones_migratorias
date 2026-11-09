"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { clienteSesion, entrarDemo, exigirAdmin, salirDemo } from "@/lib/admin-auth";
import { huellaIp } from "@/lib/servidor";
import { esDemo, obtenerStore } from "@/lib/store";
import { ESTADOS, type EstadoSolicitud, type Horario, type Testimonio } from "@/lib/tipos";

// Cada acción es un endpoint público: todas parten verificando la sesión de administrador.

const texto = (f: FormData, clave: string, max = 300) => String(f.get(clave) ?? "").trim().slice(0, max);
function entero(f: FormData, clave: string, min: number, max: number): number {
  const n = Number(f.get(clave));
  if (!Number.isInteger(n) || n < min || n > max) throw new Error(`Valor no válido en ${clave}`);
  return n;
}

export async function iniciarSesion(formulario: FormData) {
  if (esDemo()) {
    await entrarDemo();
    redirect("/admin");
  }
  const store = await obtenerStore();
  const permitido = await store.rateLimit(`login:${huellaIp(await headers())}`, 8, 900);
  if (!permitido) redirect("/admin/login?error=limite");

  const supabase = await clienteSesion();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: texto(formulario, "correo"),
    password: String(formulario.get("clave") ?? ""),
  });
  if (error || !data.user || !(await store.esAdmin(data.user.id))) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=credenciales");
  }
  redirect("/admin");
}

export async function cerrarSesion() {
  if (esDemo()) await salirDemo();
  else await (await clienteSesion()).auth.signOut();
  redirect("/admin/login");
}

export async function cambiarEstado(formulario: FormData) {
  const admin = await exigirAdmin();
  const id = texto(formulario, "id");
  const estado = texto(formulario, "estado") as EstadoSolicitud;
  if (!ESTADOS.some((e) => e.id === estado)) throw new Error("Estado no válido");
  const store = await obtenerStore();
  await store.cambiarEstado(id, estado);
  await store.agregarNota(id, admin.correo, `Cambió el estado a "${ESTADOS.find((e) => e.id === estado)!.etiqueta}".`);
  revalidatePath(`/admin/solicitudes/${id}`);
}

export async function agregarNota(formulario: FormData) {
  const admin = await exigirAdmin();
  const id = texto(formulario, "id");
  const nota = texto(formulario, "texto", 2000);
  if (nota) await (await obtenerStore()).agregarNota(id, admin.correo, nota);
  revalidatePath(`/admin/solicitudes/${id}`);
}

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function guardarHorarios(formulario: FormData) {
  await exigirAdmin();
  const horarios: Horario[] = [0, 1, 2, 3, 4, 5, 6].map((dia_semana) => {
    const hora_inicio = texto(formulario, `inicio_${dia_semana}`);
    const hora_fin = texto(formulario, `fin_${dia_semana}`);
    if (!HORA.test(hora_inicio) || !HORA.test(hora_fin) || hora_fin <= hora_inicio) {
      throw new Error("Revisa los horarios: la hora de término debe ser posterior a la de inicio.");
    }
    return { dia_semana, activo: formulario.get(`activo_${dia_semana}`) === "on", hora_inicio, hora_fin };
  });
  const store = await obtenerStore();
  await store.guardarHorarios(horarios);
  await store.guardarConfig({
    duracion_bloque_min: entero(formulario, "duracion", 10, 240),
    dias_horizonte: entero(formulario, "horizonte", 1, 180),
  });
  revalidatePath("/admin/configuracion");
}

export async function bloquearDia(formulario: FormData) {
  await exigirAdmin();
  const fecha = texto(formulario, "fecha");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) throw new Error("Fecha no válida");
  await (await obtenerStore()).agregarBloqueado({ fecha, motivo: texto(formulario, "motivo") || null });
  revalidatePath("/admin/configuracion");
}

export async function desbloquearDia(formulario: FormData) {
  await exigirAdmin();
  await (await obtenerStore()).quitarBloqueado(texto(formulario, "fecha"));
  revalidatePath("/admin/configuracion");
}

export async function guardarContadores(formulario: FormData) {
  await exigirAdmin();
  await (await obtenerStore()).guardarConfig({
    contadores: {
      casos_evaluados: entero(formulario, "evaluados", 0, 10_000_000),
      casos_gestionados: entero(formulario, "gestionados", 0, 10_000_000),
      anos_experiencia: entero(formulario, "anos", 0, 200),
      // Al guardarlas desde el panel dejan de ser cifras de ejemplo y se quita el rótulo.
      ejemplo: false,
    },
  });
  revalidatePath("/");
  revalidatePath("/admin/configuracion");
}

export async function guardarTestimonios(formulario: FormData) {
  await exigirAdmin();
  const store = await obtenerStore();
  const anteriores = (await store.obtenerConfig()).testimonios;
  const total = entero(formulario, "total", 0, 50);
  const testimonios: Testimonio[] = [];
  for (let i = 0; i < total; i++) {
    const nombre = texto(formulario, `nombre_${i}`, 80);
    const contenido = texto(formulario, `texto_${i}`, 400);
    const pais = texto(formulario, `pais_${i}`, 60);
    if (!nombre || !contenido) continue;
    const previo = anteriores[i];
    const sinCambios = previo?.nombre === nombre && previo?.texto === contenido && previo?.pais === pais;
    testimonios.push({ nombre, pais, texto: contenido, ejemplo: sinCambios ? previo.ejemplo : false });
  }
  await store.guardarConfig({ testimonios });
  revalidatePath("/");
  revalidatePath("/admin/configuracion");
}

export async function guardarContacto(formulario: FormData) {
  await exigirAdmin();
  const logo = texto(formulario, "logo", 500);
  if (logo && !/^https?:\/\//.test(logo)) throw new Error("El logo debe ser una URL http(s).");
  const foto = texto(formulario, "abogado_foto", 500);
  if (foto && !/^https:\/\//.test(foto)) throw new Error("La foto debe ser una URL https.");
  await (await obtenerStore()).guardarConfig({
    logo_url: logo,
    contacto: {
      telefono: texto(formulario, "telefono", 40),
      whatsapp: texto(formulario, "whatsapp", 20).replace(/\D/g, ""),
      correo: texto(formulario, "correo", 120),
      direccion: texto(formulario, "direccion", 200),
    },
    abogado: {
      nombre: texto(formulario, "abogado_nombre", 120),
      cargo: texto(formulario, "abogado_cargo", 120),
      foto_url: foto,
      whatsapp: texto(formulario, "abogado_whatsapp", 20).replace(/\D/g, ""),
      correo: texto(formulario, "abogado_correo", 120),
    },
  });
  revalidatePath("/");
  revalidatePath("/admin/configuracion");
}
