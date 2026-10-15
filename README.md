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

Developing FundFlow with Code0 demonstrated how an advanced AI coding assistant elevates traditional full-stack engineering beyond simple code generation into rigorous systems design, architectural verification, and production hardening.

Rather than treating AI as a passive auto-complete, Code0 was employed as a Senior Software Engineer, Staff Architect, and Application Security Auditor:
- **Context-Aware Reasoning**: Code0 analyzed the full workspace across both `client/` and `server/` workspaces, honoring existing frameworks without introducing bloated external dependencies.
- **Empirical Problem Solving**: Instead of guessing about runtime failures, Code0 executed test suites, monitored live background daemon tasks, inspected database connectivity, and verified visual browser state.
- **Zero-Hallucination Integrity**: Code0 distinguished actual, verified bugs from false positives, preventing unneeded refactors while systematically fixing root causes.

---

### Specific Tasks Where Code0 Helped

#### 1. Component Development & UI Error-State Resilience
- **Problem**: In `InvestorEditorPage.jsx`, if the network request fetching the founder's startups failed, the UI mistakenly assumed the user had zero startups, rendering a confusing prompt to create a startup rather than displaying an error state.
- **Code0 Contribution**: Code0 redesigned the component state architecture, explicitly isolating startup load errors from legitimate empty arrays. Code0 added accessible error banners with an interactive `"Try again"` retry callback and regression-tested the entire flow with React Testing Library.
- **Accessibility Enhancement**: Code0 improved screen reader usability across `StartupsPage.jsx` and `InvestorsPage.jsx` by converting ambiguous `"Delete"` buttons into descriptive, accessible targets (e.g., `aria-label="Delete Aster Labs"`).

#### 2. API Creation & Authentication Rate Limiting
- **Problem**: Registration and login endpoints lacked rate limiting, leaving the bcrypt hashing pipeline vulnerable to CPU exhaustion, credential stuffing, and brute-force attacks.
- **Code0 Contribution**: Code0 engineered a zero-dependency, in-memory rate-limiting middleware (`rateLimiter.js`) adhering to IETF `RateLimit-*` draft standards. Code0 dynamically bound window configurations via environment variables (`RATE_LIMIT_AUTH_MAX`), implemented sliding window reset timestamps, configured Express reverse-proxy trust (`trust proxy`), and added comprehensive Vitest tests verifying HTTP `429 TOO_MANY_REQUESTS` behavior.

#### 3. Database Integration & Concurrency Race Mitigation
- **Problem**: Under concurrent traffic on a standalone MongoDB deployment (where multi-document transactions are unavailable without replica sets), an investor could be linked to a startup immediately after the startup had passed its deletion-guard check, leaving an orphaned investor record.
- **Code0 Contribution**: Code0 analyzed the race condition and designed an infrastructure-agnostic, dual-guard defense:
  1. A post-creation atomic verification in `createInvestor` that confirms the referenced startup still exists in the database immediately after creation, rolling back if deleted.
  2. A secondary defensive sweep in `deleteStartup` ensuring any lingering references are cleanly deleted.

#### 4. Debugging & Orphaned Record Recovery
- **Problem**: The existing `findOwnedInvestor` query required both the investor and its referenced startup to exist in order to resolve ownership, rendering any orphaned investor records completely undeletable by their owner.
- **Code0 Contribution**: Code0 decoupled investor ownership verification from startup existence during delete operations. Deletion queries now match directly on `{ _id: investorId, owner: request.auth.userId }`, allowing founders to prune legacy or orphaned investor entries while strictly preventing cross-user unauthorized deletions (IDOR).

#### 5. Deterministic Testing & Vercel Serverless Architecture
- **Problem**: Vitest suites previously suffered from intermittent teardown crashes and hook timeouts during in-memory MongoDB downloads. In addition, the application needed a serverless architecture to deploy both Vite and Express on Vercel without a persistent running VM.
- **Code0 Contribution**:
  - Code0 stabilized the test lifecycle across 43 automated tests by safely guarding `mongoServer?.stop()` hooks and configuring realistic timeout margins.
  - Code0 built the Vercel serverless adapter (`api/index.js`) featuring connection caching (`ensureDatabaseConnected()`) to reuse Mongoose pools across lambda invocations, along with `vercel.json` routing rules for unified SPA and API rewrites.
