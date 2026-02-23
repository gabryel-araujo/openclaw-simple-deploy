import dotenv from "dotenv";
import { Client } from "pg";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

function isSqlMigration(filename) {
  return /^\d+_.+\.sql$/i.test(filename);
}

async function main() {
  // Load local env vars for CLI usage (Next loads .env automatically, Node does not).
  dotenv.config();

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is required (missing from process.env / .env)");
    process.exit(1);
  }

  const migrationsDir = path.resolve(process.cwd(), "migrations");
  const entries = await readdir(migrationsDir, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile() && isSqlMigration(e.name))
    .map((e) => e.name)
    .sort();

  if (files.length === 0) {
    console.log("No SQL migrations found in migrations/.");
    return;
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    const appliedRes = await client.query(
      "SELECT filename FROM schema_migrations ORDER BY filename ASC",
    );
    const applied = new Set(appliedRes.rows.map((r) => r.filename));

    // If the DB was already migrated using drizzle-kit, baseline by count.
    // drizzle-kit stores applied migrations in __drizzle_migrations; the order matches the local folder.
    if (applied.size === 0) {
      const regRes = await client.query(
        "SELECT to_regclass('public.__drizzle_migrations') AS regclass",
      );
      const exists = !!regRes.rows?.[0]?.regclass;
      if (exists) {
        const countRes = await client.query(
          "SELECT COUNT(*)::int AS count FROM __drizzle_migrations",
        );
        const drizzleCount = Number(countRes.rows?.[0]?.count ?? 0);
        if (drizzleCount > 0) {
          const baselineFiles = files.slice(0, Math.min(drizzleCount, files.length));
          if (baselineFiles.length > 0) {
            console.log(
              `Baselining ${baselineFiles.length} migrations from __drizzle_migrations...`,
            );
            for (const filename of baselineFiles) {
              await client.query(
                "INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING",
                [filename],
              );
              applied.add(filename);
            }
          }
        }
      }
    }

    let appliedCount = 0;
    let skippedCount = 0;
    for (const filename of files) {
      if (applied.has(filename)) continue;

      const fullPath = path.join(migrationsDir, filename);
      const sql = await readFile(fullPath, "utf8");
      const trimmed = sql.trim();
      if (!trimmed) {
        console.log(`Skipping empty migration: ${filename}`);
        await client.query(
          "INSERT INTO schema_migrations (filename) VALUES ($1)",
          [filename],
        );
        continue;
      }

      console.log(`Applying migration: ${filename}`);
      await client.query("BEGIN");
      try {
        await client.query(trimmed);
        await client.query(
          "INSERT INTO schema_migrations (filename) VALUES ($1)",
          [filename],
        );
        await client.query("COMMIT");
        appliedCount++;
      } catch (err) {
        await client.query("ROLLBACK");
        // If the database already has the objects (e.g. created by drizzle-kit push/manual SQL),
        // treat "already exists" errors as a baseline for that migration and continue.
        const code = err?.code;
        const message = String(err?.message ?? "");
        const isAlreadyExists =
          code === "42710" || // duplicate_object
          code === "42P07" || // duplicate_table
          code === "42701" || // duplicate_column
          /already exists/i.test(message);

        if (isAlreadyExists) {
          console.warn(`Baselining migration (already applied): ${filename}`);
          await client.query(
            "INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING",
            [filename],
          );
          applied.add(filename);
          skippedCount++;
          continue;
        }

        throw err;
      }
    }

    console.log(`Migrations applied: ${appliedCount}`);
    console.log(`Migrations baselined: ${skippedCount}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err?.message ?? err);
  process.exit(1);
});
