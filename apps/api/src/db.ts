import postgres from 'postgres'
import { CATALOG } from '@carro/shared'
import { config } from './config.js'

export type Sql = ReturnType<typeof makeSql>

export function makeSql(url: string) {
  return postgres(url, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    transform: postgres.camel,
    types: {
      // numeric -> number, date -> 'YYYY-MM-DD' (sin zona horaria)
      numeric: { to: 1700, from: [1700], serialize: (x: unknown) => String(x), parse: (x: string) => Number(x) },
      date: { to: 1082, from: [1082], serialize: (x: unknown) => String(x), parse: (x: string) => x },
    },
  })
}

let _sql: Sql | undefined
export const getSql = (): Sql => (_sql ??= makeSql(config.databaseUrl()))

const SCHEMA = `
create table if not exists settings (key text primary key, value jsonb not null);
create table if not exists vehicle (
  id int primary key default 1 check (id = 1),
  brand text not null, model text not null, year int not null,
  color text not null default '', plate text not null default '',
  odometer_km int not null default 0, odometer_date date not null default current_date
);
create table if not exists categories (
  id serial primary key, slug text unique, name text not null,
  icon text not null default 'Wrench', color text not null default '#10b981',
  sort int not null default 0, builtin boolean not null default false
);
create table if not exists service_types (
  id serial primary key, category_id int not null references categories(id) on delete cascade,
  slug text unique, name text not null,
  interval_km int check (interval_km >= 0), interval_days int check (interval_days >= 1),
  note text not null default '', builtin boolean not null default false, sort int not null default 0
);
create table if not exists maintenance_logs (
  id serial primary key,
  service_type_id int not null references service_types(id) on delete restrict,
  detail text not null default '',
  performed_on date not null, odometer_km int not null check (odometer_km >= 0),
  cost_usd numeric(12,2) check (cost_usd >= 0), fx_rate numeric(14,4),
  shop text not null default '', notes text not null default '',
  next_km int, next_date date, created_at timestamptz not null default now()
);
create index if not exists maintenance_logs_type_idx on maintenance_logs (service_type_id, performed_on desc);
create index if not exists maintenance_logs_date_idx on maintenance_logs (performed_on desc, id desc);
create table if not exists fuel_logs (
  id serial primary key, filled_on date not null, odometer_km int not null check (odometer_km >= 0),
  liters numeric(8,2) not null check (liters > 0), price_per_liter_usd numeric(10,4),
  total_usd numeric(12,2) not null check (total_usd >= 0), full_tank boolean not null default true,
  notes text not null default '', created_at timestamptz not null default now()
);
create index if not exists fuel_logs_km_idx on fuel_logs (odometer_km, filled_on);
create table if not exists fx_cache (
  id int primary key default 1 check (id = 1), rate numeric(14,4) not null,
  source_date timestamptz not null, fetched_at timestamptz not null default now()
);
`

export async function migrate(sql: Sql) {
  await sql.unsafe(SCHEMA)
  let order = 0
  for (const cat of CATALOG) {
    order += 1
    const [c] = await sql<{ id: number }[]>`
      insert into categories (slug, name, icon, color, sort, builtin)
      values (${cat.slug}, ${cat.name}, ${cat.icon}, ${cat.color}, ${order}, true)
      on conflict (slug) do update set name = excluded.name, icon = excluded.icon, color = excluded.color
      returning id`
    if (!c) continue
    let t = 0
    for (const type of cat.types) {
      t += 1
      // No pisa los intervalos que el usuario ya editó.
      await sql`
        insert into service_types (category_id, slug, name, interval_km, interval_days, note, builtin, sort)
        values (${c.id}, ${type.slug}, ${type.name}, ${type.intervalKm ?? null}, ${type.intervalDays ?? null}, ${type.note ?? ''}, true, ${t})
        on conflict (slug) do nothing`
    }
  }
  await sql`update service_types set interval_days = 90 where slug = 'aceite-motor' and interval_days = 180`
  // Registros de aceite con el próximo cambio calculado a 180 días: se corrigen a 90.
  await sql`
    update maintenance_logs l set next_date = l.performed_on + 90
    from service_types t
    where t.id = l.service_type_id and t.slug = 'aceite-motor' and l.next_date = l.performed_on + 180`
  await sql`
    insert into vehicle (id, brand, model, year, color, plate, odometer_km)
    values (1, 'Chevrolet', 'Corsa', 2001, 'Verde', '', 0) on conflict (id) do nothing`
  await sql`
    insert into settings (key, value) values ('warn', ${sql.json({ warnKm: 500, warnDays: 15 })})
    on conflict (key) do nothing`
}
