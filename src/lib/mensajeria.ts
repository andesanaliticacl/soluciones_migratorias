import { esDemo } from "./store";

// WhatsApp Business Cloud API (plantillas) y correo por Resend.
// En modo demo solo se imprimen en consola.

export function whatsappConfigurado(): boolean {
  return esDemo() || (!!process.env.WHATSAPP_TOKEN && !!process.env.WHATSAPP_PHONE_NUMBER_ID);
}

export function correoConfigurado(): boolean {
  return esDemo() || (!!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM);
}

export async function enviarPlantillaWhatsApp(destino: string, plantilla: string, parametros: string[]): Promise<void> {
  if (esDemo()) {
    console.log(`[demo] WhatsApp a ${destino} · plantilla ${plantilla}:`, parametros);
    return;
  }
  const version = process.env.WHATSAPP_API_VERSION || "v23.0";
  const respuesta = await fetch(`https://graph.facebook.com/${version}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: destino.replace(/\D/g, ""),
      type: "template",
      template: {
        name: plantilla,
        language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "es" },
        components: [
          {
            type: "body",
            // Meta rechaza parámetros con saltos de línea o tabulaciones.
            parameters: parametros.map((text) => ({ type: "text", text: text.replace(/\s+/g, " ").trim() })),
          },
        ],
      },
    }),
  });
  if (!respuesta.ok) throw new Error(`WhatsApp ${respuesta.status}: ${await respuesta.text()}`);
}

export async function enviarCorreo(destino: string, asunto: string, html: string): Promise<void> {
  if (esDemo()) {
    console.log(`[demo] Correo a ${destino}: ${asunto}`);
    return;
  }
  const respuesta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [destino], subject: asunto, html }),
  });
  if (!respuesta.ok) throw new Error(`Resend ${respuesta.status}: ${await respuesta.text()}`);
}

export function escaparHtml(texto: string): string {
  return texto.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function plantillaCorreo(titulo: string, filas: [string, string][], cuerpo: string, boton?: { texto: string; url: string }): string {
  const tabla = filas
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 0;color:#64748b;font-size:14px">${escaparHtml(k)}</td><td style="padding:8px 0;color:#0b1f3a;font-size:14px;font-weight:600;text-align:right">${escaparHtml(v)}</td></tr>`,
    )
    .join("");
  const cta = boton
    ? `<p style="margin:28px 0 0"><a href="${escaparHtml(boton.url)}" style="background:#0b1f3a;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600">${escaparHtml(boton.texto)}</a></p>`
    : "";
  return `<div style="background:#f5f6f8;padding:32px 16px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:32px">
    <p style="margin:0 0 20px;font-size:15px;font-weight:700;color:#0b1f3a">Soluciones Migratorias</p>
    <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;color:#0b1f3a">${escaparHtml(titulo)}</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#334155">${escaparHtml(cuerpo)}</p>
    <table style="width:100%;border-collapse:collapse">${tabla}</table>
    ${cta}
  </div>
</div>`;
}
