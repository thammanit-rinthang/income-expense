import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import prisma from "../lib/prisma";
import type { McpPerson } from "../lib/mcp-auth";

const entitySchema = z.enum([
  "budget",
  "category",
  "fixed_cost",
  "transaction",
  "card_transactions",
  "loan",
  "loan_payment",
  "card",
  "card_payment",
  "received_payment",
  "summary",
]);

type Entity = z.infer<typeof entitySchema>;
type WriteEntity = Exclude<Entity, "summary" | "card_transactions">;
type JsonRecord = Record<string, unknown>;
type LoanRecord = JsonRecord & {
  id: number;
  name: string;
  person_name: string;
  budget_id: number | null;
  payments?: JsonRecord[];
};

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function getPersonBudgetIds(personName: string): Promise<Set<number>> {
  const budgets = await prisma.monthlyBudget.findMany({
    where: { person_name: personName },
    select: { id: true },
  });
  return new Set(budgets.map((budget) => budget.id));
}

function filterLoansForPerson(value: unknown, personName: string, budgetIds: Set<number>): LoanRecord[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((loan): LoanRecord[] => {
    if (
      !isJsonRecord(loan) ||
      loan.person_name !== personName ||
      typeof loan.id !== "number" ||
      typeof loan.name !== "string"
    ) return [];
    const loanBudgetId = loan.budget_id;
    if (loanBudgetId !== null && (typeof loanBudgetId !== "number" || !budgetIds.has(loanBudgetId))) return [];
    if (loanBudgetId === undefined) return [];

    const payments = Array.isArray(loan.payments)
      ? loan.payments.filter((payment): payment is JsonRecord =>
        isJsonRecord(payment) && typeof payment.budget_id === "number" && budgetIds.has(payment.budget_id),
      )
      : [];
    return [{
      ...loan,
      id: loan.id,
      name: loan.name,
      person_name: personName,
      budget_id: loanBudgetId,
      payments,
    }];
  });
}

function filterTransactionsForPerson(
  value: unknown,
  cardIds: Set<number>,
  categoryIds: Set<number>,
): JsonRecord[] {
  if (!Array.isArray(value)) return [];

  return value.filter((transaction): transaction is JsonRecord => {
    if (!isJsonRecord(transaction)) return false;

    if (transaction.card !== null) {
      if (!isJsonRecord(transaction.card) || !cardIds.has(Number(transaction.card.id))) return false;
    }
    if (transaction.category !== null) {
      if (!isJsonRecord(transaction.category) || !categoryIds.has(Number(transaction.category.id))) return false;
    }
    return true;
  });
}

function filterCardPaymentsForPerson(value: unknown, budgetIds: Set<number>): JsonRecord[] {
  if (!Array.isArray(value)) return [];

  return value.filter((payment): payment is JsonRecord =>
    isJsonRecord(payment) &&
    (payment.budget_id === null ||
      (typeof payment.budget_id === "number" && budgetIds.has(payment.budget_id))),
  );
}

function filterCardTransactionsForPerson(value: unknown, categoryIds: Set<number>): JsonRecord[] {
  if (!Array.isArray(value)) return [];

  return value.filter((transaction): transaction is JsonRecord => {
    if (!isJsonRecord(transaction)) return false;
    if (transaction.category === null) return true;
    return isJsonRecord(transaction.category) && categoryIds.has(Number(transaction.category.id));
  });
}

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

const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);

function validateApiBaseUrl(value: string, allowRemote: boolean): string {
  const apiUrl = new URL(value);
  const localHost = localHosts.has(apiUrl.hostname);
  if (!localHost && (!allowRemote || apiUrl.protocol !== "https:")) {
    throw new Error("Remote MCP API URLs must use HTTPS.");
  }
  if (apiUrl.protocol !== "https:" && apiUrl.protocol !== "http:") {
    throw new Error("MCP_API_BASE_URL must use HTTP or HTTPS.");
  }
  if (apiUrl.username || apiUrl.password || apiUrl.pathname !== "/" || apiUrl.search || apiUrl.hash) {
    throw new Error("MCP_API_BASE_URL must be an origin without credentials, path, query, or fragment.");
  }
  return apiUrl.origin;
}

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

