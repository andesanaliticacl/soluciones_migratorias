# Soluciones Migratorias

Landing cálida para un servicio legal que ayuda a extranjeros a regularizar su situación en Chile (visas, residencia, regularización y nacionalidad). El contacto principal es WhatsApp; además hay un formulario de evaluación gratuita (datos, documentos y agenda) con confirmación automática por WhatsApp y correo, y un panel de administración.

Repositorio: https://github.com/andesanaliticacl/soluciones_migratorias

Es la página hermana de Elimínate (repositorio `andesanaliticacl/eliminates`): parte de su código y cambia las problemáticas, la marca y los textos. Base de texto: https://solucionmigratoria.cl/

**Stack:** Next.js (App Router), TypeScript, Tailwind, Supabase (Postgres, Storage privado, Auth y RLS), WhatsApp Business Cloud API, Resend (correo), Vercel. Sin GSAP ni Lenis: las animaciones son CSS.

## Probarlo sin credenciales

```bash
npm install
cp .env.example .env.local
npm run dev -- -p 3010
```

Con `DEMO_MODE=true` todo funciona en local: los datos quedan en memoria (se borran al reiniciar), y los WhatsApp y correos se imprimen en la consola. El panel está en `/admin` y entra sin contraseña. Este modo se ignora en Vercel (`VERCEL=1`) y cuando hay credenciales de Supabase.

```bash
npm test
npm run typecheck
npm run build
```

## Paso 1: crear el proyecto en Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com), en una región cercana (São Paulo).
2. En **SQL Editor**, pega y ejecuta completo [`supabase/schema.sql`](supabase/schema.sql). Crea las tablas, las funciones, las políticas RLS y el bucket privado `documentos`.
3. En **Project Settings → API**, copia a tus variables de entorno:
   - Project URL → `SUPABASE_URL`
   - anon / publishable key → `SUPABASE_ANON_KEY`
   - service_role / secret key → `SUPABASE_SERVICE_ROLE_KEY` (solo servidor, nunca con prefijo `NEXT_PUBLIC_`)
4. Crea tu usuario administrador en **Authentication → Users → Add user**, con una contraseña larga. Desactiva los registros públicos en **Authentication → Sign In / Providers** (*Allow new users to sign up*).
5. Dale permisos de administrador, en SQL Editor:

   ```sql
   insert into admin_usuarios (user_id)
   select id from auth.users where email = 'tu-correo@dominio.cl';
   ```

## Paso 2: configurar WhatsApp Business

