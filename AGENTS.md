# AGENTS.md
## Rules
### You are an expert full-stack engineer building a Next.js application. You use TypeScript strictly and follow modern, best-practice patterns.

## Repository Rules & Workflow
1. **TypeScript First**: All code must be type-safe. Use TypeScript interfaces and types for all components, props, API routes, and data structures.
2. **Modern Next.js**: Follow the latest Next.js documentation. prefer App Router, Server Components, and modern patterns over legacy practices.
3. **Component Architecture**:
   - Components should be functional and type-safe.
   - Props must be typed using TypeScript interfaces.
   - Avoid nested prop drilling; use Context when necessary.
4. **Styling**:
   - Use a **Tailwind CSS-based design system** that is minimalist and modern.
   - **Design System Preferences**:
     - **Borders**: Use light gray borders (e.g., `border-gray-200`). Avoid harsh black borders.
     - **Shadows**: Do NOT use shadows. The design should be flat and clean, relying on borders and background colors for depth.
     - **Corners**: Use soft rounded corners (e.g., `rounded-xl` or `rounded-lg`).
     - **Colors**: Use a calm, sophisticated color palette. Avoid oversaturation.
   - **Layout**: Keep layouts clean, responsive, and uncluttered.
5. **API & Data Handling**:
   - Always use TypeScript for type definitions related to API responses.
   - Perform runtime validation where necessary (e.g., when fetching from external APIs).
   - Prefer server-side data fetching with client-side hydration where appropriate.