async function requestApi(apiBaseUrl: string, path: string, method: "GET" | "POST" | "PATCH" | "DELETE", body?: JsonRecord) {
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

export interface FinanceMcpServerOptions {
  apiBaseUrl: string;
  allowRemoteApi?: boolean;
  personName?: McpPerson;
  scopes?: string[];
}

export function createFinanceMcpServer(options: FinanceMcpServerOptions): McpServer {
  const apiBaseUrl = validateApiBaseUrl(options.apiBaseUrl, options.allowRemoteApi === true);
  const personName = options.personName;
  const scopes = options.scopes || ["finance:read", "finance:write"];
  const callApi = (path: string, method: "GET" | "POST" | "PATCH" | "DELETE", body?: JsonRecord) =>
    requestApi(apiBaseUrl, path, method, body);
  const server = new McpServer({
    name: "income-expense",
    version: "1.1.0",
  });

  function assertScope(scope: "finance:read" | "finance:write") {
    if (personName && !scopes.includes(scope)) {
      throw new Error(`This API key is not authorized for ${scope}.`);
    }
  }

  function scopedPerson(requestedPersonName?: string): string | undefined {
    if (personName && requestedPersonName && requestedPersonName !== personName) {
      throw new Error("This API key can only access its assigned person.");
    }
    return personName || requestedPersonName;
  }

  async function assertBudgetAccess(budgetId: number) {
    if (!personName) return;
    const budget = await prisma.monthlyBudget.findUnique({
      where: { id: budgetId },
      select: { person_name: true },
    });
    if (!budget || budget.person_name !== personName) {
      throw new Error("Budget not found for this API key's assigned person.");
    }
  }

  async function assertCardAccess(cardId: number) {
    if (!personName) return;
    const card = await prisma.creditCard.findUnique({
      where: { id: cardId },
      select: { person_name: true },
    });
    if (!card || card.person_name !== personName) {
      throw new Error("Card not found for this API key's assigned person. Assign unowned cards to a person first.");
    }
  }

  async function assertEntityAccess(entity: WriteEntity | "budget", id: number) {
    if (!personName) return;
    let owner: string | null | undefined;
    switch (entity) {
      case "budget": {
        const record = await prisma.monthlyBudget.findUnique({ where: { id }, select: { person_name: true } });
        owner = record?.person_name;
        break;
      }
      case "category": {
        const record = await prisma.budgetCategory.findUnique({ where: { id }, select: { budget: { select: { person_name: true } } } });
        owner = record?.budget.person_name;
        break;
      }
      case "fixed_cost": {
        const record = await prisma.fixedCost.findUnique({ where: { id }, select: { budget: { select: { person_name: true } } } });
        owner = record?.budget.person_name;
        break;
      }
      case "transaction": {
        const record = await prisma.transaction.findUnique({
          where: { id },
          select: { budget: { select: { person_name: true } }, card: { select: { person_name: true } } },
        });
        owner = record?.budget?.person_name === personName && (!record.card || record.card.person_name === personName)
          ? personName
          : undefined;
        break;
      }
      case "loan": {
        const record = await prisma.loan.findUnique({
          where: { id },
          select: { person_name: true, budget: { select: { person_name: true } } },
        });
        owner = record &&
          record.person_name === personName &&
          (!record.budget || record.budget.person_name === personName)
          ? personName
          : undefined;
        break;
      }
      case "loan_payment": {
        const record = await prisma.loanPayment.findUnique({
          where: { id },
          select: {
            loan: { select: { person_name: true, budget: { select: { person_name: true } } } },
            budget: { select: { person_name: true } },
          },
        });
        owner = record &&
          record.loan.person_name === personName &&
          (!record.loan.budget || record.loan.budget.person_name === personName) &&
          record.budget.person_name === personName
          ? personName
          : undefined;
        break;
      }
      case "card": {
        const record = await prisma.creditCard.findUnique({ where: { id }, select: { person_name: true } });
        owner = record?.person_name;
        break;
      }
      case "card_payment": {
        const record = await prisma.cardPayment.findUnique({
          where: { id },
          select: { card: { select: { person_name: true } }, budget: { select: { person_name: true } } },
        });
        owner = record?.card.person_name === personName && (!record.budget || record.budget.person_name === personName)
          ? personName
          : undefined;
        break;
      }
      case "received_payment": {
        const record = await prisma.receivedPayment.findUnique({ where: { id }, select: { budget: { select: { person_name: true } } } });
        owner = record?.budget.person_name;
        break;
      }
    }

    if (owner !== personName) {
      throw new Error(`${entity} not found for this API key's assigned person.`);
    }
  }

  async function assertCreateAccess(entity: WriteEntity, payload: JsonRecord, parentId?: number) {
    if (!personName) return;
    switch (entity) {
      case "budget":
        if (payload.person_name !== personName) throw new Error("This API key can only create budgets for its assigned person.");
        return;
      case "category":
      case "fixed_cost":
      case "transaction":
      case "received_payment":
        await assertBudgetAccess(requireNumber(payload.budget_id as number | undefined, "budget_id"));
        if (entity === "transaction" && payload.card_id) await assertCardAccess(requireNumber(payload.card_id as number, "card_id"));
        if (entity === "transaction" && payload.category_id) await assertEntityAccess("category", requireNumber(payload.category_id as number, "category_id"));
        return;
      case "loan":
        if (payload.person_name !== personName) throw new Error("This API key can only create loans for its assigned person.");
        if (payload.budget_id) await assertBudgetAccess(requireNumber(payload.budget_id as number, "budget_id"));
        return;
      case "loan_payment":
        await assertEntityAccess("loan", requireNumber(parentId, "parentId"));
        await assertBudgetAccess(requireNumber(payload.budget_id as number | undefined, "budget_id"));
        return;
      case "card":
        if (payload.person_name !== undefined && payload.person_name !== personName) throw new Error("This API key can only create cards for its assigned person.");
        payload.person_name = personName;
        return;
      case "card_payment":
        await assertCardAccess(requireNumber(payload.card_id as number | undefined, "card_id"));
        if (payload.budget_id) await assertBudgetAccess(requireNumber(payload.budget_id as number, "budget_id"));
        return;
    }
  }

  async function assertUpdateAccess(entity: WriteEntity, id: number, data: JsonRecord) {
    await assertEntityAccess(entity, id);
    if (!personName) return;
    if (entity === "loan") {
      if (data.person_name !== undefined && data.person_name !== personName) throw new Error("This API key cannot transfer a loan to another person.");
      if (data.budget_id) await assertBudgetAccess(requireNumber(data.budget_id as number, "budget_id"));
    }
    if (entity === "card") {
      if (data.person_name !== undefined && data.person_name !== personName) throw new Error("This API key cannot transfer a card to another person.");
      data.person_name = personName;
    }
    if (entity === "transaction") {
      if (data.card_id) await assertCardAccess(requireNumber(data.card_id as number, "card_id"));
      if (data.category_id) await assertEntityAccess("category", requireNumber(data.category_id as number, "category_id"));
    }
  }

server.registerTool(
  "finance_read",
  {
    description: "Read budgets, categories, fixed costs, transactions, card transactions and payments, loans and repayments, cards, received payments, or a monthly summary. API-key access is limited to its assigned person.",
    inputSchema: z.object({
      entity: entitySchema,
      personName: z.string().optional().describe("Budget owner, such as Bon or Ray."),
      month: z.string().optional().describe("Month as YYYY-MM or YYYY-MM-DD."),
      budgetId: z.number().int().positive().optional(),
      cardId: z.number().int().positive().optional(),
      loanId: z.number().int().positive().optional(),
    }),
  },
  async ({ entity, personName: requestedPersonName, month, budgetId, cardId, loanId }) => runTool(async () => {
    assertScope("finance:read");
    const owner = scopedPerson(requestedPersonName);
    switch (entity) {
      case "budget": {
        const budgetOwner = requiredText(owner, "personName");
        const selectedMonth = requiredText(month, "month");
        return callApi(queryPath("/api/budgets", {
          person_name: budgetOwner,
          month: selectedMonth,
          read_only: "true",
        }), "GET");
      }
      case "category": {
        const id = requireNumber(budgetId, "budgetId");
        await assertBudgetAccess(id);
        return callApi(queryPath("/api/categories", { budget_id: id }), "GET");
      }
      case "fixed_cost": {
        const id = requireNumber(budgetId, "budgetId");
        await assertBudgetAccess(id);
        return callApi(queryPath("/api/fixed-costs", { budget_id: id }), "GET");
      }
      case "transaction": {
        const id = requireNumber(budgetId, "budgetId");
        await assertBudgetAccess(id);
        const transactions = await callApi(queryPath("/api/transactions", { budget_id: id }), "GET");
        if (!owner || !Array.isArray(transactions)) return transactions;
        const [cards, categories] = await Promise.all([
          prisma.creditCard.findMany({ where: { person_name: owner }, select: { id: true } }),
          prisma.budgetCategory.findMany({ where: { budget: { person_name: owner } }, select: { id: true } }),
        ]);
        return filterTransactionsForPerson(
          transactions,
          new Set(cards.map((card) => card.id)),
          new Set(categories.map((category) => category.id)),
        );
      }
      case "card_transactions": {
        const id = requireNumber(cardId, "cardId");
        await assertCardAccess(id);
        const transactions = await callApi(queryPath(`/api/cards/${id}/transactions`, { month }), "GET");
        if (!owner || !Array.isArray(transactions)) return transactions;
        const categories = await prisma.budgetCategory.findMany({
          where: { budget: { person_name: owner } },
          select: { id: true },
        });
        return filterCardTransactionsForPerson(transactions, new Set(categories.map((category) => category.id)));
      }
      case "loan": {
        const loans = await callApi(queryPath("/api/loans", { person_name: owner }), "GET");
        if (!owner) return loans;
        return filterLoansForPerson(loans, owner, await getPersonBudgetIds(owner));
      }
      case "loan_payment": {
        if (loanId !== undefined) await assertEntityAccess("loan", loanId);
        const loans = await callApi(queryPath("/api/loans", { person_name: owner }), "GET") as LoanRecord[];
        const visibleLoans = owner
          ? filterLoansForPerson(loans, owner, await getPersonBudgetIds(owner))
          : loans;
        return visibleLoans
          .filter((loan) => loanId === undefined || loan.id === loanId)
          .flatMap((loan) => (loan.payments || []).map((payment) => ({
            ...payment,
            loan_id: loan.id,
            loan_name: loan.name,
          })));
      }
      case "card": {
        const cards = await callApi("/api/cards", "GET") as Array<{ id: number; person_name?: string | null }>;
        return owner ? cards.filter((card) => card.person_name === owner) : cards;
      }
      case "card_payment": {
        const id = requireNumber(cardId, "cardId");
        await assertCardAccess(id);
        const payments = await callApi(queryPath(`/api/cards/${id}/payments`, { month }), "GET");
        if (!owner || !Array.isArray(payments)) return payments;
        return filterCardPaymentsForPerson(payments, await getPersonBudgetIds(owner));
      }
      case "received_payment": {
        const id = requireNumber(budgetId, "budgetId");
        await assertBudgetAccess(id);
        return callApi(queryPath("/api/budgets/receive-payment", { budget_id: id }), "GET");
      }
      case "summary": {
        const summary = await callApi(queryPath("/api/summary", { month: requiredText(month, "month") }), "GET") as {
          summary?: JsonRecord;
          bon?: JsonRecord;
          ray?: JsonRecord;
        };
        if (!owner) return summary;
        return { person_name: owner, budget_summary: owner === "Bon" ? summary.bon : summary.ray };
      }
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
    assertScope("finance:write");
    const payload = parseRecord(entity, data);
    await assertCreateAccess(entity, payload, parentId);
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
  "finance_create_fixed_costs_bulk",
  {
    description: "Create several unpaid fixed costs for one budget in a single operation. Each item needs a name and positive amount, and may include an ISO due_date.",
    inputSchema: z.object({
      budget_id: z.number().int().positive(),
      items: z.array(z.object({
        name: z.string().trim().min(1),
        amount: z.number().positive(),
        due_date: z.string().nullable().optional(),
      })).min(1).max(100),
    }),
  },
  async ({ budget_id, items }) => runTool(async () => {
    assertScope("finance:write");
    await assertBudgetAccess(budget_id);
    return callApi("/api/fixed-costs/bulk", "POST", { budget_id, items });
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
    assertScope("finance:write");
    const updatedData = parseRecord(entity, data, true);
    await assertUpdateAccess(entity, id, updatedData);
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
    assertScope("finance:write");
    await assertEntityAccess(entity, id);
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

  return server;
}
