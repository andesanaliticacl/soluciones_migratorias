-- ═══════════════════════════════════════════════════════════════════════════
-- Soluciones Migratorias: esquema de Supabase. Ejecutar completo en SQL Editor.
--
-- Modelo de acceso:
--   · El sitio público nunca toca las tablas: pasa por rutas del servidor con la
--     service role. anon no tiene ninguna política, así que RLS le niega todo.
--   · Los administradores (auth.users registrados en admin_usuarios) tienen
--     políticas propias.
-- ═══════════════════════════════════════════════════════════════════════════

create type estado_solicitud as enum ('nueva', 'en_curso', 'cerrada');
create type estado_cita as enum ('retenida', 'confirmada', 'liberada', 'cancelada');
create type modalidad_cita as enum ('presencial', 'videollamada');

create sequence numero_atencion_seq start 1;

-- ─── Tablas ─────────────────────────────────────────────────────────────────

create table admin_usuarios (
  user_id uuid primary key references auth.users (id) on delete cascade,
  creado_en timestamptz not null default now()
);

create table solicitudes (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  numero_atencion text unique,
  estado estado_solicitud not null default 'nueva',
  nombre text not null,
  rut text not null,
  telefono text not null,
  correo text not null,
  comuna text not null,
  materias text[] not null check (cardinality(materias) > 0),
  nacionalidad text check (nacionalidad is null or char_length(nacionalidad) <= 60),
  descripcion text,
  consentimiento_en timestamptz not null,
  enviada_en timestamptz,
  -- Al enviar, el horario ya lo había tomado otra persona: hay que coordinar otra hora.
  cita_conflicto boolean not null default false,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index solicitudes_estado_idx on solicitudes (estado, creado_en desc);
create index solicitudes_rut_idx on solicitudes (rut);

create table documentos (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null references solicitudes (id) on delete cascade,
  storage_path text not null unique,
  nombre text not null,
  mime text not null check (mime in ('application/pdf', 'image/jpeg', 'image/png')),
  tamano integer not null check (tamano > 0 and tamano <= 10485760),
  creado_en timestamptz not null default now()
);
create index documentos_solicitud_idx on documentos (solicitud_id);

create table citas (
  id uuid primary key default gen_random_uuid(),
  -- Nula mientras la persona retiene el horario y todavía no envía sus datos.
  solicitud_id uuid references solicitudes (id) on delete cascade,
  hold_token text not null unique default replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  inicio timestamptz not null,
  modalidad modalidad_cita not null,
  estado estado_cita not null default 'retenida',
  expira_en timestamptz,
  creado_en timestamptz not null default now()
);
-- La garantía real contra la doble reserva: un solo registro activo por horario.
create unique index citas_horario_activo_uq on citas (inicio) where estado in ('retenida', 'confirmada');
create index citas_solicitud_idx on citas (solicitud_id);

create table horarios (
  dia_semana smallint primary key check (dia_semana between 0 and 6), -- 0 = domingo
  activo boolean not null default false,
  hora_inicio time not null default '09:00',
  hora_fin time not null default '18:00',
  check (hora_fin > hora_inicio)
);

create table dias_bloqueados (
  fecha date primary key,
  motivo text
);

create table configuracion (
  id smallint primary key default 1 check (id = 1),
  datos jsonb not null default '{}'::jsonb,
  actualizado_en timestamptz not null default now()
);

create table notas_internas (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null references solicitudes (id) on delete cascade,
  autor text not null,
  texto text not null,
  creado_en timestamptz not null default now()
);
create index notas_solicitud_idx on notas_internas (solicitud_id, creado_en desc);

-- Un envío por canal y solicitud: la fila se inserta antes de enviar y sirve de reclamo,
-- así dos webhooks simultáneos no mandan el mismo WhatsApp dos veces.
create table notificaciones (
  solicitud_id uuid not null references solicitudes (id) on delete cascade,
  canal text not null,
  enviado_en timestamptz not null default now(),
  primary key (solicitud_id, canal)
);

create table rate_limits (
  clave text primary key,
  contador integer not null,
  reinicia_en timestamptz not null
);

-- ─── Datos iniciales ────────────────────────────────────────────────────────

insert into horarios (dia_semana, activo) values
  (0, false), (1, true), (2, true), (3, true), (4, true), (5, true), (6, false);

-- Vacío a propósito: los valores por defecto viven en src/lib/config.ts
-- y lo guardado desde /admin se combina encima.
insert into configuracion (id) values (1);

-- ─── Funciones ──────────────────────────────────────────────────────────────

create function es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_usuarios where user_id = auth.uid());
$$;