1. En [Meta for Developers](https://developers.facebook.com/apps), crea una app de tipo **Empresa** y agrega el producto **WhatsApp**.
2. Registra tu número de teléfono y copia el **Phone number ID** a `WHATSAPP_PHONE_NUMBER_ID`.
3. Crea un **usuario del sistema** en el Business Manager con permiso `whatsapp_business_messaging`, genera un token permanente y cópialo a `WHATSAPP_TOKEN`. El token temporal del panel dura 24 horas.
4. En **WhatsApp Manager → Plantillas**, envía a aprobación estas dos plantillas, categoría **Utilidad**, idioma **Español** (código `es`).

### Plantilla para la persona: `solicitud_en_curso`

```text
Hola {{1}}, recibimos tu caso ✅. Tu número de atención es {{2}}. Tu cita quedó para el {{3}} a las {{4}}. Un abogado revisará tus antecedentes y te contactará. Responde este mensaje si tienes dudas.
```

Ejemplos para la revisión de Meta: `{{1}}` María, `{{2}}` SM-000123, `{{3}}` martes 4 de noviembre, `{{4}}` 10:30.

### Plantilla para el abogado: `aviso_nueva_solicitud`

```text
Nueva solicitud {{1}}. Persona: {{2}}. Cita: {{3}}. Revisa el detalle en el panel: {{4}} . Mensaje automático de Soluciones Migratorias.
```

Ejemplos: `{{1}}` SM-000123, `{{2}}` María Pérez, `{{3}}` martes 4 de noviembre a las 10:30, `{{4}}` https://tu-dominio.cl/admin/solicitudes/ejemplo.

Si les pones otros nombres, ajusta `WHATSAPP_TEMPLATE_CLIENTE`, `WHATSAPP_TEMPLATE_ABOGADO` y `WHATSAPP_TEMPLATE_LANG`.

## Paso 3: correo y anti-spam

- **Correo:** crea una cuenta en [Resend](https://resend.com), verifica tu dominio y completa `RESEND_API_KEY` y `EMAIL_FROM`.
- **Turnstile (recomendado):** crea un widget en Cloudflare y completa `NEXT_PUBLIC_TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY`. Sin estas claves la protección queda en honeypot y rate limiting.
- **Rate limit:** define `RATE_LIMIT_SALT` con una cadena larga al azar.

## Paso 4: deploy en Vercel

1. Sube el proyecto a un repositorio de GitHub e impórtalo en [Vercel](https://vercel.com/new) con el preset **Next.js**.
2. En **Settings → Environment Variables**, carga todas las variables de `.env.example`, salvo `DEMO_MODE`. `NEXT_PUBLIC_SITE_URL` debe ser tu dominio final con `https://`.
3. Haz el deploy y conecta tu dominio.
4. Entra a `/admin/configuracion` y completa teléfono, WhatsApp, correo, dirección, logo, abogado responsable, contadores y testimonios.

Sin credenciales de Supabase la landing se muestra igual con los valores por defecto, y el formulario responde que el servicio no está configurado.

## Pendiente antes de publicar

- [ ] **Datos de contacto.** Por defecto: WhatsApp y teléfono +56 9 9234 3036; correo y dirección tomados de solucionmigratoria.cl (`contacto@solucionmigratoria.cl`, Serrano 73, oficina 507, Santiago). El sitio actual muestra otros teléfonos (+56 9 3076 5824 y +56 9 8185 8504): confirmar cuál usar y cambiarlo en el panel.
- [ ] **Dominio.** Si la página reemplaza al sitio actual en solucionmigratoria.cl, apuntar el dominio a Vercel; si no, definir el dominio.
- [ ] **Logo.** Se usa un logotipo propio (casa dorada + texto). Cargar el logo oficial desde el panel cuando esté autorizado.
- [ ] **Foto del abogado.** La tarjeta del abogado se publica solo cuando hay una foto real cargada en el panel (URL https), junto con su nombre y cargo.
- [ ] **Nombre.** El sitio actual se llama "Solución Migratoria"; esta página usa "Soluciones Migratorias", como pidió el brief. Confirmar cuál es el definitivo.
- [ ] **Nota legal.** El texto pedido decía "eliminación"; se adaptó a "La procedencia de cada recurso o trámite depende de…". Confirmar la redacción (`NOTA_LEGAL` en `src/lib/config.ts`).
- [ ] **Contadores y testimonios reales.** Los de fábrica no se publican: aparecen al guardarlos en el panel (cada testimonio con su país de origen). Usa solo cifras comprobables y testimonios autorizados. En el modo demo local se ven rotulados como "Ejemplo" para revisar el diseño.
- [ ] **Revisión legal de las páginas.** `/privacidad` y `/terminos` son borradores con campos entre corchetes y un aviso visible en la página: quita el aviso de `src/components/landing/PaginaLegal.tsx` una vez aprobados.
- [ ] **Textos legales del sitio.** Las respuestas de preguntas frecuentes y los servicios salen del sitio actual; un abogado debe confirmar que son correctos y vigentes.
- [ ] **Cobro de la gestión.** La evaluación es gratis y el sitio no cobra. Falta definir cuándo y cómo se cobra la gestión.
- [ ] Prueba de punta a punta con un WhatsApp y un correo reales.

## Cómo está organizado

| Ruta | Qué contiene |
| --- | --- |
| `src/app/page.tsx` | Landing: inicio, línea de tiempo, servicios, confianza, sello y preguntas |
| `src/components/landing/MapaHogar.tsx` | Mapa de Sudamérica: líneas desde 5 países que forman una casa en Chile (solo SVG y CSS) |
| `src/components/landing/Revelar.tsx` | Animaciones al hacer scroll (agrega `.visible` a cada `[data-revela]`) |
| `src/components/landing/Contador.tsx` | Contadores que suben al aparecer |
| `src/components/landing/DialogoEvaluacion.tsx` | Panel lateral `<dialog>` con el formulario |
| `src/components/wizard/` | Formulario de 3 pasos y confirmación |
| `src/app/api/` | Agenda, solicitudes, documentos y exportación |
| `src/lib/notificaciones.ts` | Avisos por WhatsApp y correo |
| `src/lib/store/` | Persistencia: Supabase y memoria (demo) |
| `src/app/admin/` | Panel de administración |
| `supabase/schema.sql` | Tablas, funciones y políticas RLS |

## Decisiones que conviene conocer

- **Diseño.** Azul noche por defecto (con selector a fondo claro que no se recuerda), dorado para acentos, verde para los checks, tipografía Nunito. Sin pasaportes, rejas, timbres ni radares. Con `prefers-reduced-motion` todo se muestra en su estado final, sin animar.

- **Qué quiere resolver.** Las opciones del formulario están en `MATERIAS` (`src/lib/tipos.ts`) y se validan en el servidor y en Postgres.
- **Sin doble reserva.** Lo garantiza un índice único parcial en Postgres, no el código. El horario se retiene al enviar y se confirma al terminar; si el envío queda a medias, se libera solo a los 30 minutos, sin necesidad de un cron.
- **Horario perdido.** Si al confirmar el horario ya lo tomó otra persona, la solicitud se registra igual, se marca el conflicto en el panel y se avisa por correo que se coordinará otra hora. En ese caso no se envía la plantilla de WhatsApp a la persona, porque afirma una fecha.
- **Notificaciones sin duplicados.** Cada canal se reclama en la tabla `notificaciones` antes de enviar y se suelta si falla; repetir el envío reintenta solo lo pendiente.
- **Documentos.** Suben directo a Storage con URL firmada, porque Vercel limita el cuerpo de las funciones a 4,5 MB. Después, el servidor lee el archivo y comprueba su firma binaria; si no coincide, lo borra.
- **Borrador local.** Los textos se guardan en `localStorage` hasta por 7 días. Los archivos no, por privacidad: tras recargar, se pide adjuntarlos de nuevo.
