# FundFlow — Startup Funding & Investor Pipeline Tracker

FundFlow is a modern, full-stack MERN application engineered for founders and venture operators to track startup fundraising rounds, manage investor relationships, and monitor real-time pipeline analytics. Built with an architecture enforcing strict multi-tenant ownership, each authenticated founder has a private workspace of startups and linked investor records.

---

## Key Features

- **Multi-Tenant Portfolio Tracking**: Founders manage isolated startup profiles with tailored fundraising targets, capital raised, industry categorization, and pitch materials.
- **Investor Relationship Management (CRM)**: Track individual angel and institutional investors across customizable pipeline stages (`potential`, `contacted`, `meeting_scheduled`, `committed`, `passed`).
- **Real-Time Pipeline Analytics & Aggregation Engine**: Dynamic dashboard computing aggregate capital raised, target progress percentages, status breakdowns, and categorized follow-up metrics.
- **Intelligent Follow-Up Schedules**: Proactively flags overdue follow-ups, actions due today, and upcoming touchpoints over the next 7 days in UTC.
- **Hardened Security & Authentication**: HTTP-only, `SameSite=Strict`, `Secure` JWT session cookies immune to XSS token theft, paired with bcrypt password hashing (enforcing 72-byte truncation boundaries).
- **Brute-Force & Denial-of-Service Protection**: Configurable in-memory IP rate limiting on authentication routes with standard `RateLimit-*` and `Retry-After` headers and reverse-proxy (`trust proxy`) compatibility.
- **Referential Integrity & Standalone MongoDB Safety**: Application-level deletion guards (`409 STARTUP_HAS_INVESTORS`) preventing orphaned records without mandating multi-document replica set transactions.
- **Zero-Config Vercel Serverless Ready**: Native deployment configuration featuring pooled Mongoose connection caching and unified SPA routing.

---

## Technologies Used

| Tier | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 6, Tailwind CSS v4, React Router 7, Axios |
| **Backend** | Node.js (>=20.19.0), Express 5, Mongoose 8 |
| **Database** | MongoDB / MongoDB Atlas, `mongodb-memory-server` (for isolated integration tests) |
| **Validation & Security** | Zod 3, JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `cookie-parser`, `helmet` |
| **Testing** | Vitest 5, Supertest 7, React Testing Library, `@testing-library/jest-dom` |
| **Deployment** | Vercel Serverless Functions (`@vercel/node`), Vercel Edge Network |

---

## Setup & Installation Instructions

### 1. Prerequisites
- **Node.js**: Version `20.19.0` or higher
- **npm**: Version `10.0.0` or higher
- **MongoDB**: A running local MongoDB daemon (`mongodb://127.0.0.1:27017/fundflow`) or a MongoDB Atlas cluster URI (`mongodb+srv://...`)

### 2. Clone and Install Dependencies
FundFlow is structured as an npm workspaces monorepo containing `client` and `server` packages. Install all dependencies from the root directory:

```sh
git clone https://github.com/Dilshad-shaik-14/FundFlow.git
cd FundFlow
npm install
```

### 3. Environment Configuration

#### Server Environment (`server/.env`)
Copy the server template file and populate your environment variables:

```sh
cp server/.env.example server/.env
```

Edit `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/fundflow?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
RATE_LIMIT_AUTH_MAX=20
TRUST_PROXY=1
```

> **Tip**: Generate a cryptographically secure 64-character JWT secret via:
> ```sh
> node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
> ```

#### Client Environment (`client/.env`)
Copy the client template file:

```sh
cp client/.env.example client/.env
```

Edit `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```
*(When deployed to Vercel on the same domain, `VITE_API_URL` defaults automatically to `/api`).*

---

## Instructions to Run the Application

### 1. Development Mode
Run both backend API and frontend client in parallel:

