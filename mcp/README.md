# Income Expense MCP Server

The server uses stdio and calls the local Next.js API so financial balance updates continue through the same application logic as the UI.

## Start

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

## Tools

- `finance_read`: read a budget, category list, fixed costs, transactions, loans, loan payments, cards, card payments, received payments, or monthly summary. Supply `budgetId`, `cardId`, `personName`, or `month` as required by the selected entity.
- `finance_create`: create a record. For `loan_payment`, provide `parentId` as the loan ID.
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
| `loan` | `name`, `person_name`, `principal`, `interest_rate`, `term_months`, `budget_id`, `include_in_income`, `start_date` |
| `loan_payment` | `parentId` is the loan ID; fields are `budget_id`, `amount`, `note`, `paid_at` |
| `card` | `name`, `person_name`, `credit_limit`, `statement_balance`, `minimum_payment`, `due_date` |
| `card_payment` | `card_id`, `amount`, `budget_id`, `note`, `paid_at` |
| `received_payment` | `budget_id`, `amount`, `sender`, `note` |

Dates use ISO strings, preferably `YYYY-MM-DD`. Update tools accept partial fields. Card deletion is refused while linked activity or an outstanding balance remains.

The monthly summary is read-only because it is derived from budgets and payments. Budget deletion is refused while linked records remain, so remove those records first. MCP requests are restricted to `localhost`, `127.0.0.1`, or `::1`; the server does not listen on a network port.
