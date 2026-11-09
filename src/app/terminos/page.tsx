import type { Metadata } from "next";
import { PaginaLegal } from "@/components/landing/PaginaLegal";
import { NOTA_LEGAL } from "@/lib/config";

export const metadata: Metadata = {
  title: "Términos y condiciones | Soluciones Migratorias",
  description: "Condiciones del servicio de gestión legal de Soluciones Migratorias.",
};

export default function Terminos() {
  return (
    <PaginaLegal titulo="Términos y condiciones">
      <p>Última actualización: [fecha].</p>

      <h2>El servicio</h2>
      <p>[Razón social], RUT [número], presta servicios de asesoría y representación legal en materias migratorias: recursos de protección y de amparo, solicitudes de visa, regularización y nacionalidad.</p>

      <h2>Sin garantía de resultado</h2>
      <p>{NOTA_LEGAL} La obligación de Soluciones Migratorias es de medios: gestionar tu caso con diligencia profesional, no garantizar un resultado determinado.</p>

      <h2>Evaluación y cita</h2>
      <p>La evaluación inicial y la cita son sin costo y sin compromiso. El valor total de la gestión se informa por escrito antes de iniciarla, según el trámite o recurso. Puedes reagendar tu cita avisando con [plazo] de anticipación.</p>

      <h2>Pagos y devoluciones</h2>
      <p>Si contratas la gestión, el pago se acuerda directamente con Soluciones Migratorias. Las devoluciones proceden [condiciones], sin perjuicio de los derechos que te otorga la Ley N° 19.496 sobre Protección de los Derechos de los Consumidores.</p>

      <h2>Tus obligaciones</h2>
      <p>Debes entregar información y documentos veraces y completos. Soluciones Migratorias no presenta gestiones basadas en información falsa.</p>

      <h2>Datos personales</h2>
      <p>El tratamiento de tus datos se rige por nuestra política de privacidad.</p>

      <h2>Ley aplicable</h2>
      <p>Estos términos se rigen por la ley chilena. Contacto: [correo de contacto], [dirección].</p>
    </PaginaLegal>
  );
}
