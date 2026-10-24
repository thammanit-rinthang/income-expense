# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Individual or single household managing personal finances in Thailand. Primary persona tracks monthly salary cycles, mandatory recurring expenses, debt amortizations, credit cards, and daily disposable spending.

## Product Purpose

Eliminate financial uncertainty and accidental overspending by providing an immediate, reliable picture of real disposable cash ("Remaining Spending Pool") after accounting for fixed liabilities, savings reservations, and outstanding card charges.

## Positioning

Proactive pool budgeting over retroactive expense accounting: instead of simply categorizing money already spent, the system locks in upcoming obligations upfront, giving users an atomic, accurate spending threshold for everyday life.

## Operating Context

- Mobile on-the-go quick logging of daily expenses (e.g. food, transport, ad-hoc purchases).
- Desktop or tablet monthly review rituals: receiving income, auditing recurring bills, scheduling credit card and loan payments.
- Real-time status checks throughout the month to gauge remaining disposable budget.

## Capabilities and Constraints

- **Monthly Budget Cycle**: Core equation computes `Remaining Spending Pool = Total Income - Reserved Amount - Fixed Costs - Loan Payments - Card Payments - Category Spends`.
- **Integrated Accounts**: Synchronized management of budget categories, recurring fixed costs, active loans/installments, credit card statements/balances, and received extra payments.
- **Currency & Language**: Thai Baht (฿) with Thai/English bilingual microcopy and status alerts (e.g., "จ่ายแล้ว!").
- **Technical Constraints**:
  - Full-stack Next.js (App Router, Server Components, TypeScript strict mode).
  - PostgreSQL with Prisma ORM and atomic transaction guarantees.
  - Zustand for client state, TanStack React Query for cached data fetching, React Hook Form + Zod for input validation.
  - Flat design system: strict absence of drop shadows (`shadow-none`), light gray borders (`border-gray-200`), soft corner radii (`rounded-xl` / `rounded-lg`).

## Brand Commitments

- **Tone & Aesthetic**: Utilitarian "Workbench" layout with calm warm-rose accent palette (`tokens.css`); deliberate restraint without distracting gradients or visual clutter.
- **Responsiveness**: Instant tactile feedback with optimistic updates and quick-action modals.

## Evidence on Hand

- Production Next.js 16 / React 19 web application codebase at `app/` and `components/`.
- PostgreSQL data schema defined at `prisma/schema.prisma` covering `MonthlyBudget`, `FixedCost`, `Loan`, `Card`, `Transaction`, `BudgetCategory`, and `ReceivedPayment`.
- Canonical design token definitions in `tokens.css` (warm-rose hue, flat borders, compact spacing scales).

## Product Principles

1. **Truth Before Spend**: Surface the true disposable balance first; never let credit card limits or unreserved salary obscure upcoming liabilities.
2. **Zero-Friction Entry**: Logging an expense on mobile must take seconds with immediate feedback.
3. **Atomic Consistency**: Budget calculations, debt deductions, and pool allocations remain strictly synchronized without race conditions.
4. **Quiet Utilitarian Clarity**: Flat, shadowless UI with soft boundaries and calm colors to minimize cognitive clutter when reviewing personal finances.

## Accessibility & Inclusion

- WCAG 2.1 AA compliant contrast across warm-rose accents, card backgrounds, and ink text tokens.
- Generous mobile touch targets (minimum 44×44px for primary interactive elements and quick-action buttons).
- High readability for financial amounts with explicit currency symbols and localized digit formatting.
