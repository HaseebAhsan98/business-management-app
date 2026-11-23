# Business Management Web Application — Technical Decisions & Assumptions

This document records architectural, technical, and implementation decisions made in accordance with the Master Prompt and SDD v1.4.

---

## 1. Technology Stack Decisions (Master Prompt Overrides)

| Component | Choice in Master Prompt | Rejected from SDD v1.4 | Rationale |
|---|---|---|---|
| **Frontend Framework** | **Next.js 14+ (App Router)** | React Native (Expo) | Master Prompt mandates a single responsive web application for desktop, tablet, and mobile browsers. No mobile app codebases. |
| **Backend Architecture** | **Next.js Server Actions & Route Handlers** | NestJS REST API | Eliminates dual-codebase overhead; provides type-safe server RPCs, seamless server component integration, and unified deployment on Vercel. |
| **Database ORM/Access** | **Supabase Client (`@supabase/supabase-js`, `@supabase/ssr`) + Raw SQL RPCs** | Prisma ORM | Follows Master Prompt preference; leverages native PostgreSQL stored procedures and row-level locking for critical financial transactions without Prisma runtime overhead. |
| **UI Components & Styling** | **Tailwind CSS + shadcn/ui (Radix Primitives)** | React Native Paper / Tamagui | Best-in-class accessibility, performance, responsive layout ergonomics, and professional business dashboard aesthetic. |
| **Validation** | **Zod + React Hook Form** | Same (Zod / RHF) | Retains strict schema validation shared across client forms and server actions. |
| **Reporting & Export** | **jsPDF + ExcelJS** | PDFKit / Native print | Robust browser and server-side PDF generation and Excel workbook streaming without native binary dependencies. |
| **Charting** | **Recharts** | Victory Native / react-native-gifted-charts | Native responsive SVG charting designed specifically for React/Web dashboards. |

---

## 2. Architecture & Design Decisions

### DEC-01: Single Responsive Web Application
- **Decision**: Deliver one responsive web application accessible on desktop, laptop, tablet, and mobile browsers (iOS Safari, Android Chrome).
- **Implementation**:
  - Desktop view: Collapsible left sidebar navigation, expansive data tables with column sorting, inline action bars.
  - Mobile view: Fixed bottom navigation bar (Home, Orders, Parties, Stock, More), card-based lists instead of wide horizontal tables, prominent sticky `+ New Order` floating action button, large touch targets (min 44px).

### DEC-02: PostgreSQL Stored Procedures for Critical Transactions
- **Decision**: Execute order delivery (FIFO batch allocation and stock deduction), payment allocation waterfalls, and order reversals inside PostgreSQL database functions (`LANGUAGE plpgsql`) wrapped in explicit transactions with row-level locks (`SELECT ... FOR UPDATE`).
- **Rationale**: Guarantees strict ACID compliance. Prevents race conditions such as two salesmen simultaneously selling the last remaining carton of stock.

### DEC-03: Security & Role-Based Data Masking
- **Decision**: Enforce role checks in both Supabase Row Level Security (RLS) and Next.js server actions / route handlers.
- **Implementation**:
  - API responses and server actions strip `cost_rate_per_piece`, `total_cost`, `line_profit`, and purchase data when the authenticated user has role `SALESMAN`.
  - Salesmen can query only their own orders (`salesman_id = auth.uid()`).
  - Owner and Manager have unrestricted access to all financial metrics.

### DEC-04: Numeric Precision & Monetary Integrity
- **Decision**:
  - Money amounts: `NUMERIC(14, 2)`
  - Unit piece costs: `NUMERIC(14, 4)`
  - Stock quantities: `INTEGER` base units (pieces)
- **Rationale**: Completely avoids floating-point inaccuracies. Storing base units in pieces guarantees that carton/piece conversions never produce fractional inventory errors.

### DEC-05: Timezone Handling
- **Decision**: Store all timestamps in UTC (`TIMESTAMPTZ`), render in `Asia/Karachi` using `date-fns-tz`, formatted as `DD-MM-YYYY HH:mm`.
- **Rationale**: Ensures consistency across servers and mobile client devices regardless of local system time settings.

### DEC-06: Duplicate Customer Matching Algorithm
- **Decision**: In the party creation dialog, match candidate customer names against existing customers in the selected area using normalized case-insensitive token matching (and Levenshtein distance where available).
- **Behavior**: If a customer named "Iqbal - KS" exists in "Landhi", typing "Iqbal KS" in "Landhi" displays an alert: *"Is this the same party? Existing: Iqbal - KS (Landhi)"* with an option to open the existing party or confirm creation of a distinct account.

### DEC-07: Phase Boundary Enforcement
- **Decision**: Strictly confine initial development to **Phase 1 (MVP)**.
- **Scope Boundary**: Features belonging to Phase 2 (Sales returns, damage notes, promotional schemes, offline mode, multi-language Urdu) and Phase 3 (Barcode scanning, expiry tracking, multi-godown) are designed for in database schemas (e.g. `sales_returns` table exists) but remain excluded from Phase 1 UI and workflows until Phase 1 passes all acceptance criteria.
