import fs from "fs";
import path from "path";
import { pool } from "./pool.js";

async function run() {
  const migrationsDir = path.resolve("db/migrations");
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith(".sql")).sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    console.log(`Running migration: ${file}`);
    await pool.query(sql);
  }

  await pool.end();
  console.log("Migrations complete ✅");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
