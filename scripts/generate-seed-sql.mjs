import fs from "node:fs";

const projects = JSON.parse(
  fs.readFileSync("src/api/mock/data/projects.json", "utf8")
);
const OWNER_EMAIL = "appoyomutuo@gmail.com";
const esc = (s) => String(s || "").replace(/'/g, "''");

const lines = [];
lines.push("-- Pack semilla Madrid: proyectos creados por appoyomutuo@gmail.com");
lines.push("-- Requisito: ese usuario debe existir ya en Auth (haber iniciado sesion al menos una vez).");
lines.push("-- Idempotente: ON CONFLICT DO NOTHING");
lines.push("");
lines.push("do $$");
lines.push("declare");
lines.push("  owner_id uuid;");
lines.push("begin");
lines.push(`  select id into owner_id from auth.users where email = '${OWNER_EMAIL}' limit 1;`);
lines.push("  if owner_id is null then");
lines.push(
  `    raise exception 'No existe el usuario ${OWNER_EMAIL}. Entra una vez con Google/email y vuelve a ejecutar este SQL.';`
);
lines.push("  end if;");
lines.push("");
lines.push("  insert into public.profiles (id, full_name, bio, neighborhood)");
lines.push("  values (");
lines.push("    owner_id,");
lines.push("    'Appoyo Mutuo',");
lines.push("    'Cuenta oficial con proyectos semilla en Madrid.',");
lines.push("    'Madrid'");
lines.push("  )");
lines.push("  on conflict (id) do update set");
lines.push("    full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name);");
lines.push("");
lines.push("  insert into public.projects (");
lines.push("    id, title, description, area, location, neighborhood, address, lat, lng,");
lines.push("    contribution_type, status, people_needed, people_joined, image_url, info_pdf_url,");
lines.push("    conditions, what_happens, what_needed, template_name, created_by, created_at");
lines.push("  ) values");

const rows = projects.map((p, i) => {
  const id = "a0000000-0000-4000-8000-" + String(101 + i).padStart(12, "0");
  const vals = [
    `'${id}'`,
    `'${esc(p.title)}'`,
    `'${esc(p.description)}'`,
    `'${esc(p.area)}'`,
    `'${esc(p.location)}'`,
    `'${esc(p.neighborhood)}'`,
    `'${esc(p.address)}'`,
    p.lat,
    p.lng,
    `'${esc(p.contribution_type)}'`,
    `'${esc(p.status)}'`,
    p.people_needed,
    0,
    `''`,
    `''`,
    `'${esc(p.conditions)}'`,
    `'${esc(p.what_happens)}'`,
    `'${esc(p.what_needed)}'`,
    `'${esc(p.template_name)}'`,
    "owner_id",
    `'${p.created_date}'`,
  ];
  return `  (${vals.join(", ")})`;
});

lines.push(rows.join(",\n"));
lines.push("  on conflict (id) do update set created_by = excluded.created_by;");
lines.push("end $$;");
lines.push("");

fs.writeFileSync(
  "supabase/migrations/20260812000000_seed_madrid_projects.sql",
  lines.join("\n")
);
console.log("Wrote", projects.length, "projects owned by", OWNER_EMAIL);