```sh
# Terminal 1: Backend API (Node --watch, port 5000)
npm run dev:server

# Terminal 2: Frontend Client (Vite, port 5173)
npm run dev:client
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

### 2. Instant Database Seeder (Demo Data)
To populate sample startups (*HyperScale AI*, *GreenPulse Energy*, *NovaHealth*) and realistic investor pipelines (*Committed*, *Meeting Scheduled*, *Contacted*, *Potential*, *Passed*) with follow-up triggers:

```sh
npm run seed
```
Refresh [http://localhost:5173/dashboard](http://localhost:5173/dashboard) to immediately explore the live metrics and progress bars.

### 3. Running Automated Tests
Run the entire 43-test suite across client and server:

```sh
npm test
```
All integration tests utilize `mongodb-memory-server` for zero-external-dependency execution.

### 4. Production Build
Compile the client application for production:

```sh
npm run build
```
Production assets are generated in `client/dist`.

### 5. Deploying to Vercel
FundFlow is pre-configured with `vercel.json` and a serverless entrypoint at `api/index.js`:

1. Import the repository in [Vercel](https://vercel.com/new).
2. Set the Root Directory to `./`.
3. Add Environment Variables in Vercel Project Settings:
   - `MONGODB_URI`: Your MongoDB Atlas connection URI.
   - `JWT_SECRET`: Secure 32+ character secret.
   - `NODE_ENV`: `production`
   - `TRUST_PROXY`: `1`
4. Deploy! Vercel serves the Vite SPA and routes all `/api/*` traffic to the serverless function.

---

## API Overview

All API endpoints enforce strict JSON payloads. Responses follow standard envelope formats:
- **Success**: `{ "success": true, "data": ... }`
- **Error**: `{ "success": false, "error": { "code": "...", "message": "..." } }`

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | API health and operational status | Public |
| `GET` | `/api` | Root API service information | Public |
| `POST` | `/api/auth/register` | Register new founder account (Rate-limited) | Public |
| `POST` | `/api/auth/login` | Authenticate founder and set session cookie (Rate-limited) | Public |
| `POST` | `/api/auth/logout` | Clear authenticated session cookie | Authenticated |
| `GET` | `/api/auth/me` | Fetch currently authenticated user profile | Authenticated |
| `GET`, `POST` | `/api/startups` | List or create account-owned startups | Authenticated |
| `GET`, `PATCH`, `DELETE` | `/api/startups/:id` | Read, update, or safely delete a startup | Authenticated |
| `GET`, `POST` | `/api/investors` | List or create investors (supports `status` and `startupId` filters) | Authenticated |
| `GET`, `PATCH`, `DELETE` | `/api/investors/:id` | Read, update, or delete an investor | Authenticated |
| `GET` | `/api/dashboard/metrics`| Retrieve aggregate fundraising progress and follow-up metrics | Authenticated |

---

## Confirmation of Code0 Usage

**Confirmation:** **Code0** was utilized as the primary AI software engineering and pair-programming system throughout the conception, architectural auditing, defect remediation, security hardening, testing, and deployment preparation of the FundFlow application.

---

## AI Development Experience (with Code0)

Developing and auditing FundFlow with **Code0** demonstrated how an advanced agentic AI coding assistant elevates full-stack engineering beyond simple code completion into rigorous systems design, vulnerability remediation, concurrency analysis, and production cloud architecture.

Rather than acting as a passive generative assistant, Code0 operated as an interactive Senior Software Engineer, Staff Architect, and Application Security Reviewer embedded directly into the developer workflow.

---

### Collaborative Methodology & Engineering Workflow

Throughout the project lifecycle, Code0 was leveraged in a structured, five-stage engineering cycle:

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ 1. Architectural │ ──> │ 2. Root-Cause    │ ──> │ 3. Test-Driven   │ ──> │ 4. Empirical     │ ──> │ 5. Production    │
│    Audit & Scan  │     │    Diagnosis     │     │    Remediation   │     │    Verification  │     │    Deployment    │
└──────────────────┘     └──────────────────┘     └──────────────────┘     └──────────────────┘     └──────────────────┘
```

1. **Context-Aware Auditing**: Code0 ingested both `client/` and `server/` workspaces, reading source files, package manifests, and test suites to build a comprehensive dependency graph and threat model without hallucinating missing abstractions.
2. **Strict Engineering Boundaries**: Code0 honored firm architectural constraints: zero unnecessary package installations, zero changes to established libraries (React 19, Express 5, Mongoose 8, Tailwind CSS v4), strict preservation of standalone MongoDB compatibility (avoiding forced replica-set transaction requirements), and absolute confidentiality regarding secrets and environment credentials.
3. **Empirical Tool-Assisted Validation**: Instead of speculating on runtime behavior, Code0 actively executed commands, managed background server daemons, probed database ports, ran Vitest suites with in-memory MongoDB instances, and inspected live DOM hierarchies using automated browser subagents.
4. **Distinguishing Defects from False Positives**: Code0 critically reviewed findings from prior audits, identifying which were genuine security/data integrity hazards (such as orphaned investor traps or auth endpoints lacking rate limiting) and which were overstated recommendations (such as mandating Mongoose `.populate()` without query profiling).

---

### Detailed Deep-Dives: 5 Core Tasks Where Code0 Drove Engineering

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CORE TASKS POWERED BY CODE0                                         │
├───────────────────────────────┬───────────────────────────────┬───────────────────────────────────────┤
│ 1. UI Error & A11y Resilience │ 2. Rate Limiting Security     │ 3. Standalone Concurrency Mitigation  │
│    (React 19 / WCAG 2.2 AA)   │    (IETF Draft Middleware)    │    (TOCTOU Race Dual-Guards)          │
├───────────────────────────────┴───────────────────────────────┴───────────────────────────────────────┤
│ 4. Data Recovery & Refactoring                                5. Serverless Cloud Architecture        │
│    (Orphaned Record Cleanup & IDOR Defense)                      (Vercel Adapter & Vitest Lifecycle)  │
└───────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Task 1: Component Development, UX Error Resilience & Accessibility
- **The Challenge**: In `InvestorEditorPage.jsx`, if the network request fetching the founder's startups failed, the component collapsed the error into an empty array (`startups = []`). This presented a deceptive empty state prompting the founder to *"Create a startup first"*, hiding the underlying network or server failure and blocking user progress. Furthermore, action buttons across `StartupsPage.jsx` and `InvestorsPage.jsx` had generic `"Delete"` labels that failed WCAG 2.2 accessible name guidelines for screen readers.
- **Code0's Solution**:
  - **State Machine Decoupling**: Code0 separated data loading states into distinct `isLoading`, `error`, and `data` channels. If fetching fails, the page renders an accessible, dismissible alert with an interactive `"Try again"` retry callback rather than misinforming the user.
  - **Accessible Name Resolution**: Code0 transformed all destructive table actions into record-specific accessible labels (e.g., `aria-label="Delete Acme AI"` and `aria-label="Delete Sarah Chen"`), allowing assistive technology users to discern the exact entity being targeted.
  - **Testing**: Code0 authored React Testing Library regression tests verifying both the retry mechanism and accessible name queries.

#### Task 2: API Creation & IETF-Compliant Rate Limiting Security
- **The Challenge**: The `/api/auth/register` and `/api/auth/login` endpoints were completely unrestricted. Because password verification relies on computationally intensive `bcrypt` hashing, unthrottled endpoints left the server vulnerable to CPU starvation, credential stuffing, and brute-force dictionary attacks.
- **Code0's Solution**:
  - **Zero-Dependency In-Memory Rate Limiter**: Rather than pulling in bulky third-party packages, Code0 engineered a tailored sliding-window rate limiter (`server/src/middleware/rateLimiter.js`) backed by an in-memory `Map` with automatic window eviction.
  - **Standardized Headers**: The middleware returns HTTP `429 TOO_MANY_REQUESTS` accompanied by IETF standard headers: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, and `Retry-After`.
  - **Reverse-Proxy Defense**: Configured Express `trust proxy` support so client IP resolution correctly parses `X-Forwarded-For` headers behind reverse proxies (Vercel, Render, AWS ALB, NGINX) without exposing spoofable IP headers.
  - **Password Boundary Protection**: Enforced RFC 7613 UTF-8 byte boundary validation (`Buffer.byteLength(password, 'utf8') <= 72`) to preempt bcrypt silent truncation vulnerabilities.
  - **Verification**: Created 9 automated integration tests validating rate-limit triggers, reset intervals, expired/tampered JWT rejection, and malformed body handling.

#### Task 3: Database Integration & Concurrency Race Mitigation
- **The Challenge**: FundFlow is designed to support standalone MongoDB instances where multi-document ACID transactions are not available. Under concurrent requests, a Time-of-Check to Time-of-Use (TOCTOU) race condition could occur:
  1. *Request A* checks whether Startup $S$ has linked investors and finds none.
  2. *Request B* creates an investor record pointing to Startup $S$.
  3. *Request A* deletes Startup $S$.
  This sequence could leave an investor referencing a nonexistent startup, corrupting relational integrity.
- **Code0's Solution**:
  - **Dual-Guard Defense**: Code0 designed an infrastructure-agnostic mitigation strategy:
    1. **Post-Creation Verification**: In `createInvestor`, after inserting the investor document, an atomic query immediately verifies that the referenced startup still exists in the database. If the startup was concurrently removed, the newly created investor is automatically rolled back with a `404 STARTUP_NOT_FOUND` error.
    2. **Defensive Post-Delete Cleanup**: In `deleteStartup`, after removing the startup document, a defensive `Investor.deleteMany({ startup: startupId, owner: ownerId })` sweep runs to guarantee zero orphaned records persist.
  - **Outcome**: Referential consistency is preserved under concurrent execution without requiring a replica set cluster or distributed lock infrastructure.

#### Task 4: Debugging & Orphaned Record Recovery (Data Integrity)
- **The Challenge**: An audit identified that the existing helper `findOwnedInvestor` enforced a strict join condition requiring both the investor *and* its associated startup to exist in order to resolve ownership. Consequently, if an investor record ever became orphaned (e.g. from manual database edits or legacy data), the owner could never delete or manage the record because the query failed before reaching the delete handler.
- **Code0's Solution**:
  - **Decoupled Ownership Verification**: Code0 refactored `deleteInvestor` to verify ownership directly on the `Investor` document (`{ _id: investorId, owner: request.auth.userId }`) without demanding that the parent startup still exist.
  - **Strict Multi-Tenant Isolation**: Code0 ensured that while owners can delete orphaned records, cross-tenant authorization remains impenetrable: another user attempting to delete the orphaned record is rejected with an HTTP `404` without leaking record existence.
  - **Regression Test Suite**: Code0 authored integration tests reproducing the orphaned data state and asserting successful deletion by the authenticated owner and rejection of unauthorized third parties.

#### Task 5: Deterministic Testing & Vercel Serverless Architecture
- **The Challenge**:
  1. **Test Flakiness & Timeouts**: Vitest test suites suffered from unhandled promise rejections during in-memory MongoDB teardown hooks (`mongoServer?.stop()`), as well as hook timeouts when downloading MongoDB binaries in CI.
  2. **Cloud Serverless Deployment**: The Express server was tightly bound to `app.listen()` on a dedicated port. Deploying to Vercel required adapting the application to a stateless serverless architecture while preventing database connection exhaustion (cold-start connection storms).
- **Code0's Solution**:
  - **Test Lifecycle Hardening**: Code0 guarded all `afterAll` hooks with optional chaining and null checks, extended Vitest's `hookTimeout` and `testTimeout` margins in `server/vitest.config.js`, and expanded the test suite to **43 deterministic passing tests** (12 client, 31 server).
  - **Serverless Function Adapter (`api/index.js`)**: Code0 built a serverless entrypoint that wraps the Express app with a connection pooling manager (`ensureDatabaseConnected()`). By checking `mongoose.connection.readyState === 1`, the adapter reuses established database sockets across lambda invocations.
  - **Vercel Routing (`vercel.json`)**: Configured Vercel build commands, static output directories (`client/dist`), rewrite rules for SPA history fallback, and API endpoint proxying.
  - **Smart Client Fallback**: Updated `client/src/lib/api.js` so that in production, the client automatically defaults to `/api` on the same origin, eliminating cross-origin CORS overhead and third-party cookie restrictions.

---

### Key Lessons & Best Practices from Code0 Collaboration

1. **Verify Before Modifying**: Code0's approach of verifying reported audit findings against actual source code before proposing changes prevented unnecessary rewrites and protected working production logic.
2. **Prefer Native & Zero-Dependency Solutions**: Solving rate limiting and race conditions with focused, in-memory and schema-level guards avoided dependency bloat and simplified maintenance.
3. **Automate Continuous Verification**: Pairing AI changes with immediate terminal test execution (`npm test`), production bundling (`npm run build`), and browser validation ensured that zero regressions were introduced into the codebase.
