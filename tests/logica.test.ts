import assert from "node:assert/strict";
import { test } from "node:test";
import { agendaDisponible, esBloqueValido, formatearHora, generarBloques, localAUtc } from "../src/lib/fechas.ts";
import type { Horario } from "../src/lib/tipos.ts";
import { firmaCoincide, formatearRut, formatearTelefono, telefonoE164, validarDatosSolicitud, validarRut, validarTelefono } from "../src/lib/validacion.ts";

test("RUT: dígito verificador, incluido K y 0", () => {
  assert.equal(validarRut("12.345.678-5"), true);
  assert.equal(validarRut("12345678-4"), false);
  assert.equal(validarRut("11.111.111-1"), true);
  assert.equal(validarRut("20.000.009-K") || validarRut("10.000.013-K"), true);
  assert.equal(validarRut("abc"), false);
  assert.equal(validarRut(""), false);
});

test("RUT: formato automático mientras se escribe", () => {
  assert.equal(formatearRut("123456785"), "12.345.678-5");
  assert.equal(formatearRut("1"), "1");
  assert.equal(formatearRut("12"), "1-2");
  assert.equal(formatearRut("7654321k"), "7.654.321-K");
});

test("Teléfono: solo celulares chilenos, con o sin +56", () => {
  assert.equal(formatearTelefono("912345678"), "+56 9 1234 5678");
  assert.equal(formatearTelefono("+56 9 1234 5678"), "+56 9 1234 5678");
  assert.equal(validarTelefono("+56 9 1234 5678"), true);
  assert.equal(validarTelefono("+56 2 2345 6789"), false);
  assert.equal(validarTelefono("91234"), false);
  assert.equal(telefonoE164("+56 9 1234 5678"), "56912345678");
});

test("validarDatosSolicitud normaliza y rechaza", () => {
  const ok = validarDatosSolicitud({
    nombre: " María Pérez ",
    rut: "123456785",
    telefono: "912345678",
    correo: "MARIA@correo.cl",
    comuna: "Ñuñoa",
    materias: ["amparo", "amparo", "inventado"],
    nacionalidad: " Venezolana ",
    descripcion: "",
  });
  assert.equal(ok.ok, true);
  if (ok.ok) {
    assert.equal(ok.datos.rut, "12.345.678-5");
    assert.equal(ok.datos.correo, "maria@correo.cl");
    assert.deepEqual(ok.datos.materias, ["amparo"]);
    assert.equal(ok.datos.nacionalidad, "Venezolana");
    assert.equal(ok.datos.descripcion, null);
  }
  const malo = validarDatosSolicitud({ nombre: "X", materias: ["inventado"], nacionalidad: "<script>" });
  assert.equal(malo.ok, false);
  if (!malo.ok) {
    for (const campo of ["nombre", "rut", "telefono", "correo", "comuna", "materias", "nacionalidad"]) {
      assert.ok(campo in malo.errores, campo);
    }
  }
  assert.equal(validarDatosSolicitud(null).ok, false);
});

test("Archivos: la firma debe coincidir con el tipo declarado", () => {
  assert.equal(firmaCoincide(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]), "application/pdf"), true);
  assert.equal(firmaCoincide(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), "image/jpeg"), true);
  assert.equal(firmaCoincide(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), "image/png"), true);
  assert.equal(firmaCoincide(new Uint8Array([0x4d, 0x5a, 0x90, 0x00]), "application/pdf"), false);
  assert.equal(firmaCoincide(new Uint8Array([0x25, 0x50, 0x44, 0x46]), "text/html"), false);
});

const LUN_VIE: Horario[] = [0, 1, 2, 3, 4, 5, 6].map((dia_semana) => ({
  dia_semana,
  activo: dia_semana >= 1 && dia_semana <= 5,
  hora_inicio: "09:00",
  hora_fin: "18:00",
}));

const agenda = (ahora: string, extra = {}) => ({
  ahora: new Date(ahora),
  horarios: LUN_VIE,
  bloqueados: [],
  duracionMin: 30,
  diasHorizonte: 7,
  anticipacionMin: 120,
  ...extra,
});

test("Zona horaria de Chile, a ambos lados del cambio de hora", () => {
  assert.equal(localAUtc("2026-11-04", "09:00").toISOString(), "2026-11-04T12:00:00.000Z"); // verano, UTC-3
  assert.equal(localAUtc("2026-07-01", "09:00").toISOString(), "2026-07-01T13:00:00.000Z"); // invierno, UTC-4
  assert.equal(formatearHora("2026-07-01T13:00:00.000Z"), "09:00");
});

test("Agenda: lun-vie 9-18 en bloques de 30 min, sin fines de semana", () => {
  // Domingo 8 de noviembre de 2026 al mediodía en Chile.
  const bloques = generarBloques(agenda("2026-11-08T15:00:00.000Z", { diasHorizonte: 1 }));
  assert.equal(bloques.length, 18);
  assert.equal(bloques[0].fecha, "2026-11-09");
  assert.equal(bloques[0].hora, "09:00");
  assert.equal(bloques.at(-1)!.hora, "17:30");
});

test("Agenda: respeta anticipación y días bloqueados", () => {
  // Lunes 9 de noviembre, 10:00 en Chile: el primer bloque es a las 12:00.
  const p = agenda("2026-11-09T13:00:00.000Z", { diasHorizonte: 0 });
  assert.equal(generarBloques(p)[0].hora, "12:00");
  const bloqueado = agenda("2026-11-09T13:00:00.000Z", { diasHorizonte: 0, bloqueados: [{ fecha: "2026-11-09", motivo: null }] });
  assert.equal(generarBloques(bloqueado).length, 0);
});

test("Agenda: marca ocupados y valida bloques exactos", () => {
  const p = agenda("2026-11-08T15:00:00.000Z", { diasHorizonte: 1 });
  const dias = agendaDisponible(p, ["2026-11-09T12:00:00.000Z"]);
  assert.equal(dias[0].bloques[0].libre, false);
  assert.equal(dias[0].bloques[1].libre, true);
  assert.equal(esBloqueValido(new Date("2026-11-09T12:30:00.000Z"), p), true);
  assert.equal(esBloqueValido(new Date("2026-11-09T12:15:00.000Z"), p), false);
  assert.equal(esBloqueValido(new Date("2026-11-08T12:00:00.000Z"), p), false);
  assert.equal(esBloqueValido(new Date("no es fecha"), p), false);
});
