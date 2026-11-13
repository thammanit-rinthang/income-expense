# Income Expense MCP Server

The project supports local stdio MCP and ChatGPT Cloud through a remote Streamable HTTP endpoint. ChatGPT Cloud uses OAuth; the per-person API key is entered once on the authorization page and exchanged for short-lived, scoped tokens.

## Local MCP client

1. Start the app with `npm run dev`.
2. Configure your MCP client to run `npm run --silent mcp` from this project directory. The silent flag keeps npm output out of the MCP stdio channel.
3. If the app uses another local port, set `MCP_API_BASE_URL`, for example `http://127.0.0.1:3001`.

Example MCP client configuration (replace the path with the project directory):

```json
{
  "mcpServers": {
    "income-expense": {
      "command": "npm",
      "args": ["--prefix", "D:/projects/income-expense", "run", "--silent", "mcp"],
      "env": {
        "MCP_API_BASE_URL": "http://127.0.0.1:3000"
      }
    }
  }
}
```

## ChatGPT Cloud on Vercel

1. In Vercel, set `MCP_PUBLIC_URL` to `https://income-ashy.vercel.app`.
2. Set `MCP_KEY_ADMIN_SECRET` to a random secret with at least 32 characters. You can generate one locally with `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`. Keep this value private.
3. Apply the database migration from an environment with the production `DATABASE_URL` configured: `npm run db:migrate:deploy`.
4. Deploy the project. The MCP endpoint is `https://income-ashy.vercel.app/api/mcp`.
5. Open `https://income-ashy.vercel.app/mcp-keys`, choose Bon or Ray, select access, and press Generate. The page does not ask for an admin secret. The full key is shown once; only its hash is stored. Use `/mcp-keys/manage` with the admin secret to list or revoke keys.
6. In ChatGPT on the web, open **Plugins → + → Add custom MCP server**, enter the endpoint URL, and select OAuth authentication. ChatGPT will open the authorization page; enter the API key for the person whose data it should access.

The authorization server supports OAuth authorization code with PKCE (S256), dynamic client registration, refresh-token rotation, and token revocation. Revoking an API key immediately invalidates its MCP access and refresh tokens. Every MCP operation checks that records belong to the key's assigned person.

MCP API keys authorize read/write calls to the MCP endpoint. Key generation is public by design; listing and revoking keys require the admin secret. The existing web-app `/api/*` routes do not use these keys or require app sign-in, so they remain directly accessible independently of MCP authorization.

ChatGPT Pro currently supports custom MCP read/fetch actions; full write tools require Business, Enterprise, or Edu. Workspace permissions may also restrict adding custom MCP servers.

## Tools

- `finance_read`: read a budget, category list, fixed costs, transactions, card transactions and payments, loans and repayments, cards, received payments, or monthly summary. Supply `budgetId`, `cardId`, `personName`, or `month` as required by the selected entity. Cloud keys are scoped to their assigned person.
- `finance_create`: create a record. For `loan_payment`, provide `parentId` as the loan ID.
- `finance_create_fixed_costs_bulk`: create up to 100 unpaid fixed costs for one budget in one call.
- `finance_update`: edit a record by entity and ID. Supply only fields to change.
- `finance_delete`: delete a record. Supply `confirm: true` for the destructive operation.

## Record fields

All data fields use the API's `snake_case` names:

| Entity | Fields |
| --- | --- |
| `budget` | `person_name`, `month` or `month_year`, `total_income`, `reserved_amount` |
| `category` | `budget_id`, `name`, `monthly_budget` |
| `fixed_cost` | `budget_id`, `name`, `amount`, `due_date`, `is_paid` |
| `transaction` | `budget_id`, `amount`, `category_id` or `card_id`, `description`, `created_at` |
| `card_transactions` | `cardId`, optional `month`; reads transactions linked to a card, including its category relation |
| `loan` | `name`, `person_name`, `principal`, `interest_rate`, `term_months`, `budget_id`, `include_in_income`, `start_date` |
| `loan_payment` | `parentId` is the loan ID; fields are `budget_id`, `amount`, `note`, `paid_at` |
| `card` | `name`, `person_name`, `credit_limit`, `statement_balance`, `minimum_payment`, `due_date` |
| `card_payment` | `card_id`, `amount`, `budget_id`, `note`, `paid_at` |
| `received_payment` | `budget_id`, `amount`, `sender`, `note` |

Dates use ISO strings, preferably `YYYY-MM-DD`. Update tools accept partial fields. Card deletion is refused while linked activity or an outstanding balance remains.

The monthly summary is read-only because it is derived from budgets and payments. Budget deletion is refused while linked records remain, so remove those records first. The local stdio server only calls an API on `localhost`, `127.0.0.1`, or `::1` and does not open a network listener. ChatGPT Cloud uses the separate public HTTPS endpoint at `/api/mcp`. For MCP clients or AI agents that accept bearer API keys, send the generated `income_bon_...` or `income_ray_...` key as `Authorization: Bearer <key>`. ChatGPT uses OAuth instead because its connector does not accept caller-supplied API keys.
