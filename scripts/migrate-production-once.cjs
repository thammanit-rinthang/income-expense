const { spawnSync } = require("node:child_process");

const isOneTimeProductionMigration =
  process.env.VERCEL_ENV === "production" &&
  process.env.MIGRATE_MCP_SCHEMA_ONCE === "1";

if (!isOneTimeProductionMigration) {
  console.log("Skipping the one-time MCP production migration.");
  process.exit(0);
}

const result = spawnSync("npm", ["run", "db:migrate:deploy"], {
  stdio: "inherit",
  shell: true,
});

if (result.error) {
  console.error("Could not start the MCP production migration:", result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