create function tocar_actualizado() returns trigger
language plpgsql set search_path = public as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

create trigger solicitudes_actualizado before update on solicitudes
  for each row execute function tocar_actualizado();

-- Retiene un horario. Libera primero las retenciones vencidas de ese mismo horario
-- y la retención anterior de esta misma persona. No devuelve filas si está ocupado.
create function retener_cita(p_inicio timestamptz, p_modalidad modalidad_cita, p_hold_previo text, p_minutos integer)
returns table (hold_token text, expira_en timestamptz)
language plpgsql set search_path = public as $$
begin
  update citas c set estado = 'liberada'
   where c.inicio = p_inicio and c.estado = 'retenida' and c.expira_en <= now();

  if p_hold_previo is not null then
    update citas c set estado = 'liberada'
     where c.hold_token = p_hold_previo and c.estado = 'retenida' and c.solicitud_id is null;
  end if;

  return query
    insert into citas as c (inicio, modalidad, expira_en)
    values (p_inicio, p_modalidad, now() + make_interval(mins => p_minutos))
    on conflict (inicio) where estado in ('retenida', 'confirmada') do nothing
    returning c.hold_token, c.expira_en;
end;
$$;

-- Crea la solicitud y le ata la retención en una sola transacción.
create function crear_solicitud(p_datos jsonb, p_hold_token text, p_minutos integer)
returns solicitudes
language plpgsql set search_path = public as $$
declare
  v_cita citas;
  v_solicitud solicitudes;
begin
  select * into v_cita from citas where hold_token = p_hold_token for update;
  if not found or v_cita.estado <> 'retenida' or v_cita.expira_en <= now() or v_cita.solicitud_id is not null then
    raise exception 'HOLD_EXPIRADO';
  end if;

  insert into solicitudes (nombre, rut, telefono, correo, comuna, materias, nacionalidad,
                           descripcion, consentimiento_en)
  values (
    p_datos->>'nombre', p_datos->>'rut', p_datos->>'telefono', p_datos->>'correo', p_datos->>'comuna',
    array(select jsonb_array_elements_text(p_datos->'materias')),
    nullif(p_datos->>'nacionalidad', ''), p_datos->>'descripcion', now()
  ) returning * into v_solicitud;

  update citas set solicitud_id = v_solicitud.id, expira_en = now() + make_interval(mins => p_minutos)
   where id = v_cita.id;

  return v_solicitud;
end;
$$;

-- Confirma el envío de la solicitud. Idempotente y bajo bloqueo: solo la primera llamada genera
-- el número de atención. El llamador envía las notificaciones (con su propio reclamo).
create function confirmar_solicitud(p_solicitud_id uuid)
returns solicitudes
language plpgsql set search_path = public as $$
declare
  v_solicitud solicitudes;
  v_cita citas;
  v_conflicto boolean := false;
