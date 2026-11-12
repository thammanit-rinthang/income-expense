import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const entitySchema = z.enum([
  "budget",
  "category",
  "fixed_cost",
  "transaction",
  "loan",
  "loan_payment",
  "card",
  "card_payment",
  "received_payment",
  "summary",
]);

type Entity = z.infer<typeof entitySchema>;
type WriteEntity = Exclude<Entity, "summary">;
type JsonRecord = Record<string, unknown>;

const createSchemas = {
  budget: z.object({
    person_name: z.string().trim().min(1),
    month: z.string().optional(),
    month_year: z.string().optional(),
    total_income: z.coerce.number().nonnegative().optional(),
    reserved_amount: z.coerce.number().nonnegative().optional(),
  }),
  category: z.object({
    budget_id: z.coerce.number().int().positive(),
    name: z.string().trim().min(1),
    monthly_budget: z.coerce.number().nonnegative().nullable().optional(),
  }),
  fixed_cost: z.object({
    budget_id: z.coerce.number().int().positive(),
    name: z.string().trim().min(1),
    amount: z.coerce.number().positive(),
    due_date: z.string().nullable().optional(),
    is_paid: z.boolean().optional(),
  }),
  transaction: z.object({
    budget_id: z.coerce.number().int().positive(),
    amount: z.coerce.number().positive(),
    description: z.string().optional(),
    category_id: z.coerce.number().int().positive().nullable().optional(),
    card_id: z.coerce.number().int().positive().nullable().optional(),
    created_at: z.string().optional(),
  }),
  loan: z.object({
    name: z.string().trim().min(1),
    person_name: z.string().trim().min(1),
    budget_id: z.coerce.number().int().positive().nullable().optional(),
    principal: z.coerce.number().positive(),
    interest_rate: z.coerce.number().nonnegative(),
    term_months: z.coerce.number().int().positive(),
    include_in_income: z.boolean().optional(),
    is_paid: z.boolean().optional(),
    start_date: z.string().optional(),
  }),
  loan_payment: z.object({
    budget_id: z.coerce.number().int().positive(),
    amount: z.coerce.number().positive(),
    note: z.string().optional(),
    paid_at: z.string().optional(),
  }),
  card: z.object({
    name: z.string().trim().min(1),
    person_name: z.string().nullable().optional(),
    credit_limit: z.coerce.number().nonnegative(),
    statement_balance: z.coerce.number().nonnegative().optional(),
    minimum_payment: z.coerce.number().nonnegative().optional(),
    due_date: z.string().nullable().optional(),
  }),
  card_payment: z.object({
    card_id: z.coerce.number().int().positive(),
    amount: z.coerce.number().positive(),
    note: z.string().optional(),
    paid_at: z.string().nullable().optional(),
    budget_id: z.coerce.number().int().positive().nullable().optional(),
  }),
  received_payment: z.object({
    budget_id: z.coerce.number().int().positive(),
    amount: z.coerce.number().positive(),
    sender: z.string().trim().min(1),
    note: z.string().optional(),
  }),
} satisfies Record<WriteEntity, z.ZodObject<z.ZodRawShape>>;

const updateSchemas = {
  budget: z.object({
    total_income: z.coerce.number().nonnegative().optional(),
    reserved_amount: z.coerce.number().nonnegative().optional(),
  }),
  category: createSchemas.category.pick({ name: true, monthly_budget: true }),
  fixed_cost: createSchemas.fixed_cost.pick({ name: true, amount: true, due_date: true, is_paid: true }),
  transaction: createSchemas.transaction.pick({ amount: true, description: true, category_id: true, card_id: true, created_at: true }),
  loan: createSchemas.loan.omit({ budget_id: true }).partial().extend({ budget_id: z.coerce.number().int().positive().nullable().optional() }),
  loan_payment: z.object({
    amount: z.coerce.number().positive().optional(),
    note: z.string().optional(),
    paid_at: z.string().nullable().optional(),
  }),
  card: createSchemas.card.partial(),
  card_payment: createSchemas.card_payment.pick({ amount: true, note: true, paid_at: true }),
  received_payment: z.object({
    amount: z.coerce.number().positive().optional(),
    sender: z.string().trim().min(1).optional(),
    note: z.string().optional(),
    received_at: z.string().nullable().optional(),
  }),
} satisfies Record<WriteEntity, z.ZodObject<z.ZodRawShape>>;

