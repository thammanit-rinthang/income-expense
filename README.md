# Personal Budget & Expense Management System

A modern, full-stack Next.js application designed to provide a comprehensive, real-time financial management dashboard. This system automates personal budgeting, handles fixed cost deductions, tracks credit card transactions, and synchronizes your spending pool seamlessly.

## 🛠 Tech Stack

### Core
*   **Framework:** [Next.js](https://nextjs.org/) (App Router, Server Components)
*   **Language:** [TypeScript](https://www.typescriptlang.org/) (Strict typing)

### Styling & UI
*   **CSS Framework:** [Tailwind CSS](https://tailwindcss.com/)
*   **Component Library:** [DaisyUI](https://daisyui.com/)
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **Notifications:** [React Hot Toast](https://react-hot-toast.com/)
*   **Utility:** `clsx`, `tailwind-merge`

### State Management & Data Fetching
*   **Global State:** [Zustand](https://zustand-demo.pmnd.rs/)
*   **Data Fetching & Caching:** [TanStack Query (React Query)](https://tanstack.com/query/latest)
*   **HTTP Client:** [Axios](https://axios-http.com/)

### Form Handling & Validation
*   **Forms:** [React Hook Form](https://react-hook-form.com/)
*   **Schema Validation:** [Zod](https://zod.dev/)

### Database & Backend
*   **ORM:** [Prisma](https://www.prisma.io/)
*   **Database:** PostgreSQL (with `@prisma/adapter-pg` and `pg`)

### Utilities
*   **Date Formatting:** [Day.js](https://day.js.org/)

---

## 🏗 Architecture & System Techniques

### 1. Strict TypeScript & Type Safety
The system is built with a "TypeScript First" philosophy. All components, API routes, and database models are strictly typed. Runtime validation is enforced using **Zod**, perfectly aligned with TypeScript interfaces. This ensures robust data integrity, specifically when handling financial inputs (e.g., parsing string inputs to numeric database values safely).

### 2. Atomic Database Transactions
To maintain a 100% accurate picture of current financial status, the system leverages atomic database transactions. This guarantees that complex operations—such as synchronizing the Remaining Spending Pool, category allocations, credit card balances, and individual transaction logs—occur securely without race conditions or double deductions.

### 3. Modern Next.js Architecture
The project strictly utilizes the **Next.js App Router**, prioritizing **Server Components** for secure, server-side data fetching and API interaction, while reserving Client Components only for areas requiring rich interactivity (using Zustand and React Query).

### 4. Minimalist "Flat" Design System
A strict, modern minimalist aesthetic is enforced across the UI:
*   **Shadowless:** All shadows are explicitly removed (`shadow-none`) in favor of a flat, clean interface.
*   **Borders & Radii:** Depth is achieved exclusively through light gray borders (`border-gray-200`) and soft rounded corners (`rounded-xl` / `rounded-lg`).
*   **Color Palette:** A custom, sophisticated, and calm "pink" theme is utilized, avoiding oversaturated colors to provide a premium feel.

### 5. Modular Clean Code Structure
The codebase follows a highly maintainable directory structure:
*   `/components` - Reusable, functional, and type-safe UI components.
*   `/lib` - Utility functions, database configurations, and shared logic.
*   `/hooks` - Custom React hooks for encapsulating complex logic (e.g., `useMonthlyBudget`, `useReceivedPayments`).
*   `/types` - Global TypeScript definitions and Zod schemas.
*   `/actions` - Server Actions for secure backend mutations.

### 6. Seamless UX & Error Handling
*   **Immediate Feedback:** Optimistic updates and instant toast notifications (e.g., "จ่ายแล้ว!" - Paid!) are triggered upon successful mutations.
*   **Intuitive Interactions:** Features a mobile-friendly layout with quick-action elements (like Floating Action Buttons for quick transaction entries) and streamlined modals for managing financial data.