begin
  select * into v_solicitud from solicitudes where id = p_solicitud_id for update;
  if not found then
    raise exception 'SOLICITUD_NO_ENCONTRADA';
  end if;

  if v_solicitud.numero_atencion is not null then
    return v_solicitud;
  end if;

  select * into v_cita from citas
   where solicitud_id = p_solicitud_id and estado in ('retenida', 'liberada')
   order by creado_en desc limit 1 for update;

  if not found then
    v_conflicto := true;
  else
    -- Una retención vencida sigue siendo válida si nadie más tomó ese horario.
    update citas set estado = 'liberada'
     where inicio = v_cita.inicio and estado = 'retenida' and expira_en <= now() and id <> v_cita.id;
    begin
      update citas set estado = 'confirmada', expira_en = null where id = v_cita.id;
    exception when unique_violation then
      v_conflicto := true;
    end;
  end if;

  if v_conflicto then
    insert into notas_internas (solicitud_id, autor, texto)
    values (p_solicitud_id, 'Sistema', 'Al enviar la solicitud, el horario ya estaba tomado por otra persona: coordinar una nueva hora.');
  end if;

  update solicitudes set
    numero_atencion = 'SM-' || lpad(nextval('numero_atencion_seq')::text, 6, '0'),
    estado = 'en_curso',
    enviada_en = now(),
    cita_conflicto = v_conflicto
  where id = p_solicitud_id
  returning * into v_solicitud;

  return v_solicitud;
end;
$$;

-- Devuelve true si la acción está permitida dentro de la ventana.
create function rate_limit_hit(p_clave text, p_max integer, p_ventana_seg integer)
returns boolean
language plpgsql set search_path = public as $$
declare
  v_contador integer;
begin
  insert into rate_limits as r (clave, contador, reinicia_en)
  values (p_clave, 1, now() + make_interval(secs => p_ventana_seg))
  on conflict (clave) do update set
    contador = case when r.reinicia_en <= now() then 1 else r.contador + 1 end,
    reinicia_en = case when r.reinicia_en <= now() then excluded.reinicia_en else r.reinicia_en end
  returning contador into v_contador;
  delete from rate_limits where reinicia_en < now() - interval '1 day';
  return v_contador <= p_max;
end;
$$;

-- Estas funciones escriben sin pasar por RLS de usuario: solo el servidor puede llamarlas.
revoke execute on function retener_cita(timestamptz, modalidad_cita, text, integer) from public, anon, authenticated;
revoke execute on function crear_solicitud(jsonb, text, integer) from public, anon, authenticated;
revoke execute on function confirmar_solicitud(uuid) from public, anon, authenticated;
revoke execute on function rate_limit_hit(text, integer, integer) from public, anon, authenticated;
grant execute on function retener_cita(timestamptz, modalidad_cita, text, integer) to service_role;
grant execute on function crear_solicitud(jsonb, text, integer) to service_role;
grant execute on function confirmar_solicitud(uuid) to service_role;
grant execute on function rate_limit_hit(text, integer, integer) to service_role;

-- ─── Row Level Security ─────────────────────────────────────────────────────

alter table admin_usuarios enable row level security;
alter table solicitudes enable row level security;
alter table documentos enable row level security;
alter table citas enable row level security;
alter table horarios enable row level security;
alter table dias_bloqueados enable row level security;
alter table configuracion enable row level security;
alter table notas_internas enable row level security;
alter table notificaciones enable row level security;
alter table rate_limits enable row level security;

create policy "admin ve su fila" on admin_usuarios for select to authenticated using (user_id = auth.uid());
create policy "admin gestiona solicitudes" on solicitudes for all to authenticated using (es_admin()) with check (es_admin());
create policy "admin gestiona documentos" on documentos for all to authenticated using (es_admin()) with check (es_admin());
create policy "admin gestiona citas" on citas for all to authenticated using (es_admin()) with check (es_admin());
create policy "admin gestiona horarios" on horarios for all to authenticated using (es_admin()) with check (es_admin());
create policy "admin gestiona dias bloqueados" on dias_bloqueados for all to authenticated using (es_admin()) with check (es_admin());
create policy "admin gestiona configuracion" on configuracion for all to authenticated using (es_admin()) with check (es_admin());
create policy "admin gestiona notas" on notas_internas for all to authenticated using (es_admin()) with check (es_admin());
create policy "admin ve notificaciones" on notificaciones for select to authenticated using (es_admin());
-- rate_limits: sin políticas, solo service role.

-- ─── Storage: bucket privado ────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documentos', 'documentos', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png']);

create policy "admin lee documentos" on storage.objects for select to authenticated
  using (bucket_id = 'documentos' and public.es_admin());
-- Las subidas usan URLs firmadas que emite el servidor; anon no tiene acceso directo.