function parseRecord(entity: WriteEntity, data: JsonRecord, partial = false): JsonRecord {
  const schema = partial ? updateSchemas[entity] : createSchemas[entity];
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Invalid ${entity} data: ${details}`);
  }
  if (partial && Object.keys(result.data).length === 0) {
    throw new Error(`Provide at least one ${entity} field to update.`);
  }
  const parsedData = result.data as JsonRecord;
  if (!partial && entity === "budget" && !parsedData.month && !parsedData.month_year) {
    throw new Error("budget data requires month or month_year.");
  }
  return parsedData;
}

const apiUrl = new URL(process.env.MCP_API_BASE_URL || "http://127.0.0.1:3000");
const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);

if (!localHosts.has(apiUrl.hostname) || !["http:", "https:"].includes(apiUrl.protocol)) {
  throw new Error("MCP_API_BASE_URL must point to a local HTTP server.");
}

const apiBaseUrl = apiUrl.toString().replace(/\/$/, "");

function idQuery(path: string, id: number): string {
  return `${path}?id=${encodeURIComponent(String(id))}`;
}

function queryPath(path: string, values: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) searchParams.set(key, String(value));
  }
  return `${path}?${searchParams.toString()}`;
}

async function callApi(path: string, method: "GET" | "POST" | "PATCH" | "DELETE", body?: JsonRecord) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const rawResponse = await response.text();
  let data: unknown = null;

  if (rawResponse) {
    try {
      data = JSON.parse(rawResponse) as unknown;
    } catch {
      data = rawResponse;
    }
  }

  if (!response.ok) {
    throw new Error(`API ${method} ${path} returned ${response.status}: ${JSON.stringify(data)}`);
  }

  return data;
}

function successResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function errorResult(error: unknown) {
  return {
    content: [{ type: "text" as const, text: error instanceof Error ? error.message : String(error) }],
    isError: true,
  };
}

async function runTool(work: () => Promise<unknown>) {
  try {
    return successResult(await work());
  } catch (error) {
    return errorResult(error);
  }
}

function requireNumber(value: number | undefined, fieldName: string): number {
  if (!Number.isInteger(value) || (value as number) < 1) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }
  return value as number;
}

function requiredText(value: string | undefined, fieldName: string): string {
  if (!value?.trim()) throw new Error(`${fieldName} is required.`);
  return value;
}

const server = new McpServer({
  name: "income-expense",
  version: "1.0.0",
});

server.registerTool(
  "finance_read",
  {
    description: "Read budgets, categories, fixed costs, transactions, loans and repayments, cards and payments, received payments, or a household summary. The app must be running locally.",
    inputSchema: z.object({
      entity: entitySchema,
      personName: z.string().optional().describe("Budget owner, such as Bon or Ray."),
      month: z.string().optional().describe("Month as YYYY-MM or YYYY-MM-DD."),
      budgetId: z.number().int().positive().optional(),
      cardId: z.number().int().positive().optional(),
      loanId: z.number().int().positive().optional(),
    }),
  },
  async ({ entity, personName, month, budgetId, cardId, loanId }) => runTool(async () => {
    switch (entity) {
      case "budget": {
        const owner = requiredText(personName, "personName");
        const selectedMonth = requiredText(month, "month");
        return callApi(queryPath("/api/budgets", {
          person_name: owner,
          month: selectedMonth,
          read_only: "true",
        }), "GET");
      }
      case "category":
        return callApi(queryPath("/api/categories", { budget_id: requireNumber(budgetId, "budgetId") }), "GET");
      case "fixed_cost":
        return callApi(queryPath("/api/fixed-costs", { budget_id: requireNumber(budgetId, "budgetId") }), "GET");
      case "transaction":
        return callApi(queryPath("/api/transactions", { budget_id: requireNumber(budgetId, "budgetId") }), "GET");
      case "loan":
        return callApi(queryPath("/api/loans", { person_name: personName }), "GET");
      case "loan_payment": {
        const loans = await callApi(queryPath("/api/loans", { person_name: personName }), "GET") as Array<{
          id: number;
          name: string;
          payments?: Array<JsonRecord>;
        }>;
        return loans
          .filter((loan) => loanId === undefined || loan.id === loanId)
          .flatMap((loan) => (loan.payments || []).map((payment) => ({
            ...payment,
            loan_id: loan.id,
            loan_name: loan.name,
          })));
      }
      case "card":
        return callApi("/api/cards", "GET");
      case "card_payment":
        return callApi(queryPath(`/api/cards/${requireNumber(cardId, "cardId")}/payments`, { month }), "GET");
      case "received_payment":
        return callApi(queryPath("/api/budgets/receive-payment", { budget_id: requireNumber(budgetId, "budgetId") }), "GET");
      case "summary":
        return callApi(queryPath("/api/summary", { month: requiredText(month, "month") }), "GET");
    }
  }),
);

server.registerTool(
  "finance_create",
  {
    description: "Create a financial record. Use snake_case fields: budget(person_name, month or month_year, total_income, reserved_amount); category(budget_id, name, monthly_budget); fixed_cost(budget_id, name, amount, due_date, is_paid); transaction(budget_id, amount, category_id or card_id, description, created_at); loan(name, person_name, principal, interest_rate, term_months, budget_id, include_in_income); loan_payment(budget_id, amount, note); card(name, person_name, credit_limit, statement_balance, minimum_payment, due_date); card_payment(card_id, amount, budget_id, note, paid_at); received_payment(budget_id, amount, sender, note). For loan_payment, also provide parentId as the loan ID.",
    inputSchema: z.object({
      entity: z.enum(["budget", "category", "fixed_cost", "transaction", "loan", "loan_payment", "card", "card_payment", "received_payment"]),
      parentId: z.number().int().positive().optional().describe("Required for loan_payment; the loan ID."),
      data: z.record(z.string(), z.unknown()).describe("Fields for the selected entity, using the snake_case names listed in the tool description."),
    }),
  },
  async ({ entity, parentId, data }) => runTool(async () => {
    const payload = parseRecord(entity, data);
    switch (entity) {
      case "budget":
        return callApi("/api/budgets", "POST", payload);
      case "category":
        return callApi("/api/categories", "POST", payload);
      case "fixed_cost":
        return callApi("/api/fixed-costs", "POST", payload);
      case "transaction":
        return callApi("/api/transactions", "POST", payload);
      case "loan":
        return callApi("/api/loans", "POST", payload);
      case "loan_payment":
        return callApi(`/api/loans/${requireNumber(parentId, "parentId")}/pay`, "POST", payload);
      case "card":
        return callApi("/api/cards", "POST", payload);
      case "card_payment":
        return callApi("/api/cards/payments", "POST", payload);
      case "received_payment":
        return callApi("/api/budgets/receive-payment", "POST", payload);
    }
  }),
);

server.registerTool(
  "finance_update",
  {
    description: "Edit an existing budget, category, fixed cost, transaction, loan, loan repayment, card, card payment, or received payment. Provide the record ID and only the fields to change, using the snake_case field names listed in finance_create.",
    inputSchema: z.object({
      entity: z.enum(["budget", "category", "fixed_cost", "transaction", "loan", "loan_payment", "card", "card_payment", "received_payment"]),
      id: z.number().int().positive(),
      data: z.record(z.string(), z.unknown()).describe("Fields to update."),
    }),
  },
  async ({ entity, id, data }) => runTool(async () => {
    const updatedData = parseRecord(entity, data, true);
    const payload = { ...updatedData, id };
    switch (entity) {
      case "budget":
        return callApi("/api/budgets", "PATCH", payload);
      case "category":
        return callApi("/api/categories", "PATCH", payload);
      case "fixed_cost":
        return callApi("/api/fixed-costs", "PATCH", payload);
      case "transaction":
        return callApi("/api/transactions", "PATCH", payload);
      case "loan":
        return callApi(`/api/loans/${id}`, "PATCH", updatedData);
      case "loan_payment":
        return callApi("/api/loans/payments", "PATCH", payload);
      case "card":
        return callApi(`/api/cards/${id}`, "PATCH", updatedData);
      case "card_payment":
        return callApi("/api/cards/payments", "PATCH", payload);
      case "received_payment":
        return callApi("/api/budgets/receive-payment", "PATCH", payload);
    }
  }),
);

server.registerTool(
  "finance_delete",
  {
    description: "Delete a budget, category, fixed cost, transaction, loan, loan repayment, card, card payment, or received payment. Deleting also reverses related budget/card balance effects. Set confirm to true to authorize the deletion.",
    inputSchema: z.object({
      entity: z.enum(["budget", "category", "fixed_cost", "transaction", "loan", "loan_payment", "card", "card_payment", "received_payment"]),
      id: z.number().int().positive(),
      confirm: z.literal(true).describe("Explicit confirmation required for destructive changes."),
    }),
  },
  async ({ entity, id }) => runTool(async () => {
    switch (entity) {
      case "budget":
        return callApi(idQuery("/api/budgets", id), "DELETE");
      case "category":
        return callApi(idQuery("/api/categories", id), "DELETE");
      case "fixed_cost":
        return callApi(idQuery("/api/fixed-costs", id), "DELETE");
      case "transaction":
        return callApi(idQuery("/api/transactions", id), "DELETE");
      case "loan":
        return callApi(`/api/loans/${id}`, "DELETE");
      case "loan_payment":
        return callApi(idQuery("/api/loans/payments", id), "DELETE");
      case "card":
        return callApi(`/api/cards/${id}`, "DELETE");
      case "card_payment":
        return callApi(idQuery("/api/cards/payments", id), "DELETE");
      case "received_payment":
        return callApi(idQuery("/api/budgets/receive-payment", id), "DELETE");
    }
  }),
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  console.error("Income Expense MCP server failed to start:", error);
  process.exitCode = 1;
});
