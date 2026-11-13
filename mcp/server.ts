import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createFinanceMcpServer } from "./create-server";

async function main() {
  const server = createFinanceMcpServer({
    apiBaseUrl: process.env.MCP_API_BASE_URL || "http://127.0.0.1:3000",
  });
  await server.connect(new StdioServerTransport());
}

main().catch((error: unknown) => {
  console.error("Income Expense MCP server failed to start:", error);
  process.exitCode = 1;
});
